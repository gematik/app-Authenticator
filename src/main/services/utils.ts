/*
 * Copyright 2025, gematik GmbH
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
