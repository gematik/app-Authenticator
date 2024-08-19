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

import Swal, { SweetAlertResult } from 'sweetalert2';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import i18n from '@/renderer/i18n';

const translate = i18n.global.t;

const confirmSaveUnsavedSettingsPrompt = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('settings_unsaved'),
    text: translate('do_you_want_to_save_changes'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: translate('save'),
    cancelButtonText: translate('reset_changes'),
  });
};

const confirmSaveSettingsPrompt = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: FileStorageRepository.isDefaultConfigFile
      ? translate('you_are_using_default_config_if_you_save_changes_will_be_saved_to_specific_path')
      : translate('settings_will_be_saved'),
    text: translate('are_you_sure'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'OK',
    cancelButtonText: translate('cancel'),
  });
};

const settingsSavedSuccessfullyAlert = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('settings_saved_successfully'),
    text: translate('settings_saved_config_path_value', { configPath: FileStorageRepository.getPath() }),
    timer: 3000,
    showConfirmButton: true,
    icon: 'success',
  });
};

const invalidDataAlert = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('settings_please_enter_valid_data'),
    icon: 'warning',
    confirmButtonText: 'OK',
  });
};

export {
  confirmSaveUnsavedSettingsPrompt,
  confirmSaveSettingsPrompt,
  settingsSavedSuccessfullyAlert,
  invalidDataAlert,
};
