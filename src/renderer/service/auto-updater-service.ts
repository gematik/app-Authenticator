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
