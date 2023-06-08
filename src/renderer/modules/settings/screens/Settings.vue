<!--
  - Copyright 2023 gematik GmbH
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
    <form class="w-full" @submit.prevent="saveConfigValues">
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
            <img
              v-if="formSection.icon"
              :src="require(`/src/assets/${formSection.icon}`)"
              class="object-none pr-[10px]"
              alt="form icon"
            />
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
            :on-element-change="config.onChange"
            :info-text="config.infoText"
          />
        </div>
      </div>
      <div class="flex items-center pt-[32px]">
        <button id="btnSaveSettings" class="bt" type="submit" :title="$t('settings_saved_info')">
          {{ $t('save') }}
        </button>

        <button v-if="isDev" class="bt-sec ml-[15px]" type="button" @click="resetData">Remove Settings</button>

        <div class="w-3/3">
          <div>
            <button id="btnFeatureTest" class="bt ml-[15px]" type="button" @click="startFunctionTests">
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
  <TestResultModal v-if="showModal" :function-test-results="functionTestResults" :close-modal="closeModal" />
</template>

<script lang="ts">
import { computed, defineComponent, ref, toRaw } from 'vue';
import { useStore } from 'vuex';
import Swal from 'sweetalert2';

import FormElement from '@/renderer/components/FormElement.vue';
import { IConfigSection } from '@/@types/common-types';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { getFormColumnsFlat, getFormSections } from '@/renderer/modules/settings/screens/formBuilder';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';
import { runTestsCases, TestResult } from '@/renderer/modules/settings/services/test-runner';
import i18n from '@/renderer/i18n';
import { clearEndpoints } from '@/renderer/modules/connector/connector_impl/sds-request';
import TestResultModal from '@/renderer/modules/settings/components/TestResultModal.vue';
import { CHECK_UPDATES_AUTOMATICALLY_CONFIG } from '@/config';
import { cancelActiveUpdateProcess, checkNewUpdate } from '@/renderer/service/auto-updater-service';
import { ERROR_CODES } from '@/error-codes';
import { logger } from '@/renderer/service/logger';
import { IPC_UPDATE_ENV } from '@/constants';

const translate = i18n.global.tc;

export default defineComponent({
  name: 'SettingsScreen',
  components: {
    FormElement,
    TestResultModal,
  },
  setup() {
    const { save, load, clear, setWithoutSave } = useSettings();
    useStore();
    const configValues = ref<TRepositoryData>({ ...load() });

    let isDev = false;
    /* @if MOCK_MODE == 'ENABLED' */
    if (process.env.NODE_ENV === 'development') {
      isDev = true;
    }
    /* @endif */

    window?.api?.on(IPC_UPDATE_ENV, () => {
      setTimeout(() => {
        configValues.value = load();
      }, 500);
    });

    const formSections = computed<IConfigSection[]>(() => getFormSections(configValues.value));
    const formColumnsFlat = getFormColumnsFlat(configValues.value);

    function resetData() {
      clear();
      configValues.value = {};
    }

    /**
     * Validates the data user try to save.
     *
     */
    function validateData(): boolean {
      let isFormValid = true;
      for (const key in configValues.value) {
        const val = configValues.value[key];
        const regex = formColumnsFlat[key]?.validationRegex;

        // no need to check boolean
        if (typeof val === 'boolean') {
          continue;
        }

        if (val && regex && !regex.test(String(val))) {
          isFormValid = false;
          break;
        }
      }
      return isFormValid;
    }

    async function saveConfigValues() {
      // can't save if there is no config
      if (!Object.keys(configValues).length) {
        return;
      }

      // validate
      if (!validateData()) {
        await Swal.fire({
          title: translate('settings_please_enter_valid_data'),
          icon: 'warning',
          confirmButtonText: 'OK',
        });
        return false;
      }
      // confirm prompt
      const saveConfirm = await Swal.fire({
        title: translate('settings_will_be_saved'),
        text: translate('are_you_sure'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: translate('cancel'),
      });

      if (!saveConfirm.isConfirmed) {
        return false;
      }

      // call check update automatically if the settings has been changed
      if (configValues.value[CHECK_UPDATES_AUTOMATICALLY_CONFIG]) {
        checkNewUpdate(true);
      } else {
        cancelActiveUpdateProcess();
      }

      try {
        save(toRaw(configValues.value));
      } catch (err) {
        logger.error('Config file could not be saved: ', err.message);

        await Swal.fire({
          title: translate(`errors.${ERROR_CODES.AUTHCL_0008}.title`),
          text: translate(`errors.${ERROR_CODES.AUTHCL_0008}.text`, {
            configPath: FileStorageRepository.getConfigPath().path,
          }),
          icon: 'error',
        });

        return false;
      }

      // put data in connector module
      await updateAppState();

      await Swal.fire({
        title: translate('settings_saved_successfully'),
        timer: 1000,
        showConfirmButton: false,
        icon: 'success',
      });
    }

    /**
     * Run all tests and returns results
     */
    async function runAndFormatTestCases(): Promise<TestResult[]> {
      // set config
      setWithoutSave(configValues.value);
      await updateAppState();

      const cancelPromise = Swal.fire({
        title: translate('funktion_test'),
        text: translate('funktion_test_processing'),
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

      return new Promise((resolve) => {
        setTimeout(async () => {
          const results = await runTestsCases(undefined, cancelPromise);
          Swal.close();
          resolve(results);
          await updateAppState(true);
        }, 10);
      });
    }

    async function createZipWithLogData() {
      const isSelected = await window.api.createLogZipFile();
      if (isSelected) {
        await Swal.fire({
          title: translate('create_zip_file_successful'),
          icon: 'success',
        });
      }
    }

    /**
     * Update connector Config
     */
    async function updateAppState(reloadFromConfigFile = false) {
      reloadFromConfigFile && load(true);
      window.api.setAppConfigInPreload(toRaw(configValues.value));
      ConnectorConfig.updateConnectorParameters();
      clearEndpoints();
    }

    return {
      resetData,
      saveConfigValues,
      runAndFormatTestCases,
      createZipWithLogData,
      configValues,
      isDev,
      formSections,
    };
  },
  data() {
    return {
      showModal: false,
      functionTestResults: [] as TestResult[],
    };
  },
  methods: {
    async startFunctionTests() {
      this.functionTestResults = await this.runAndFormatTestCases();

      // if user cancels the process results can be empty and in that case we won't open the results modal
      if (this.functionTestResults.length) {
        this.showModal = true;
      }
    },
    async closeModal() {
      this.showModal = false;
    },
  },
});
</script>
