/*
 * Copyright 2023 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
 */

import { BrowserWindow } from 'electron';
import { URL } from 'url';
import { CUSTOM_PROTOCOL_NAME, IPC_START_AUTH_FLOW_EVENT, IPC_WARN_USER } from '@/constants';
import { ERROR_CODES } from '@/error-codes';
import { TOidcProtocol2UrlSpec, TUserWarnObject } from '@/@types/common-types';
import { logger } from '@/main/services/logging';

type TParsedLauncherArguments = TOidcProtocol2UrlSpec | undefined;

export function parseLauncherArguments(link: string): TParsedLauncherArguments {
  try {
    const parsedLink = new URL(link);

    const challengePath = parseUrlFor('challenge_path', parsedLink.search) || '';
    return {
      challenge_path: decodeURLRecursively(challengePath), // Challenge Path from Smart IDP or RP
    };
  } catch (err) {
    logger.error(`Cannot parse launcher arguments. Error: ${err.message}`);
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

export function decodeURLRecursively(url: string): string {
  if (url.indexOf('%') != -1) {
    return decodeURLRecursively(decodeURIComponent(url));
  }
  return url;
}

export function handleDeepLink(argv: string[], mainWindow: BrowserWindow | null) {
  const deeplink = decodeURLRecursively(argv.find((arg) => arg.startsWith(CUSTOM_PROTOCOL_NAME)) || '');
  if (!deeplink) {
    return undefined;
  }
  try {
    startAuthFlow(deeplink, mainWindow);
  } catch (e) {
    mainWindow?.maximize();
    mainWindow?.focus();
  }

  return deeplink;
}

/**
 * Starts the auth flow for Deeplink and Http version
 * @param url
 * @param mainWindow
 * @param serverMode
 */
export const startAuthFlow = (url: string, mainWindow: BrowserWindow | null, serverMode = false) => {
  try {
    const args = parseLauncherArguments(url);

    if (args && mainWindow) {
      mainWindow.webContents.send(IPC_START_AUTH_FLOW_EVENT, { ...args, serverMode });
    }
  } catch (e) {
    const warnData: TUserWarnObject = {
      data: { code: ERROR_CODES.AUTHCL_0001 },
      swalOptions: {
        icon: 'error',
      },
    };
    mainWindow?.webContents.send(IPC_WARN_USER, warnData);

    logger.error('Parsing launcher parameters and starting AuthFlow has failed!. Error: ' + e);
    throw new Error('Parsing parameters and starting AuthFlow has failed!');
  }
};
