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

import { BrowserWindow } from 'electron';
import { URL } from 'url';
import { CUSTOM_PROTOCOL_NAME, IPC_START_AUTH_FLOW_EVENT, IPC_WARN_USER, LOCAL_HTTP_SERVER } from '@/constants';
import { ERROR_CODES } from '@/error-codes';
import { TOidcProtocol2UrlSpec, TUserWarnObject } from '@/@types/common-types';
import { logger } from '@/main/services/logging';
import { startLocalHttpServer } from '@/main/services/local-http-server';
import { validateServerPort } from '@/main/services/utils';

const { QUERY_PARAMS } = LOCAL_HTTP_SERVER;

type TParsedLauncherArguments = TOidcProtocol2UrlSpec | undefined;

/**
 * Parses the deeplink URL and extracts auth flow parameters.
 *
 * Two server-mode deeplink shapes are accepted:
 *   1. Top-level (forward-compatible with the v5 design):
 *      authenticator://?server_port=<port>&handshake_id=<id>
 *      challenge_path arrives later via GET /.
 *   2. Embedded (intermediate v4.17 shape used by current RPs):
 *      authenticator://?challenge_path=<url with &server_port=...&handshake_id=... inside>
 *
 * Top-level values win when both shapes are present in one deeplink.
 *
 * Legacy deeplinks (no server_port anywhere) continue to work unchanged.
 */
export function parseLauncherArguments(link: string): TParsedLauncherArguments {
  try {
    const parsedLink = new URL(link);
    const challengePathRaw = parseUrlFor(QUERY_PARAMS.CHALLENGE_PATH, parsedLink.search) || '';
    const decodedChallengePath = decodeURLRecursively(challengePathRaw);

    const topLevelPortRaw = parsedLink.searchParams.get(QUERY_PARAMS.SERVER_PORT);
    const topLevelHandshakeId = parsedLink.searchParams.get(QUERY_PARAMS.HANDSHAKE_ID);
    const topLevelPort =
      topLevelPortRaw !== null && !Number.isNaN(parseInt(topLevelPortRaw, 10))
        ? validateServerPort(parseInt(topLevelPortRaw, 10))
        : undefined;

    const embedded = extractServerModeParamsFromChallengePath(decodedChallengePath);

    const serverPort = topLevelPort ?? embedded.serverPort;
    const handshakeId = topLevelHandshakeId || embedded.handshakeId;
    const cleanChallengePath = embedded.cleanChallengePath;
    const isServerMode = serverPort !== undefined;

    if (isServerMode) {
      const source = topLevelPort !== undefined ? 'deeplink' : 'challenge_path';
      logger.info(
        `Detected server_port=${serverPort}${handshakeId ? ` + handshake_id=${handshakeId}` : ''} in ${source} – starting new auth flow with HTTP server`,
      );
    } else {
      logger.info('No server_port in deeplink or challenge_path – starting legacy auth flow');
    }

    return {
      challenge_path: cleanChallengePath,
      serverMode: isServerMode,
      serverPort,
      handshakeId,
    };
  } catch (err) {
    logger.error(`Cannot parse launcher arguments. Error: ${err.message}`);
  }
}

/**
 * Extracts and removes the new-flow params (`server_port`, `handshake_id`)
 * from a challenge_path URL in a single pass. An out-of-range port is treated
 * as if no port was given at all, causing `parseLauncherArguments` to fall
 * through to the legacy flow.
 */
function extractServerModeParamsFromChallengePath(challengePath: string): {
  cleanChallengePath: string;
  serverPort: number | undefined;
  handshakeId: string | undefined;
} {
  if (!challengePath) {
    return { cleanChallengePath: challengePath, serverPort: undefined, handshakeId: undefined };
  }
  const hasPort = challengePath.includes(QUERY_PARAMS.SERVER_PORT);
  const hasHandshakeId = challengePath.includes(QUERY_PARAMS.HANDSHAKE_ID);
  if (!hasPort && !hasHandshakeId) {
    return { cleanChallengePath: challengePath, serverPort: undefined, handshakeId: undefined };
  }

  try {
    const url = new URL(challengePath);
    const portRaw = url.searchParams.get(QUERY_PARAMS.SERVER_PORT);
    const idRaw = url.searchParams.get(QUERY_PARAMS.HANDSHAKE_ID);
    url.searchParams.delete(QUERY_PARAMS.SERVER_PORT);
    url.searchParams.delete(QUERY_PARAMS.HANDSHAKE_ID);

    let serverPort: number | undefined;
    if (portRaw !== null) {
      const port = parseInt(portRaw, 10);
      serverPort = Number.isNaN(port) ? undefined : validateServerPort(port);
    }

    return {
      cleanChallengePath: url.toString(),
      serverPort,
      handshakeId: idRaw || undefined,
    };
  } catch {
    // challengePath is not a valid URL — regex fallback
    const cleaned = challengePath
      .replace(/[&?]server_port=\d+/, '')
      .replace(/[&?]handshake_id=[^&]*/, '')
      .replace(/\?&/, '?');
    const portMatch = challengePath.match(/server_port=(\d+)/);
    const port = portMatch ? parseInt(portMatch[1], 10) : undefined;
    const idMatch = challengePath.match(/handshake_id=([^&]+)/);
    return {
      cleanChallengePath: cleaned,
      serverPort: port === undefined ? undefined : validateServerPort(port),
      handshakeId: idMatch ? idMatch[1] : undefined,
    };
  }
}

/**
 * parses and gets the needed parameter
 * @param needle
 * @param searchParams
 */
export function parseUrlFor(needle: 'challenge_path', searchParams: string): string | null {
  if (searchParams.startsWith(`?${needle}`)) {
    return searchParams.replace(`?${needle}=`, '');
  }

  return null;
}

/**
 * Maximum number of `decodeURIComponent` passes applied to a deeplink. A
 * legitimate deeplink only ever needs one or two passes (RP serializes once,
 * the OS may URL-encode it again). The cap exists to guarantee termination
 * for pathological inputs and to bound the worst-case work per deeplink.
 */
const MAX_URL_DECODE_ITERATIONS = 5;

export function decodeURLRecursively(url: string): string {
  let current = url;
  for (let i = 0; i < MAX_URL_DECODE_ITERATIONS; i++) {
    if (current.indexOf('%') === -1) {
      return current;
    }
    try {
      const next = decodeURIComponent(current);
      // No further progress (e.g. literal `%` that isn't a valid escape and
      // somehow round-tripped). Stop to avoid spinning.
      if (next === current) {
        return current;
      }
      current = next;
    } catch (err) {
      // `decodeURIComponent` throws URIError on a malformed escape (a stray
      // `%` not followed by two hex digits). Return what we have — callers
      // downstream still get a string instead of an exception bubbling out
      // of every parse path.
      logger.warn(`decodeURLRecursively: stopping early on URIError after ${i} iterations: ${(err as Error).message}`);
      return current;
    }
  }
  logger.warn(
    `decodeURLRecursively: hit max iterations (${MAX_URL_DECODE_ITERATIONS}); returning partially decoded URL`,
  );
  return current;
}

export function handleDeepLink(argv: string[], getMainWindow: () => BrowserWindow | null) {
  const deeplink = decodeURLRecursively(argv.find((arg) => arg.startsWith(CUSTOM_PROTOCOL_NAME)) || '');
  if (!deeplink) {
    return undefined;
  }
  try {
    startAuthFlow(deeplink, getMainWindow);
  } catch (e) {
    const mw = getMainWindow();
    mw?.maximize();
    mw?.focus();
  }

  return deeplink;
}

/**
 * Starts the auth flow – always triggered by a deeplink.
 *
 * If the challenge_path contains a `server_port` parameter (new flow), the local
 * HTTP server is started automatically before forwarding to the renderer.
 * The Relying Party can then connect to http://localhost:<port>.
 *
 * @param url - The full deeplink URL
 * @param getMainWindow - Getter that returns the live main BrowserWindow
 *   (read lazily so macOS dock re-create lands on the new window).
 */
export const startAuthFlow = (url: string, getMainWindow: () => BrowserWindow | null) => {
  try {
    const args = parseLauncherArguments(url);
    const mainWindow = getMainWindow();

    if (args && mainWindow) {
      // New auth flow: start the local HTTP server for RP communication
      if (args.serverMode && args.serverPort) {
        startLocalHttpServer(getMainWindow, args.serverPort, args.handshakeId)
          .then((outcome) => {
            if (outcome === 'declined-active-flow') {
              // Not an error: another flow is in progress so this one was
              // refused. The requesting RP falls back to the legacy flow.
              logger.warn(
                `LocalHttpServer: new auth flow on port ${args.serverPort} declined — a flow is already in progress`,
              );
              return;
            }
            logger.info(`LocalHttpServer ${outcome} on port ${args.serverPort} for new auth flow`);
          })
          .catch((err) => {
            logger.error('Failed to start local HTTP server for new auth flow', err);
            const warnData: TUserWarnObject = {
              data: { code: ERROR_CODES.AUTHCL_0015 },
              swalOptions: { icon: 'error' },
            };
            getMainWindow()?.webContents.send(IPC_WARN_USER, warnData);
          });
      } else {
        mainWindow.webContents.send(IPC_START_AUTH_FLOW_EVENT, { ...args });
      }
    }
  } catch (e) {
    const warnData: TUserWarnObject = {
      data: { code: ERROR_CODES.AUTHCL_0001 },
      swalOptions: {
        icon: 'error',
      },
    };
    getMainWindow()?.webContents.send(IPC_WARN_USER, warnData);

    logger.error('Parsing launcher parameters and starting AuthFlow has failed!. Error: ' + e);
    throw new Error('Parsing parameters and starting AuthFlow has failed!');
  }
};
