/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { IPC_CANCEL_UPDATE, IPC_CHECK_UPDATE } from '@/constants';
import { getConfig } from '@/renderer/utils/get-configs';
import { CHECK_UPDATES_AUTOMATICALLY_CONFIG } from '@/config';

/**
 * Starts the auto update if it is allowed
 */
export const checkNewUpdate = (checkUpdate?: boolean) => {
  // if the given value is UNDEFINED or NULL check the config
  checkUpdate = checkUpdate ?? !!getConfig(CHECK_UPDATES_AUTOMATICALLY_CONFIG).value;

  if (checkUpdate) {
    window.api.send(IPC_CHECK_UPDATE);
  }
};

/**
 * Stop started update process
 */
export const cancelActiveUpdateProcess = () => {
  window.api.send(IPC_CANCEL_UPDATE);
};

/**
 * Check every 24 hour
 */
setInterval(() => {
  checkNewUpdate();
}, 86400000);
