<!--
  - Copyright 2024 gematik GmbH
  -
  - The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
  - Sourcecode must be in compliance with the EUPL.
  -
  - You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
  -
  - Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
  - IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
  - language governing permissions and limitations under the License.ee the Licence for the specific language governing
  - permissions and limitations under the Licence.
  -->

<template>
  <div class="antialiased w-full justify-center">
    <div v-if="isJsonFileInvalid" class="w-full">
      <div class="w-full bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p class="font-bold">{{ $t(`errors.${ERROR_CODES.AUTHCL_0012}.title`) }}</p>
        <p>
          {{ $t(`errors.${ERROR_CODES.AUTHCL_0012}.text`, { path: configFilePath }) }}
          <br />
          {{ $t(`see_link_to_understand_how_to_configure_config_properly`) }}:

          <a href="javascript:void(0)" class="underline text-blue-500" @click="openExternal(WIKI_CONFIGURATION_LINK)">
            {{ $t('configuration') }}
          </a>
        </p>
        <button class="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" @click="reloadConfig()">
          {{ $t('reload') }}
        </button>
      </div>
    </div>
    <div v-else>
      <div
        v-if="isDefaultConfigFile"
        class="w-full bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-5"
        role="alert"
      >
        <h2 class="font-bold text-gray-600">{{ $t(`default_config_is_in_use`) }}</h2>
        <p>
          {{ $t(`you_are_using_default_config`, { path: configFilePath }) }}
        </p>
      </div>
      <form class="w-full" @submit.prevent="saveConfigValues(true)">
        <div
          v-for="(formSection, index) in formSections"
          :key="formSection.title"
          class="w-full"
          :class="{ 'pt-[32px]': index && !formSection.hide }"
        >
          <div v-if="!formSection.hide">
            <div
              class="flex items-center w-full bg-white border-border border-[1px] rounded-t-[8px] h-[72px] py-[26px] px-[48px]"
              :class="{ 'pl-[23px]': formSection.icon }"
            >
              <img v-if="formSection.icon" :src="formSection.icon" class="object-none pr-[10px]" alt="form icon" />
              <h3 :id="`lblTitle-${index}`" class="">
                {{ formSection.title }}
              </h3>
            </div>

            <FormElement
              v-for="config in formSection.columns"
              :key="config.key"
              :required="!!config.required"
              :label="config.label"
              :model="configValues"
              :name="config.key"
              :type="config.type"
              :options-type="config.optionsType"
              :iterable="config.iterable"
              :options="config.options"
              :hide="config.hide"
              :validation-regex="config.validationRegex"
              :validate-input="config.validateInput"
              :on-element-change="config.onChange"
              :info-text="config.infoText"
              :placeholder="config.placeholder"
              :update-init-value="updateInitValuesFlag"
            />
          </div>
        </div>
        <div class="flex items-center pt-[26px] sticky bg-primary bottom-0">
          <button id="btnSaveSettings" class="bt" type="submit" :title="$t('settings_saved_info')">
            {{ $t('save') }}
          </button>

          <div class="w-3/3">
            <div>
              <button id="btnFeatureTest" class="bt ml-[15px]" type="button" @click="runAndFormatTestCases">
                {{ $t('connection_test') }}
              </button>
              <br />
            </div>
          </div>
          <div class="w-3/3">
            <div>
              <button id="btnLogToZip" class="bt ml-[15px]" type="button" @click="createZipWithLogData">
                {{ $t('log_to_zip') }}
              </button>
              <br />
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
  <TestResultModal
    v-if="showModal"
    :function-test-results="functionTestResults"
    :close-modal="closeModal"
    :save-settings="saveConfigValues"
  />
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave } from 'vue-router';

import Swal from 'sweetalert2';
import {
  confirmSaveSettingsPrompt,
  confirmSaveUnsavedSettingsPrompt,
  invalidDataAlert,
  settingsSavedSuccessfullyAlert,
} from '@/renderer/modules/settings/screens/modalDialogs';
import FormElement from '@/renderer/components/FormElement.vue';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';
import { runTestsCases, TestResult } from '@/renderer/modules/settings/services/test-runner';
import { clearEndpoints } from '@/renderer/modules/connector/connector_impl/sds-request';
import TestResultModal from '@/renderer/modules/settings/components/TestResultModal.vue';
import { CHECK_UPDATES_AUTOMATICALLY_CONFIG } from '@/config';
import { cancelActiveUpdateProcess, checkNewUpdate } from '@/renderer/service/auto-updater-service';
import { ERROR_CODES } from '@/error-codes';
import { logger } from '@/renderer/service/logger';
import { IPC_UPDATE_ENV, WIKI_CONFIGURATION_LINK } from '@/constants';
import { IConfigSection } from '@/@types/common-types';
import { getFormColumnsFlat, getFormSections } from '@/renderer/modules/settings/screens/formBuilder';
import { UserfacingError } from '@/renderer/errors/errors';
import { alertDefinedErrorWithDataOptional, validateData } from '@/renderer/utils/utils';

export default defineComponent({
  name: 'SettingsScreen',
  components: {
    FormElement,
    TestResultModal,
  },
  setup() {
    const translate = useI18n().t;
    const { save, load, setWithoutSave } = useSettings();
    const configValues = ref<TRepositoryData>({ ...load() });
    let initialConfigValues: string = JSON.stringify({ ...configValues.value });
    const isJsonFileInvalid = ref(FileStorageRepository.isJsonFileInvalid);
    const isDefaultConfigFile = ref(FileStorageRepository.isDefaultConfigFile);
    const functionTestResults = ref<TestResult[]>([]);
    const showModal = ref<boolean>(false);
    const formSections = computed<IConfigSection[]>(() => getFormSections(configValues.value));
    const formColumnsFlat = getFormColumnsFlat(configValues.value);
    const updateInitValuesFlag = ref(false);

    window?.api?.on(IPC_UPDATE_ENV, () => {
      setTimeout(() => {
        configValues.value = load();
      }, 500);
    });

    onMounted(() => {
      // Prevent data loss of unsaved settings
      window.onbeforeunload = (event) => {
        if (hasUnsavedChanges()) {
          logger.info('Unsaved settings changes detected. Stop app close.');
          event.preventDefault();
          handleAppClose();
          return true;
        } else {
          logger.info('No unsaved settings changes detected.');
        }
      };
    });

    const handleAppClose = async (): Promise<void> => {
      // Handle case when there are no unsaved changes immediately
      const userWantsToSaveSettings = await confirmSaveUnsavedSettingsPrompt();
      if (!userWantsToSaveSettings.isConfirmed) {
        logger.info('User discarded changes to settings.');
        configValues.value = JSON.parse(initialConfigValues);
        updateInitValuesFlag.value = !updateInitValuesFlag.value;
      } else {
        const savedSuccessful = await saveConfigValues(false);
        if (!savedSuccessful) {
          logger.error('Error while saving settings. Closing app aborted!');
          return;
        }
      }
    };

    const beforeRouteLeaveGuard = async (to: any, from: any, next: any): Promise<void> => {
      let proceed: boolean = true; // default case: proceed with navigation
      if (hasUnsavedChanges()) {
        const saveConfirm = await confirmSaveUnsavedSettingsPrompt();
        if (saveConfirm.isConfirmed) {
          // User wants to save the settings before navigating away
          proceed = await saveConfigValues(false);
        }
      }
      proceed ? next() : next(false);
    };
    onBeforeRouteLeave(beforeRouteLeaveGuard);

    /**
     * Watch if there are unsaved user made settings
     */
    const hasUnsavedChanges = (): boolean => {
      return JSON.stringify(configValues.value) !== initialConfigValues;
    };

    async function validateConfig() {
      if (!Object.keys(configValues).length) return false;
      if (!validateData(configValues.value, formColumnsFlat)) {
        await invalidDataAlert();
        return false;
      }
      return true;
    }

    async function showSaveSettingsConfirmationDialog() {
      const saveConfirm = await confirmSaveSettingsPrompt();
      return saveConfirm.isConfirmed;
    }

    function handleUpdateProcess() {
      if (configValues.value[CHECK_UPDATES_AUTOMATICALLY_CONFIG]) {
        checkNewUpdate(true);
      } else {
        cancelActiveUpdateProcess();
      }
    }

    async function performSaveOperation() {
      try {
        FileStorageRepository.getPath(true);
        save(toRaw(configValues.value));
        closeModal();
      } catch (err) {
        if (err instanceof UserfacingError && err.code === ERROR_CODES.AUTHCL_0010) {
          logger.error("Couldn't save to credential manager");
          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0010);
        } else {
          logger.error('Config file could not be saved: ', err.message);
          await Swal.fire({
            title: translate(`errors.${ERROR_CODES.AUTHCL_0008}.title`),
            text: translate(`errors.${ERROR_CODES.AUTHCL_0008}.text`, { configPath: FileStorageRepository.getPath() }),
            icon: 'error',
          });
        }
        return false;
      }
      await updateAppState();
      await settingsSavedSuccessfullyAlert();
      initialConfigValues = JSON.stringify(configValues.value);
      updateInitValuesFlag.value = !updateInitValuesFlag.value;
      return true;
    }

    async function saveConfigValues(needsUserApproval: boolean = true) {
      if (!(await validateConfig())) return false;
      if (needsUserApproval) {
        if (!(await showSaveSettingsConfirmationDialog())) return false;
      }
      handleUpdateProcess();
      return await performSaveOperation();
    }

    /**
     * Run all tests and return results
     */
    const runAndFormatTestCases = async (): Promise<void> => {
      // set config
      setWithoutSave(configValues.value);
      await updateAppState();

      const cancelPromise = Swal.fire({
        title: translate('function_test'),
        text: translate('function_test_processing'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        showConfirmButton: false,
        showClass: { popup: 'swal2-show-loading-above-buttons', backdrop: 'swal2-backdrop-show' },
        hideClass: { popup: '', backdrop: '' },
        showCancelButton: true,
        cancelButtonText: translate('cancel'),
        willOpen: () => {
          Swal.showLoading();
        },
      });

      functionTestResults.value = await runTestsCases(undefined, cancelPromise);

      // close loading modal
      Swal.close();

      // revert config to previous state (config before test run)
      await updateAppState(true);

      // if user cancels the process results can be empty, and in that case, we won't open the results modal
      if (functionTestResults.value.length) {
        showModal.value = true;
      }
    };

    /**
     * Update connector Config
     */
    async function updateAppState(reloadFromConfigFile = false) {
      reloadFromConfigFile && load(true);
      window.api.setAppConfigInPreload(toRaw(configValues.value));
      ConnectorConfig.updateConnectorParameters();
      clearEndpoints();
    }

    const closeModal = () => {
      showModal.value = false;
    };

    const reloadConfig = () => {
      configValues.value = { ...load() };
      isJsonFileInvalid.value = FileStorageRepository.isJsonFileInvalid;
    };

    async function createZipWithLogData() {
      const isSelected = await window.api.createLogZipFile();
      if (isSelected) {
        await Swal.fire({
          title: translate('create_zip_file_successful'),
          icon: 'success',
        });
      }
    }

    onBeforeUnmount(() => {
      // remove the event listener when the component is destroyed
      window.onbeforeunload = null;
    });

    return {
      saveConfigValues,
      runAndFormatTestCases,
      createZipWithLogData,
      closeModal,
      beforeRouteLeaveGuard,
      functionTestResults,
      showModal,
      configValues,
      initialConfigValues,
      updateInitValuesFlag,
      formSections,
      ERROR_CODES,
      isJsonFileInvalid,
      configFilePath: FileStorageRepository.getPath(),
      reloadConfig,
      WIKI_CONFIGURATION_LINK,
      openExternal: window.api.openExternal,
      isDefaultConfigFile,
    };
  },
});
</script>
