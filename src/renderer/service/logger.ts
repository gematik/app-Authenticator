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

import { IPC_ERROR_LOG_EVENT_TYPES } from '@/constants';

//TODO: @Rene: bitte im Rahmen von authcl-448 diese Function loeschen
export function getCallerInfo(err: Error): string {
  const caller_line = err?.stack?.split('\n')[4];

  if (!caller_line) {
    return '';
  }

  if (Number.isNaN(caller_line)) return caller_line;
  const index = caller_line.indexOf('at ');
  return caller_line.slice(index + 2, caller_line.length);
}

export const logger = {
  error: (...args: unknown[]) => {
    // #!if MOCK_MODE === 'ENABLED'
    console.error(...args); // eslint-disable-line
    // #!endif
    window?.api?.send(IPC_ERROR_LOG_EVENT_TYPES.ERROR, args);
  },
  debug: (...args: unknown[]) => {
    // #!if MOCK_MODE === 'ENABLED'
    console.debug(...args); // eslint-disable-line
    // #!endif
    window?.api?.send(IPC_ERROR_LOG_EVENT_TYPES.DEBUG, args);
  },
  warn: (...args: unknown[]) => {
    // #!if MOCK_MODE === 'ENABLED'
    console.warn(...args); // eslint-disable-line
    // #!endif
    window?.api?.send(IPC_ERROR_LOG_EVENT_TYPES.WARN, args);
  },
  info: (...args: unknown[]) => {
    // #!if MOCK_MODE === 'ENABLED'
    console.info(...args); // eslint-disable-line
    // #!endif
    window?.api?.send(IPC_ERROR_LOG_EVENT_TYPES.INFO, args);
  },
};
