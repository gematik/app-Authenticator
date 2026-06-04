/*
 * Copyright 2026, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import http, { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { app, BrowserWindow, ipcMain } from 'electron';
import { logger } from '@/main/services/logging';
import {
  IPC_AUTH_FLOW_FINISHED,
  IPC_START_AUTH_FLOW_EVENT,
  LOCAL_HTTP_SERVER,
  REDIRECT_URI_APP_NAME_MAPPING,
} from '@/constants';

const { PATHS, QUERY_PARAMS, ERROR_CODES, AUTH_FLOW_TIMEOUT_MS, DEV_ALLOWED_ORIGIN } = LOCAL_HTTP_SERVER;

// Allow-list is derived from the known RP redirect_uri mapping (one origin
// per registered RP) plus the local sample RP origin in dev / mock builds.
function buildAllowedOrigins(): string[] {
  const origins = new Set<string>();
  for (const redirectUri of Object.keys(REDIRECT_URI_APP_NAME_MAPPING)) {
    try {
      origins.add(new URL(redirectUri).origin);
    } catch (err) {
      logger.warn(`LocalHttpServer: Skipping malformed redirect_uri in mapping: ${redirectUri}`, err);
    }
  }
  const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const isMock = process.env.MOCK_MODE === 'ENABLED';
  if (isDev || isMock) {
    origins.add(DEV_ALLOWED_ORIGIN);
  }
  return Array.from(origins);
}

let cachedAllowedOrigins: string[] | null = null;
function getAllowedOrigins(): string[] {
  if (cachedAllowedOrigins === null) {
    cachedAllowedOrigins = buildAllowedOrigins();
  }
  return cachedAllowedOrigins;
}

let server: http.Server | null = null;
let currentPort: number | null = null;
// Set by the deeplink and MANDATORY in server mode: if it is null/empty the
// /authorize gate fails closed (no flow can be driven without it).
let expectedHandshakeId: string | null = null;
// Resolved per-request; macOS may close & re-create the window mid-session.
let getMainWindow: (() => BrowserWindow | null) | null = null;

type PendingFlow = {
  flowId: string;
  res: ServerResponse;
  timeout: NodeJS.Timeout;
};

// At most one in-flight auth flow at a time; a second GET /authorize gets 409.
let pendingFlow: PendingFlow | null = null;
let ipcFlowFinishedListener: ((event: unknown, payload: unknown) => void) | null = null;

export function isLocalHttpServerRunning(): boolean {
  return server !== null && server.listening;
}

export function getLocalHttpServerPort(): number | null {
  return currentPort;
}

function validateOrigin(req: IncomingMessage): string | null {
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  const originStr = Array.isArray(origin) ? origin[0] : origin;
  if (!originStr) {
    return null;
  }

  // Match against the URL's origin (scheme + host + port), not its full path.
  let candidate: string;
  try {
    candidate = new URL(originStr).origin;
  } catch {
    return null;
  }

  return getAllowedOrigins().includes(candidate) ? candidate : null;
}

function setCorsHeaders(res: ServerResponse, origin: string): void {
  // The probe is a simple GET, so only Allow-Origin is read by the browser;
  // preflight-only headers (Allow-Methods/Headers, Max-Age) aren't needed.
  res.setHeader('Access-Control-Allow-Origin', origin);
}

function sendJsonResponse(res: ServerResponse, statusCode: number, body: Record<string, unknown>): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

// The auth result is delivered as a 302 to the IDP-registered redirect_uri,
// followed by the browser — never returned as data the caller can read.
function sendRedirect(res: ServerResponse, location: string): void {
  res.writeHead(302, { Location: location });
  res.end();
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

// HTML for any /authorize failure that isn't a redirect — the endpoint is
// navigated to, so a JSON body would render as raw text in the tab.
function sendErrorPage(res: ServerResponse, statusCode: number, message: string): void {
  res.writeHead(statusCode, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(
    `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Authenticator</title></head>` +
      `<body style="font-family:sans-serif;text-align:center;padding:2rem">` +
      `<h1>Anmeldung fehlgeschlagen</h1><p>${escapeHtml(message)}</p></body></html>`,
  );
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// DNS-rebinding defense: only answer requests whose Host addresses our loopback
// interface on the bound port — a rebound attacker domain sends its own Host.
function isLoopbackHost(hostHeader: string | undefined, port: number | null): boolean {
  if (!hostHeader || port === null) {
    return false;
  }
  const host = hostHeader.toLowerCase();
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

function createRequestHandler() {
  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const parsedUrl = new URL(req.url || '/', `http://localhost:${currentPort}`);
    const method = req.method?.toUpperCase() || 'GET';
    const pathname = parsedUrl.pathname;

    logger.debug(`LocalHttpServer: ${method} ${pathname} from ${req.headers['origin'] || 'unknown origin'}`);

    try {
      // DNS-rebinding guard: reject any Host that isn't our loopback host:port,
      // for BOTH endpoints, before any routing.
      if (!isLoopbackHost(req.headers.host, currentPort)) {
        logger.warn(`LocalHttpServer: rejected ${method} ${pathname} — disallowed Host header: ${req.headers.host}`);
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
      }

      // /status is polled by the RP via a CORS fetch (it carries an Origin and
      // reads the JSON), so it stays behind the Origin allow-list + CORS.
      if (pathname === PATHS.STATUS) {
        const origin = validateOrigin(req);
        if (!origin) {
          logger.warn(`LocalHttpServer: Rejected /status from disallowed origin: ${req.headers['origin']}`);
          sendJsonResponse(res, 403, {
            error: ERROR_CODES.ORIGIN_NOT_ALLOWED,
            error_description: 'The request origin is not allowed',
          });
          return;
        }
        setCorsHeaders(res, origin);
        if (method === 'GET') {
          sendJsonResponse(res, 200, {
            version: app.getVersion(),
            status: 'ready',
            port: currentPort,
            handshake_id: expectedHandshakeId,
          });
          return;
        }
        sendJsonResponse(res, 405, { error: ERROR_CODES.NOT_FOUND });
        return;
      }

      // The auth endpoint is reached by a top-level BROWSER NAVIGATION, which
      // carries no Origin header — so it is deliberately NOT behind the Origin
      // allow-list. Security comes from delivering the result only as a 302 to
      // the IDP-registered redirect_uri (never as data the caller can read)
      // plus the handshake_id check — not from the absent / forgeable Origin.
      if (pathname === PATHS.AUTH && method === 'GET') {
        await handleAuthRequest(parsedUrl, res);
        return;
      }

      sendErrorPage(res, 404, 'Not found.');
    } catch (error) {
      logger.error('LocalHttpServer: Unhandled error in request handler', error);
      sendErrorPage(res, 500, 'Internal error');
    }
  };
}

async function handleAuthRequest(parsedUrl: URL, res: ServerResponse): Promise<void> {
  if (pendingFlow) {
    logger.warn(`LocalHttpServer: /authorize rejected [${ERROR_CODES.FLOW_ALREADY_IN_PROGRESS}]`);
    sendErrorPage(res, 409, 'Another auth flow is already pending on this Authenticator.');
    return;
  }

  const challengePath = parsedUrl.searchParams.get(QUERY_PARAMS.CHALLENGE_PATH) ?? '';
  const handshakeId = parsedUrl.searchParams.get(QUERY_PARAMS.HANDSHAKE_ID) ?? '';
  if (!challengePath) {
    logger.warn(`LocalHttpServer: /authorize rejected [${ERROR_CODES.MISSING_CHALLENGE_PATH}]`);
    sendErrorPage(res, 400, 'Request must include a challenge_path query parameter.');
    return;
  }

  // handshake_id is mandatory — only the RP session that opened the deeplink may
  // drive /authorize. No handshake_id set on startup ⇒ fail closed, never run
  // the full card+PIN flow for an unverified caller.
  if (!expectedHandshakeId) {
    logger.error(
      `LocalHttpServer: rejected /authorize — server started without a handshake_id [${ERROR_CODES.HANDSHAKE_MISMATCH}]`,
    );
    sendErrorPage(res, 403, 'Authenticator was started without a handshake_id; cannot authorize this request.');
    return;
  }
  if (!handshakeId) {
    logger.warn(`LocalHttpServer: rejected /authorize — handshake_id missing [${ERROR_CODES.HANDSHAKE_MISMATCH}]`);
    sendErrorPage(res, 403, 'Request must include a handshake_id query parameter.');
    return;
  }
  if (handshakeId !== expectedHandshakeId) {
    logger.warn(`LocalHttpServer: rejected /authorize — handshake_id mismatch [${ERROR_CODES.HANDSHAKE_MISMATCH}]`);
    sendErrorPage(res, 403, 'handshake_id does not match the deeplink that started the Authenticator.');
    return;
  }

  const timeout = setTimeout(() => {
    if (pendingFlow && pendingFlow.res === res) {
      logger.warn(`LocalHttpServer: auth flow timed out after ${AUTH_FLOW_TIMEOUT_MS}ms [${ERROR_CODES.FLOW_TIMEOUT}]`);
      sendErrorPage(res, 504, 'Auth flow did not complete in time.');
      pendingFlow = null;
    }
  }, AUTH_FLOW_TIMEOUT_MS);

  const flowId = randomUUID();
  pendingFlow = { flowId, res, timeout };

  // Clear state on socket close — unconditionally, so a request handler that
  // fails after pendingFlow was set (e.g. webContents.send throws on a
  // destroyed window and the outer catch writes a 500) cannot leak the
  // pendingFlow + 120s timer. Without this, the timer would later try to
  // write a 504 to an already-ended response and crash the main process
  // with an uncaught "Cannot set headers after they are sent" exception.
  res.on('close', () => {
    if (pendingFlow && pendingFlow.res === res) {
      if (!res.writableEnded) {
        logger.info('LocalHttpServer: RP connection closed before auth flow finished');
      }
      clearTimeout(pendingFlow.timeout);
      pendingFlow = null;
    }
  });

  // Read live — main window may have been re-created (macOS dock activate).
  const mainWindow = getMainWindow?.() ?? null;
  if (!mainWindow || mainWindow.isDestroyed()) {
    logger.error(`LocalHttpServer: no live main window to deliver auth flow [${ERROR_CODES.SERVER_SHUTTING_DOWN}]`);
    clearTimeout(timeout);
    pendingFlow = null;
    sendErrorPage(res, 503, 'Authenticator UI is not available.');
    return;
  }

  logger.info('LocalHttpServer: forwarding / to renderer; holding HTTP response');
  mainWindow.webContents.send(IPC_START_AUTH_FLOW_EVENT, {
    challenge_path: challengePath,
    serverMode: true,
    serverPort: currentPort ?? undefined,
    flowId,
  });
}

function completePendingFlow(payload: { flowId?: string; redirectUrl?: string; error?: string }): void {
  if (!pendingFlow) {
    logger.warn('LocalHttpServer: IPC_AUTH_FLOW_FINISHED received but no flow is pending');
    return;
  }

  // Drop stale IPCs: the originating flow was already cleared (RP disconnected,
  // timed out) and a different flow now owns pendingFlow. Treated as error
  // because the late flow's RP will hang until the 120s timeout.
  if (payload.flowId !== pendingFlow.flowId) {
    logger.error(
      `LocalHttpServer: IPC_AUTH_FLOW_FINISHED flowId mismatch (got ${payload.flowId}, expected ${pendingFlow.flowId}); dropping`,
    );
    return;
  }

  const { res, timeout } = pendingFlow;
  clearTimeout(timeout);
  pendingFlow = null;

  // Deliver the authorization response by REDIRECTING the browser to the
  // IDP-registered redirect_uri. The auth code rides in that URL and is
  // followed by the user-agent — it is never returned as readable data, so a
  // party that merely triggered the flow cannot read the code. Error outcomes
  // also arrive here as a redirect_uri carrying ?error=… (set by the renderer).
  if (payload.redirectUrl && isHttpUrl(payload.redirectUrl)) {
    let redirectLocation = payload.redirectUrl;
    // #!if MOCK_MODE === 'ENABLED'
    // DEV ONLY: the IDP's registered redirect_uri points at the production RP,
    // but local testing runs the sample RP at localhost:8090 and the multi-card
    // flow must return there to continue. Rewrite the host to the local RP only
    // in `npm run dev`. This whole block is stripped from production builds by
    // the preprocessor (MOCK_MODE !== 'ENABLED') and stays inert in the mock
    // installer build (NODE_ENV !== 'development').
    if (process.env.NODE_ENV === 'development') {
      try {
        const devTarget = new URL(redirectLocation);
        const localRp = new URL(DEV_ALLOWED_ORIGIN);
        devTarget.protocol = localRp.protocol;
        devTarget.host = localRp.host;
        redirectLocation = devTarget.toString();
        logger.info(`LocalHttpServer: [DEV] rewrote redirect host → ${localRp.host}`);
      } catch {
        // not a parseable URL — keep the original redirect target
      }
    }
    // #!endif
    logger.info('LocalHttpServer: auth flow finished — 302 redirecting browser to redirect_uri');
    sendRedirect(res, redirectLocation);
    return;
  }

  // No usable redirect target (degenerate failure — e.g. no valid redirect_uri
  // was available). There is nowhere to send the browser, so show a page.
  const message = payload.error || 'No redirect URL was returned by the Authenticator.';
  logger.error(`LocalHttpServer: auth flow finished without a usable redirect URL: ${message}`);
  sendErrorPage(res, 400, message);
}

/**
 * Outcome of a startLocalHttpServer call:
 *  - 'started'  the server now serves this (port, handshake_id) — a fresh bind,
 *               a rebind to a new port, or an in-place handshake_id swap.
 *  - 'reused'   the same (port, handshake_id) was already running (the OS
 *               re-delivered the same deeplink); nothing changed.
 *  - 'declined-active-flow'  an auth flow is currently in progress, so the new
 *               flow was refused and the running one left untouched. The
 *               requesting RP's /status probe times out → legacy fallback.
 */
export type StartServerOutcome = 'started' | 'reused' | 'declined-active-flow';

/**
 * Starts (or rebinds) the local HTTP server for an auth flow.
 *
 * Each flow uses a fresh (port, handshake_id) pair — they are never persisted
 * on the RP side. A re-call while the server is up resolves as:
 *   - same pair                      → idempotent ('reused')
 *   - a flow is in progress          → refuse ('declined-active-flow')
 *   - idle, same port, new handshake → adopt the handshake in place ('started')
 *   - idle, different port           → tear the old server down and rebind ('started')
 *
 * @param mainWindowGetter Getter returning the live main BrowserWindow (read
 *   lazily so macOS dock re-create lands on the new window).
 */
export async function startLocalHttpServer(
  mainWindowGetter: () => BrowserWindow | null,
  port: number,
  handshakeId?: string,
): Promise<StartServerOutcome> {
  if (server) {
    const sameBinding = currentPort === port && expectedHandshakeId === (handshakeId ?? null);
    if (sameBinding) {
      // OS re-delivered the same deeplink — nothing to do.
      getMainWindow = mainWindowGetter;
      logger.info(`LocalHttpServer: already running on port ${currentPort}; idempotent return`);
      return 'reused';
    }

    // A different (port, handshake_id) means a genuinely new auth flow.
    if (pendingFlow) {
      // An auth flow is actively being served (e.g. PIN entry in progress).
      // Protect it: refuse the new flow instead of tearing the server down.
      logger.warn(
        `LocalHttpServer: declining new auth flow on port ${port} — a flow is already in progress on port ${currentPort}`,
      );
      return 'declined-active-flow';
    }

    // Idle (the previous flow finished; we are in the post-flow grace window).
    if (currentPort === port) {
      // Same port, only the handshake_id changed — adopt it without a teardown
      // so there is no brief close/listen gap on the shared port.
      expectedHandshakeId = handshakeId ?? null;
      getMainWindow = mainWindowGetter;
      logger.info(`LocalHttpServer: reusing port ${port} with a new handshake_id for the next auth flow`);
      return 'started';
    }

    logger.info(`LocalHttpServer: rebinding from port ${currentPort} to ${port} for the next auth flow`);
    await stopLocalHttpServer();
    // falls through to a fresh bind below
  }

  getMainWindow = mainWindowGetter;
  await bindFreshServer(port, handshakeId);
  return 'started';
}

/**
 * Creates the HTTP server, wires the IPC completion listener and starts
 * listening on loopback. Rejects (→ AUTHCL_0015 upstream) only on a genuine
 * bind failure such as EADDRINUSE.
 */
function bindFreshServer(port: number, handshakeId?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    expectedHandshakeId = handshakeId ?? null;
    server = http.createServer(createRequestHandler());

    server.on('error', (err: NodeJS.ErrnoException) => {
      logger.error(`LocalHttpServer: Failed to start on port ${port}`, err);
      if (ipcFlowFinishedListener) {
        ipcMain.removeListener(IPC_AUTH_FLOW_FINISHED, ipcFlowFinishedListener);
        ipcFlowFinishedListener = null;
      }
      server = null;
      currentPort = null;
      expectedHandshakeId = null;
      reject(err);
    });

    ipcFlowFinishedListener = (_event, payload) => {
      completePendingFlow((payload ?? {}) as { flowId?: string; redirectUrl?: string; error?: string });
    };
    ipcMain.on(IPC_AUTH_FLOW_FINISHED, ipcFlowFinishedListener);

    // Loopback only — RP runs in the user's browser; binding wider would
    // expose the handshake_id-protected /authorize endpoint to the LAN.
    server.listen(port, '127.0.0.1', () => {
      currentPort = port;
      logger.info(`LocalHttpServer: Listening on http://127.0.0.1:${port}`);
      logger.info(`LocalHttpServer: Allowed origins: ${getAllowedOrigins().join(', ')}`);
      resolve();
    });
  });
}

export function stopLocalHttpServer(): Promise<void> {
  return new Promise((resolve) => {
    if (ipcFlowFinishedListener) {
      ipcMain.removeListener(IPC_AUTH_FLOW_FINISHED, ipcFlowFinishedListener);
      ipcFlowFinishedListener = null;
    }

    if (pendingFlow) {
      clearTimeout(pendingFlow.timeout);
      if (!pendingFlow.res.writableEnded) {
        sendErrorPage(pendingFlow.res, 503, 'Authenticator HTTP server was stopped before the flow finished.');
      }
      pendingFlow = null;
    }

    if (!server) {
      logger.debug('LocalHttpServer: No server to stop');
      return resolve();
    }

    const port = currentPort;

    // Force-close keep-alive connections (Node >= 18.2)
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    server.close(() => {
      logger.info(`LocalHttpServer: Server on port ${port} stopped`);
      server = null;
      currentPort = null;
      expectedHandshakeId = null;
      getMainWindow = null;
      resolve();
    });
  });
}
