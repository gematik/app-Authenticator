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

import http from 'node:http';
import { IPC_AUTH_FLOW_FINISHED, IPC_START_AUTH_FLOW_EVENT } from '@/constants';
import {
  getLocalHttpServerPort,
  isLocalHttpServerRunning,
  startLocalHttpServer,
  stopLocalHttpServer,
} from '@/main/services/local-http-server';

const mockIpcListeners: Record<string, Array<(...args: unknown[]) => void>> = {};
const mockWebContentsSend = jest.fn();

// `import * as electron` returns a frozen ES namespace; use require so we
// can augment the global mock from setup.ts with `app` and `ipcMain`.
const electronMock = require('electron');
electronMock.app = {
  getVersion: () => '1.2.3-test',
};
electronMock.ipcMain = {
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    if (!mockIpcListeners[channel]) mockIpcListeners[channel] = [];
    mockIpcListeners[channel].push(listener);
  },
  removeListener: (channel: string, listener: (...args: unknown[]) => void) => {
    if (!mockIpcListeners[channel]) return;
    mockIpcListeners[channel] = mockIpcListeners[channel].filter((l) => l !== listener);
  },
};

const TEST_PORT = 28999;
const HANDSHAKE_ID = 'aaaaaaaa-bbbb-4ccc-9ddd-eeeeeeeeeeee';
// NODE_ENV=test puts the server into dev-mode origin allow-list which
// includes http://localhost:8090 (the sample RP). Use it as the default
// in every test request.
const TEST_ORIGIN = 'http://localhost:8090';

type MockBrowserWindow = {
  webContents: { send: jest.Mock };
  isDestroyed: () => boolean;
};

function makeMockWindow(): MockBrowserWindow {
  return {
    webContents: { send: mockWebContentsSend },
    isDestroyed: () => false,
  };
}

type HttpResult = { status: number; body: any; raw: string; headers: http.IncomingHttpHeaders };

function httpRequest(method: 'GET', path: string, headers: Record<string, string> = {}): Promise<HttpResult> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path,
        method,
        // disable pooling so dead keep-alive sockets don't bleed across tests
        agent: false,
        headers: { Origin: TEST_ORIGIN, ...headers },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          let parsed: any;
          try {
            parsed = raw ? JSON.parse(raw) : undefined;
          } catch {
            parsed = undefined;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed, raw, headers: res.headers });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

function authPath(params: { challenge_path?: string; handshake_id?: string }): string {
  const sp = new URLSearchParams();
  if (params.challenge_path !== undefined) sp.set('challenge_path', params.challenge_path);
  if (params.handshake_id !== undefined) sp.set('handshake_id', params.handshake_id);
  const query = sp.toString();
  return query ? `/authorize?${query}` : '/authorize';
}

function fireIpcAuthFlowFinished(payload: { flowId?: string; redirectUrl?: string; error?: string }): void {
  const listeners = mockIpcListeners[IPC_AUTH_FLOW_FINISHED] || [];
  for (const l of listeners) {
    l({}, payload);
  }
}

// Returns the flowId main sent in the most recent IPC_START_AUTH_FLOW_EVENT.
// Tests call this so fireIpcAuthFlowFinished echoes the correct one back.
function latestFlowId(): string | undefined {
  const calls = mockWebContentsSend.mock.calls;
  for (let i = calls.length - 1; i >= 0; i--) {
    if (calls[i][0] === IPC_START_AUTH_FLOW_EVENT) {
      return calls[i][1]?.flowId;
    }
  }
  return undefined;
}

function waitForRendererCall(timeoutMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (mockWebContentsSend.mock.calls.length > 0 || Date.now() - start > timeoutMs) {
        return resolve();
      }
      setTimeout(tick, 10);
    };
    tick();
  });
}

beforeEach(() => {
  mockWebContentsSend.mockClear();
  for (const key of Object.keys(mockIpcListeners)) {
    mockIpcListeners[key] = [];
  }
});

afterEach(async () => {
  if (isLocalHttpServerRunning()) {
    await stopLocalHttpServer();
  }
});

describe('startLocalHttpServer / lifecycle', () => {
  it('binds to the requested port and reports it as running', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    expect(isLocalHttpServerRunning()).toBe(true);
    expect(getLocalHttpServerPort()).toBe(TEST_PORT);
  });

  it('stop releases the port and clears the running flag', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    await stopLocalHttpServer();
    expect(isLocalHttpServerRunning()).toBe(false);
    expect(getLocalHttpServerPort()).toBeNull();
  });
});

describe('GET /status', () => {
  it('returns 200 with version, status, port and handshake_id', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    const res = await httpRequest('GET', '/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      version: '1.2.3-test',
      status: 'ready',
      port: TEST_PORT,
      handshake_id: HANDSHAKE_ID,
    });
  });

  it('sets Access-Control-Allow-Origin on the response for an allowed origin', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    const res = await httpRequest('GET', '/status', { Origin: 'https://zvr-ae.bnotk.de' });
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('https://zvr-ae.bnotk.de');
  });

  it('returns a 404 HTML page for unknown routes', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    const res = await httpRequest('GET', '/nope');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('text/html');
  });
});

describe('origin allow-list', () => {
  beforeEach(async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
  });

  it('rejects a request with an Origin not in the allow-list with 403', async () => {
    const res = await httpRequest('GET', '/status', { Origin: 'https://evil.example.test' });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('origin_not_allowed');
  });

  it('rejects a request with no Origin or Referer with 403', async () => {
    const res = await httpRequest('GET', '/status', { Origin: '' });
    expect(res.status).toBe(403);
  });

  it('accepts a known RP origin from the redirect_uri mapping', async () => {
    // zvr-ae.bnotk.de is in REDIRECT_URI_APP_NAME_MAPPING.
    const res = await httpRequest('GET', '/status', { Origin: 'https://zvr-ae.bnotk.de' });
    expect(res.status).toBe(200);
  });

  it('strips path/query from Origin before matching', async () => {
    // Browsers send the bare origin (scheme + host[:port]), but be defensive.
    const res = await httpRequest('GET', '/status', { Origin: 'https://zvr-ae.bnotk.de/some/path?q=1' });
    expect(res.status).toBe(200);
  });
});

describe('GET /authorize – validation', () => {
  beforeEach(async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
  });

  it('rejects a request without challenge_path with a 400 HTML page', async () => {
    const res = await httpRequest('GET', authPath({ handshake_id: HANDSHAKE_ID }));
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.raw).toContain('challenge_path');
  });

  it('rejects a request without handshake_id with a 403 HTML page', async () => {
    const res = await httpRequest('GET', authPath({ challenge_path: 'https://idp.example.test/sign?x=1' }));
    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.raw).toContain('handshake_id');
  });

  it('rejects a request with the wrong handshake_id with a 403 HTML page', async () => {
    const res = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: 'different-id' }),
    );
    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.raw).toContain('does not match');
  });
});

describe('GET /authorize – fail-closed when the server has no handshake_id', () => {
  // Server started from a deeplink that carried server_port but no handshake_id
  // (expectedHandshakeId === null). A malicious page could otherwise drive the
  // full card+PIN flow with no caller verification — the gate must fail closed.
  it('rejects with 403 even when the request supplies its own handshake_id, and never starts a flow', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT);

    const res = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: 'attacker-supplied' }),
    );

    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toContain('text/html');
    expect(mockWebContentsSend).not.toHaveBeenCalled();
  });

  it('rejects with 403 when neither the server nor the request carries a handshake_id', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT);

    const res = await httpRequest('GET', authPath({ challenge_path: 'https://idp.example.test/sign?x=1' }));

    expect(res.status).toBe(403);
    expect(mockWebContentsSend).not.toHaveBeenCalled();
  });
});

describe('Host-header validation (DNS-rebinding guard)', () => {
  beforeEach(async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
  });

  it('rejects /status with 403 for a spoofed Host even with a valid Origin', async () => {
    // Simulates a rebound attacker domain: connects to 127.0.0.1 but sends its own Host.
    const res = await httpRequest('GET', '/status', { Host: `evil.example:${TEST_PORT}` });
    expect(res.status).toBe(403);
  });

  it('rejects /authorize with 403 for a spoofed Host and starts no flow', async () => {
    const res = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
      { Host: `evil.example:${TEST_PORT}` },
    );
    expect(res.status).toBe(403);
    expect(mockWebContentsSend).not.toHaveBeenCalled();
  });

  it('accepts the localhost loopback Host form', async () => {
    const res = await httpRequest('GET', '/status', { Host: `localhost:${TEST_PORT}` });
    expect(res.status).toBe(200);
  });
});

describe('GET /authorize – happy path', () => {
  it('forwards to the renderer and completes when IPC_AUTH_FLOW_FINISHED fires', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const responsePromise = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();

    expect(mockWebContentsSend).toHaveBeenCalledWith(
      IPC_START_AUTH_FLOW_EVENT,
      expect.objectContaining({
        challenge_path: 'https://idp.example.test/sign?x=1',
        serverMode: true,
        serverPort: TEST_PORT,
      }),
    );

    fireIpcAuthFlowFinished({ flowId: latestFlowId(), redirectUrl: 'https://rp.example.test/callback?code=abc' });

    const res = await responsePromise;
    // The code is delivered by REDIRECTING the browser, not as readable data.
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://rp.example.test/callback?code=abc');
  });

  it('[dev] rewrites the redirect host to the local sample RP (dev only)', async () => {
    // The dev-only host rewrite is gated at runtime by NODE_ENV === 'development'
    // (and preprocessor-stripped from prod). Jest runs with NODE_ENV='test', so
    // flip it for this one case to exercise the rewrite.
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

      const responsePromise = httpRequest(
        'GET',
        authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
      );
      await waitForRendererCall();
      fireIpcAuthFlowFinished({
        flowId: latestFlowId(),
        redirectUrl: 'https://prod-rp.example.de/callback?code=abc&state=s1',
      });

      const res = await responsePromise;
      expect(res.status).toBe(302);
      // host swapped to the local sample RP; path + query preserved
      expect(res.headers.location).toBe('http://localhost:8090/callback?code=abc&state=s1');
    } finally {
      process.env.NODE_ENV = prevNodeEnv;
    }
  });

  it('delivers an auth error as a 302 to redirect_uri carrying ?error=', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const responsePromise = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();
    // The renderer bakes the error into the redirect_uri; we still 302 to it.
    fireIpcAuthFlowFinished({
      flowId: latestFlowId(),
      redirectUrl: 'https://rp.example.test/callback?error=access_denied&state=s1',
    });

    const res = await responsePromise;
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://rp.example.test/callback?error=access_denied&state=s1');
  });

  it('shows an error page when there is no redirect target at all', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const responsePromise = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();
    fireIpcAuthFlowFinished({ flowId: latestFlowId(), error: 'card_removed' });

    const res = await responsePromise;
    // No redirect_uri → the browser gets an HTML page, never readable token data.
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.raw).toContain('card_removed');
  });
});

describe('GET /authorize – concurrency', () => {
  it('rejects a second concurrent flow with 409', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const first = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();

    const second = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=2', handshake_id: HANDSHAKE_ID }),
    );

    expect(second.status).toBe(409);
    expect(second.headers['content-type']).toContain('text/html');
    expect(second.raw).toContain('already pending');

    fireIpcAuthFlowFinished({ flowId: latestFlowId(), redirectUrl: 'https://rp.example.test/callback?code=xyz' });
    const firstRes = await first;
    expect(firstRes.status).toBe(302);
  });
});

describe('GET /authorize – request handler error recovery', () => {
  it('clears pendingFlow when webContents.send throws so the next request is not stuck on 409', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    mockWebContentsSend.mockImplementationOnce(() => {
      throw new Error('Object has been destroyed');
    });

    const firstRes = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );
    expect(firstRes.status).toBe(500);

    // Let the server-side socket emit 'close' (FIN/ACK) so the close
    // handler runs and clears pendingFlow.
    await new Promise((resolve) => setTimeout(resolve, 100));

    mockWebContentsSend.mockClear();

    const secondResp = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=2', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();
    // Without the fix, the second request gets an immediate 409 and
    // webContents.send is never called.
    expect(mockWebContentsSend).toHaveBeenCalledWith(IPC_START_AUTH_FLOW_EVENT, expect.anything());

    fireIpcAuthFlowFinished({
      flowId: latestFlowId(),
      redirectUrl: 'https://rp.example.test/callback?code=after-recovery',
    });

    const secondRes = await secondResp;
    expect(secondRes.status).toBe(302);
    expect(secondRes.headers.location).toBe('https://rp.example.test/callback?code=after-recovery');
  });
});

describe('GET /authorize – sequential multi-card flow', () => {
  it('accepts a second GET /authorize after the first completes, with the same handshake_id', async () => {
    // Server-side contract: ONE deeplink starts the server + remembers the
    // handshake_id; the RP then drives multi-card by hitting GET /authorize per card.
    // Each request runs through its own pendingFlow lifecycle.
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const firstResp = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?cardType=HBA', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();
    expect(mockWebContentsSend).toHaveBeenCalledWith(
      IPC_START_AUTH_FLOW_EVENT,
      expect.objectContaining({
        challenge_path: 'https://idp.example.test/sign?cardType=HBA',
        serverMode: true,
        serverPort: TEST_PORT,
      }),
    );

    fireIpcAuthFlowFinished({
      flowId: latestFlowId(),
      redirectUrl: 'https://rp.example.test/callback?code=hba-code&state=state-hba',
    });

    const firstRes = await firstResp;
    expect(firstRes.status).toBe(302);
    expect(firstRes.headers.location).toBe('https://rp.example.test/callback?code=hba-code&state=state-hba');

    mockWebContentsSend.mockClear();

    const secondResp = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?cardType=SMCB', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();
    expect(mockWebContentsSend).toHaveBeenCalledWith(
      IPC_START_AUTH_FLOW_EVENT,
      expect.objectContaining({
        challenge_path: 'https://idp.example.test/sign?cardType=SMCB',
        serverMode: true,
        serverPort: TEST_PORT,
      }),
    );

    fireIpcAuthFlowFinished({
      flowId: latestFlowId(),
      redirectUrl: 'https://rp.example.test/callback?code=smcb-code&state=state-smcb',
    });

    const secondRes = await secondResp;
    expect(secondRes.status).toBe(302);
    expect(secondRes.headers.location).toBe('https://rp.example.test/callback?code=smcb-code&state=state-smcb');
  });

  it('still rejects mismatched handshake_id on the second request', async () => {
    // Guards Citrix-style multi-instance: handshake_id is checked on every request.
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const firstResp = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?cardType=HBA', handshake_id: HANDSHAKE_ID }),
    );

    await waitForRendererCall();
    fireIpcAuthFlowFinished({
      flowId: latestFlowId(),
      redirectUrl: 'https://rp.example.test/callback?code=hba',
    });
    expect((await firstResp).status).toBe(302);

    const hijackResp = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?cardType=SMCB', handshake_id: 'wrong-id' }),
    );

    expect(hijackResp.status).toBe(403);
    expect(hijackResp.headers['content-type']).toContain('text/html');
    expect(hijackResp.raw).toContain('does not match');
  });
});

describe('startLocalHttpServer – new-flow lifecycle (rebind / decline)', () => {
  it('returns "reused" and stays on the same port for the same port + handshake_id', async () => {
    const first = await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    expect(first).toBe('started');

    const second = await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);
    expect(second).toBe('reused');
    expect(isLocalHttpServerRunning()).toBe(true);
    expect(getLocalHttpServerPort()).toBe(TEST_PORT);
  });

  it('rebinds to a new port when idle and releases the old one', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const outcome = await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT + 1, 'second-flow-handshake');
    expect(outcome).toBe('started');
    expect(isLocalHttpServerRunning()).toBe(true);
    expect(getLocalHttpServerPort()).toBe(TEST_PORT + 1);

    // the old port is no longer listening (httpRequest targets TEST_PORT)
    await expect(httpRequest('GET', '/status')).rejects.toMatchObject({ code: 'ECONNREFUSED' });
  });

  it('adopts a new handshake_id on the same port when idle, without a teardown', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    const outcome = await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, 'second-flow-handshake');
    expect(outcome).toBe('started');
    expect(getLocalHttpServerPort()).toBe(TEST_PORT);

    // the previous handshake_id is no longer accepted
    const stale = await httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );
    expect(stale.status).toBe(403);
    expect(stale.headers['content-type']).toContain('text/html');
    expect(stale.raw).toContain('does not match');

    // the new handshake_id is accepted and forwarded to the renderer
    const okResp = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: 'second-flow-handshake' }),
    );
    await waitForRendererCall();
    expect(mockWebContentsSend).toHaveBeenCalledWith(IPC_START_AUTH_FLOW_EVENT, expect.anything());
    fireIpcAuthFlowFinished({ flowId: latestFlowId(), redirectUrl: 'https://rp.example.test/cb?code=ok' });
    expect((await okResp).status).toBe(302);
  });

  it('declines a new flow while one is actively in progress and keeps the active flow intact', async () => {
    await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT, HANDSHAKE_ID);

    // Start (but do NOT finish) a flow → pendingFlow is held open.
    const activeResp = httpRequest(
      'GET',
      authPath({ challenge_path: 'https://idp.example.test/sign?x=1', handshake_id: HANDSHAKE_ID }),
    );
    await waitForRendererCall();

    // A second deeplink (new port + handshake) must be declined, not served.
    const outcome = await startLocalHttpServer(() => makeMockWindow() as any, TEST_PORT + 1, 'intruder-handshake');
    expect(outcome).toBe('declined-active-flow');

    // The original server + flow are untouched.
    expect(isLocalHttpServerRunning()).toBe(true);
    expect(getLocalHttpServerPort()).toBe(TEST_PORT);

    // The in-progress flow still completes normally.
    fireIpcAuthFlowFinished({ flowId: latestFlowId(), redirectUrl: 'https://rp.example.test/cb?code=kept' });
    const activeRes = await activeResp;
    expect(activeRes.status).toBe(302);
    expect(activeRes.headers.location).toBe('https://rp.example.test/cb?code=kept');
  });
});
