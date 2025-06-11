<!--
  - Copyright 2025, gematik GmbH
  -
  - Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
  - European Commission – subsequent versions of the EUPL (the "Licence").
  - You may not use this work except in compliance with the Licence.
  -
  - You find a copy of the Licence in the "Licence" file or at
  - https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
  -
  - Unless required by applicable law or agreed to in writing,
  - software distributed under the Licence is distributed on an "AS IS" basis,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
  - In case of changes by gematik find details in the "Readme" file.
  -
  - See the Licence for the specific language governing permissions and limitations under the Licence.
  -
  - *******
  -
  - For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
  -->

<template>
  <div class="flex config-assistant-container gap-2 overflow-hidden">
    <!-- Linke Spalte (1/3) -->
    <div class="w-1/3 pl-2 pr-2 relative overflow-auto">
      <div class="relative z-10">
        <div class="assistant-heading">{{ $t('config_assistant.corner-title' as any) }}<br />{{ props.konnektor }}</div>
        <div class="mb-1 pr-5 text-blue-900 text-right font-medium">
          {{ $t('config_assistant.step') }} {{ currentStep }} {{ $t('config_assistant.of') }} {{ totalSteps }}
        </div>
        <div class="w-full bg-gray-200 h-1 mb-4 ml-1 mr-1 dark:bg-gray-200">
          <div class="bg-blue-600 h-1 dark:bg-gray-400" :style="progressBarWidth"></div>
        </div>
        <div v-for="header in groupedSteps.headers" :key="header.stepNumber">
          <step-indicator
            :step="header.navigationStepNumber"
            :title="header.description"
            :active="header.stepNumber == props.currentStep"
            :last-step="header.stepNumber == totalSteps"
            :is-valid="formValidity.get(header.stepNumber)?.isValid ?? true"
            @click="
              () => {
                toggleDropdown(header.stepNumber);
                goToStep(header.stepNumber);
              }
            "
          />
          <transition name="dropdown" appear>
            <div v-if="dropdownVisibility.get(header.stepNumber)">
              <div
                v-for="item in groupedSteps.dropdownItems.filter(
                  (filterItem: any) =>
                    Math.floor(filterItem.navigationStepNumber) === Math.floor(header.navigationStepNumber),
                )"
                :key="item.stepNumber"
                class="dropdown-item"
              >
                <step-indicator
                  :step="item.navigationStepNumber"
                  :title="item.description"
                  :active="item.stepNumber == props.currentStep"
                  :last-step="item.stepNumber == totalSteps"
                  :is-valid="formValidity.get(item.stepNumber)?.isValid ?? true"
                  @click="goToStep(item.stepNumber)"
                />
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <div
      class="w-2/3 pl-2 pr-2 pb-2 flex flex-col justify-between content-between bg-white left-light-border overflow-auto"
    >
      <component
        :is="currentStepScreen"
        v-if="currentStepScreen"
        :repository-data="configValues"
        class="flex-1"
        @update-validity="updateValidity(props.currentStep, $event)"
      />
      <div class="flex justify-between">
        <button v-if="props.currentStep == 1" class="bt w-8" @click="abort()">{{ $t('cancel') }}</button>
        <button v-if="props.currentStep > 1" class="bt w-8" @click="goToStep(props.currentStep - 1)">
          &larr; {{ $t('config_assistant.back') }}
        </button>
        <button
          v-if="props.currentStep < totalSteps"
          class="bt w-8"
          @click="
            () => {
              const currentStepInfo = konnektorAssistantSteps[props.konnektor].find(
                (s) => s.stepNumber === props.currentStep,
              );
              const nextStepInfo = konnektorAssistantSteps[props.konnektor].find(
                (s) => s.stepNumber === props.currentStep + 1,
              );

              // Determine which dropdown to open based on current step
              let targetNavigationNumber = null;

              if (currentStepInfo?.navigationStepNumber === 2) {
                targetNavigationNumber = 3;
              } else if (currentStepInfo?.navigationStepNumber === 3.3) {
                targetNavigationNumber = 4;
              }

              // Find and toggle the appropriate header's dropdown
              if (targetNavigationNumber) {
                // Find header with navigation number 3 to toggle its dropdown
                const targetHeader = groupedSteps.headers.find(
                  (h: any) => h.navigationStepNumber === targetNavigationNumber,
                );
                if (targetHeader) {
                  toggleDropdown(targetHeader.stepNumber);
                }
              }
              goToStep(props.currentStep + 1);
            }
          "
        >
          {{ $t('config_assistant.next') }} &rarr;
        </button>
        <button v-if="props.currentStep == totalSteps" class="bt w-8" @click="end()">
          {{ $t('config_assistant.finish_button') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { computed, markRaw, onMounted, ref, toRaw, watch } from 'vue';
import StepIndicator from '@/renderer/modules/config-assistant/components/StepIndicator.vue';
import { KONNEKTOR_VENDORS } from '@/@types/common-types';
import Swal from 'sweetalert2';
import { useI18n } from 'vue-i18n';
import { FileStorageRepository, TRepositoryData } from '@/renderer/modules/settings/repository';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { logger } from '@/renderer/service/logger';
import { alertDefinedErrorWithDataOptional } from '@/renderer/utils/utils';
import { TLS_AUTH_TYPE_CONFIG } from '@/config';

const { save, load } = useSettings();
const configValues = ref<TRepositoryData>({ ...load() });

const router = useRouter();
const translate = useI18n().t;
const currentStepScreen = ref();
const formValidity = ref(new Map<number, { label: string; isValid: boolean }>());

const props = defineProps<{
  currentStep: number;
  konnektor: KONNEKTOR_VENDORS;
}>();

function createSteps(vendor: KONNEKTOR_VENDORS, steps: number[]) {
  return steps.map((step, index) => {
    const stepNumber: number = index + 1;
    let navigationStepNumber: number = stepNumber;
    if (stepNumber == 4) navigationStepNumber = 3.1;
    if (stepNumber == 5) navigationStepNumber = 3.2;
    if (stepNumber == 6) navigationStepNumber = 3.3;
    if (stepNumber == 7) navigationStepNumber = 3.4;
    if (stepNumber == 8) navigationStepNumber = 4;
    if (stepNumber == 9) navigationStepNumber = 4.1;
    if (stepNumber == 10) navigationStepNumber = 5;
    return {
      stepNumber,
      navigationStepNumber,
      get description() {
        if (stepNumber == 9) {
          return translate(
            `config_assistant.${vendor.toLowerCase()}.step9.${configValues.value[TLS_AUTH_TYPE_CONFIG]}.step_title`,
          );
        } else {
          return translate(`config_assistant.${vendor.toLowerCase()}.step${stepNumber}.step_title`);
        }
      },
      content: import(
        '@/renderer/modules/config-assistant/screens/' + vendor + '/' + vendor + 'AssistantStep' + stepNumber + '.vue'
      ),
    };
  });
}

const groupedSteps = computed(() => {
  const headers: any = [];
  const dropdownItems: any = [];

  konnektorAssistantSteps[props.konnektor].forEach((step) => {
    if (isDecimal(step.navigationStepNumber)) {
      dropdownItems.push(step);
    } else {
      headers.push(step);
    }
  });

  return { headers, dropdownItems };
});

const dropdownVisibility = ref(new Map<number, boolean>());

const toggleDropdown = (headerStepNumber: number) => {
  const isVisible = dropdownVisibility.value.get(headerStepNumber) || false;
  dropdownVisibility.value.set(headerStepNumber, !isVisible);
};

const isDecimal = (number: number) => number % 1 !== 0;

const konnektorAssistantSteps = {
  [KONNEKTOR_VENDORS.Rise]: createSteps(KONNEKTOR_VENDORS.Rise, new Array(10).fill(null)),
  [KONNEKTOR_VENDORS.Koco]: createSteps(KONNEKTOR_VENDORS.Koco, new Array(10).fill(null)),
  [KONNEKTOR_VENDORS.Secunet]: createSteps(KONNEKTOR_VENDORS.Secunet, new Array(10).fill(null)),
};

const totalSteps = computed(() => konnektorAssistantSteps[props.konnektor].length);

if (props.currentStep < 1 || props.currentStep > totalSteps.value) {
  throw new Error(`${props.konnektor}-Assistant Step must be 1 to ${totalSteps.value}`);
}

const progressBarWidth = computed(() => {
  const progressInPercentage = (props.currentStep / totalSteps.value) * 100;
  return `width: ${progressInPercentage}%`;
});

const goToStep = async (goToStep: number) => {
  if (goToStep < 1 || goToStep > totalSteps.value) {
    throw new Error(`Assistant Step must be 1 ... ${totalSteps.value}`);
  }
  if (goToStep == props.currentStep) {
    return;
  }
  if (formValidity.value.has(props.currentStep) && !formValidity.value.get(props.currentStep)?.isValid) {
    const willContinue = await Swal.fire({
      title: translate('warning'),
      text: translate('config_assistant.illegale_values'),
      cancelButtonText: translate('no'),
      confirmButtonText: translate('yes'),
      icon: 'warning',
      showCancelButton: true,
    });
    if (!willContinue.isConfirmed) {
      return;
    }
  }
  await router.push({ name: 'config-assistant', params: { konnektor: props.konnektor, step: goToStep } });
};

async function loadCurrentStepScreen() {
  const currentStep = konnektorAssistantSteps[props.konnektor].find((step) => step.stepNumber === props.currentStep);
  if (!currentStep) {
    throw new Error(`Step ${props.currentStep} not found in ${props.konnektor}-Assistant`);
  }
  currentStepScreen.value = markRaw((await currentStep.content).default);
}

const end = async () => {
  if (Array.from(formValidity.value.values()).some((value) => !value.isValid)) {
    const willContinue = await invalidStepsAlert();
    if (!willContinue.isConfirmed) {
      return;
    }
  } else {
    const willContinue = await Swal.fire({
      title: translate('config_assistant.finish'),
      text: translate('config_assistant.save_and_exit_text'),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: translate('config_assistant.save_and_exit'),
      cancelButtonText: translate('cancel'),
    });
    if (!willContinue.isConfirmed) {
      return;
    }
  }
  try {
    await performSaveOperation();
    await Swal.fire({
      title: `${props.konnektor}-Konnektor\n${translate('config_assistant.finish')}`,
      text: translate('config_assistant.finish_text'),
      icon: 'success',
    });
    await router.push({ name: 'Home' });
  } catch (e) {
    await Swal.fire({
      title: translate('error_info'),
      text: translate('config_assistant.error_save_data'),
      icon: 'error',
    });
    return;
  }
};

function abort() {
  Swal.fire({
    title: translate('cancel'),
    text: translate('config_assistant.cancel_assistant'),
    icon: 'warning',
    cancelButtonText: translate('no'),
    confirmButtonText: translate('yes'),
    showCancelButton: true,
  }).then((result) => {
    if (result.isConfirmed) {
      router.push({ name: 'Home' });
    }
  });
}

async function performSaveOperation() {
  try {
    FileStorageRepository.getPath(true);
    save(toRaw(configValues.value));
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
}

const updateValidity = (stepNumber: number, payload: { label: string; isValid: boolean }) => {
  formValidity.value.set(stepNumber, payload);
};

const invalidStepsAlert = async () => {
  const invalidSteps = Array.from(formValidity.value.entries()).filter(([, value]) => !value.isValid);

  return await Swal.fire({
    title: translate('warning'),
    html: `
      <p><strong>${translate('config_assistant.please_check_input')}</strong></p>
      <ul>
        ${invalidSteps.map(([stepNumber]) => `<li>- ${translate('config_assistant.step')} ${stepNumber}</li>`).join('')}
      </ul>
    `,
    icon: 'warning',
    showCancelButton: true,
    cancelButtonText: translate('cancel'),
    confirmButtonText: translate('config_assistant.save_anyway'),
  });
};
onMounted(async () => {
  await loadCurrentStepScreen();
});

watch(
  () => props.currentStep,
  async () => {
    await loadCurrentStepScreen();
  },
);
</script>
<style>
@import '../../../global.css';

.assistant-heading {
  font-size: 1.3rem;
  color: #000e52;
  margin-bottom: 1rem;
}

.config-assistant-container {
  height: 100%;
}

.left-light-border {
  border-left: 1px solid #f2f3f6;
}

.dropdown-item {
  margin-left: 30px;
}
</style>
