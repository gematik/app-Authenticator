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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import Swal, { SweetAlertResult } from 'sweetalert2';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import i18n from '@/renderer/i18n';

const translate = i18n.global.t;

const confirmSaveUnsavedSettingsPrompt = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('settings_will_be_saved'),
    text: translate('are_you_sure'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: translate('OK'),
    cancelButtonText: translate('cancel'),
  });
};

/**
 * War dialog if the standard default configuration is detected and the user wants to save the settings
 * This means AUTHCONFIGPATH is set
 */
const confirmSaveOnStandardDefaultConfig = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('default_config_is_in_use'),
    text: translate('you_are_using_default_config_if_you_save_changes_will_be_saved_to_specific_path'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: translate('save_anyway'),
    cancelButtonText: translate('cancel'),
  });
};

/**
 * Warn dialog if a remote env is detected and the user tries to save the settings
 * This means ViewClient_Machine_Name and/or COMPUTERNAME is set but no AUTHCONFIGPATH
 */
const confirmSaveWithInvalidCentralConfig = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('central_configuration_title'),
    text: translate('central_configuration_save_with_no_authconfigpath'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: translate('save_anyway'),
    cancelButtonText: translate('cancel'),
  });
};

/**
 * Warn dialog if a remote env is detected and the user tries to start the config assistant
 * This means ViewClient_Machine_Name and/or COMPUTERNAME is set but no AUTHCONFIGPATH
 */
const confirmStartConfigAssistantWithInvalidCentralConfiguration = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('central_configuration_title'),
    text: translate('central_configuration_start_config_assistant_with_no_authconfigpath'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: translate('start_anyway'),
    cancelButtonText: translate('cancel'),
  });
};

/**
 * Warn dialog if central default config is detected and the user tries to start the config assistant
 * This means only AUTHCONFIGPATH is set
 */
const confirmStartConfigAssistantWithDefaultConfig = async (): Promise<SweetAlertResult> => {
  return await Swal.fire({
    title: translate('default_config_is_in_use'),
    text: translate('default_configuration_start_config_assistant'),
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: translate('start_anyway'),
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
  confirmSaveOnStandardDefaultConfig,
  confirmSaveWithInvalidCentralConfig,
  confirmStartConfigAssistantWithInvalidCentralConfiguration,
  confirmStartConfigAssistantWithDefaultConfig,
  settingsSavedSuccessfullyAlert,
  invalidDataAlert,
};
