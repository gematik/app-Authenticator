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

import { IPC_CANCEL_UPDATE, IPC_CHECK_UPDATE } from '@/constants';
import { getConfig } from '@/renderer/utils/get-configs';
import { CHECK_UPDATES_AUTOMATICALLY_CONFIG } from '@/config';

/**
 * Starts the auto update if it is allowed
 * Warning: This function is only available in production mode
 * @param checkUpdate
 */
export const checkNewUpdate = (checkUpdate?: boolean) => {
  // This option is disabled in mock mode
  // #!if MOCK_MODE !== 'ENABLED'

  // if the given value is UNDEFINED or NULL, check the config
  checkUpdate = checkUpdate ?? !!getConfig(CHECK_UPDATES_AUTOMATICALLY_CONFIG).value;

  if (checkUpdate) {
    window.api.send(IPC_CHECK_UPDATE);
  }
  // #!endif
};

/**
 * Stop started update process
 */
export const cancelActiveUpdateProcess = () => {
  window.api.send(IPC_CANCEL_UPDATE);
};

/**
 * Check every 24 hours for new updates
 */
setInterval(() => {
  checkNewUpdate();
}, 86400000);
