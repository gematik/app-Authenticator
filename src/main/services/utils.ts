/*
 * Copyright 2024 gematik GmbH
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

/**
 * @fileoverview Utility functions.
 */

import { START_ARGUMENTS_TO_PREVENT } from '@/constants';

/**
 * Returns true if the current platform is macOS.
 */
export const isMacOS = process.platform === 'darwin';

/**
 * Check if the app is running with any of the remote debugging flags
 */
export const hasAppRemoteDebuggingFlags = (): boolean => {
  // on development and mock mode ignore
  // #!if MOCK_MODE === 'ENABLED'
  if (process.env.NODE_ENV === 'development' || process.env.MOCK_MODE === 'ENABLED') {
    return false;
  }
  // #!endif

  let hasRemoteDebuggingFlags = false;
  for (const arg of process.argv) {
    // if app contains any of the flagsToRemove, quit the app
    if (START_ARGUMENTS_TO_PREVENT.some((flag) => arg.includes(flag))) {
      hasRemoteDebuggingFlags = true;
      break;
    }
  }

  return hasRemoteDebuggingFlags;
};
