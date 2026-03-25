<!--
  - Copyright 2026, gematik GmbH
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
<script setup lang="ts">
import { IToastNotificationProps, TToastIconType, TToastPositionType } from '@/@types/common-types';
import { onMounted, onUnmounted, ref } from 'vue';

const props = withDefaults(defineProps<IToastNotificationProps>(), {
  icon: 'info',
  showPrimaryButton: false,
  showSecondaryButton: true,
  showDismissButton: true,
  position: 'top-right',
  primaryButtonText: 'OK',
  secondaryButtonText: 'Cancel',
  autoDismiss: false,
  autoDismissTime: 5,
});

// Auto-Dismiss State
const progress = ref(100);
let autoDismissTimer: NodeJS.Timeout | null = null;
let progressTimer: NodeJS.Timeout | null = null;

const getIconSvg = (iconType: TToastIconType) => {
  switch (iconType) {
    case 'success':
      return `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"/>`;
    case 'warning':
      return `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM10 15a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4a1 1 0 0 1-2 0V6a1 1 0 0 1 2 0v5Z"/>`;
    case 'error':
      return `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>`;
    case 'info':
    default:
      return `<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>`;
  }
};

const getIconColors = (iconType: TToastIconType) => {
  switch (iconType) {
    case 'success':
      return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20';
    case 'warning':
      return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20';
    case 'error':
      return 'text-[#D92D20] bg-red-50 dark:text-red-400 dark:bg-red-900/20';
    case 'info':
      return 'text-[#3E4784] bg-[#F8F9FC] dark:text-[#717BBC] dark:bg-[#3E4784]/20';
    default:
      return 'text-[#3E4784] bg-[#F8F9FC] dark:text-[#717BBC] dark:bg-[#3E4784]/20';
  }
};

const getProgressBarColor = (iconType: TToastIconType) => {
  switch (iconType) {
    case 'success':
      return 'bg-green-600';
    case 'warning':
      return 'bg-amber-600';
    case 'error':
      return 'bg-red-600';
    case 'info':
    default:
      return 'bg-[#3E4784]';
  }
};

const getPositionClasses = (position: TToastPositionType) => {
  switch (position) {
    case 'top-left':
      return 'fixed top-4 left-4 z-50';
    case 'top-center':
      return 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50';
    case 'top-right':
      return 'fixed top-4 right-4 z-50';
    case 'bottom-left':
      return 'fixed bottom-4 left-4 z-50';
    case 'bottom-center':
      return 'fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50';
    case 'bottom-right':
      return 'fixed bottom-4 right-4 z-50';
    default:
      return 'fixed top-4 right-4 z-50';
  }
};

const handlePrimaryAction = () => {
  if (props.primaryButtonAction) {
    props.primaryButtonAction();
  }
};

const handleSecondaryAction = () => {
  if (props.secondaryButtonAction) {
    props.secondaryButtonAction();
  }
};

const handleDismiss = () => {
  if (props.onDismiss) {
    props.onDismiss();
  }
};

// Auto dismiss logic
const startAutoDismissTimer = () => {
  if (props.autoDismissTime && props.autoDismissTime > 0) {
    progress.value = 100;

    autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, props.autoDismissTime * 1000);

    progressTimer = setInterval(() => {
      const decrement = 100 / (props.autoDismissTime * 10);
      progress.value = Math.max(0, progress.value - decrement);

      if (progress.value <= 0) {
        stopAutoDismissTimer();
      }
    }, 100);
  }
};

const stopAutoDismissTimer = () => {
  if (autoDismissTimer) {
    clearTimeout(autoDismissTimer);
    autoDismissTimer = null;
  }

  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  progress.value = 100;
};

onMounted(() => {
  if (props.autoDismiss) {
    startAutoDismissTimer();
  }
});

onUnmounted(() => {
  stopAutoDismissTimer();
});
</script>

<template>
  <div
    id="toast-interactive"
    :class="`w-full max-w-xs p-4 text-[#3E4784] bg-[#FCFCFD] rounded-lg shadow-sm border border-[#E4E7EC] dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 ${getPositionClasses(
      position,
    )}`"
    role="alert"
  >
    <div class="flex">
      <div :class="`inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg ${getIconColors(icon)}`">
        <svg class="w-4 h-4 fill-current" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <g v-html="getIconSvg(icon)"></g>
        </svg>
        <span class="sr-only">{{ icon }} icon</span>
      </div>
      <div class="ms-3 text-sm font-normal flex-1">
        <span class="mb-1 text-sm font-semibold text-[#000E52] dark:text-white">{{ title }}</span>
        <div class="mb-2 text-sm font-normal text-[#3E4784] dark:text-gray-300">{{ message }}</div>
        <div v-if="showPrimaryButton || showSecondaryButton" class="flex gap-2 mt-3">
          <button
            v-if="showPrimaryButton"
            @click="handlePrimaryAction"
            class="bt text-xs min-w-[80px] h-[32px] px-3 py-1.5"
            type="button"
          >
            {{ primaryButtonText }}
          </button>
          <button
            v-if="showSecondaryButton"
            @click="handleSecondaryAction"
            class="text-xs min-w-[80px] h-[32px] px-3 py-1.5 bg-white border border-[#E4E7EC] rounded-[4px] text-[#3E4784] hover:bg-[#F9FAFB] hover:border-[#D0D5DD] hover:text-[#000E52] focus:ring-2 focus:ring-[#717BBC]/30 transition-colors"
            type="button"
          >
            {{ secondaryButtonText }}
          </button>
        </div>
      </div>
      <button
        v-if="showDismissButton"
        type="button"
        @click="handleDismiss"
        class="ms-auto -mx-1.5 -my-1.5 bg-[#FCFCFD] items-center justify-center shrink-0 text-[#3E4784] hover:text-[#000E52] rounded-lg focus:ring-2 focus:ring-[#717BBC]/30 p-1.5 hover:bg-[#F2F4F7] inline-flex h-8 w-8 transition-colors dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label="Close"
      >
        <span class="sr-only">Close</span>
        <svg
          class="w-3 h-3 fill-none stroke-current"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 14 14"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
        </svg>
      </button>
    </div>
    <!-- Auto-dismiss progress bar -->
    <div v-if="autoDismiss" class="mt-3">
      <div class="w-full bg-[#E4E7EC] rounded-full h-1.5 dark:bg-gray-700">
        <div
          class="h-1.5 rounded-full transition-all duration-100 ease-linear"
          :class="getProgressBarColor(icon)"
          :style="`width: ${progress}%`"
        ></div>
      </div>
    </div>
  </div>
</template>
