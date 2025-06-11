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
  <div
    class="flex items-center p-2 cursor-pointer hover:bg-blue-200 transition border-b step-indicator"
    :class="{
      'bg-blue-100': active,
      'rounded-t-lg': step == 1,
      'rounded-b-lg': lastStep,
      'step-indicator-warning': !isValid,
    }"
  >
    <div class="mr-2 step-number" :class="{ 'step-number-active': active }">{{ step }}</div>
    <div class="flex flex-row justify-between flex-1">
      <h2 class="text-blue-950 ml-1 text-base">{{ title }}&nbsp;</h2>
    </div>
    <div class="text-yellow-400 text-2xl">{{ isValid ? '' : '&#9888;' }}</div>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-5 h-5 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  step: number;
  title: string;
  active?: boolean;
  lastStep?: boolean;
  isValid?: boolean;
}>();

if (props.step == undefined) {
  throw new Error('StepIndicator step is required');
}
if (props.title == undefined) {
  throw new Error('StepIndicator title is required');
}
</script>

<style scoped>
@import '../../../global.css';
.step-number {
  width: 2rem;
  height: 2rem;
  line-height: 2rem;
  font-size: 0.8rem;
  text-align: center;
  border-radius: 20%;
  border: 0.1rem solid lightgray;
  margin-right: 0.5rem;
}

.step-indicator-warning {
  box-shadow: inset 0 0 0 0.1rem #f8cc52;
}

.step-indicator:hover .step-number {
  border: 0.1rem solid #000e52;
}

.step-number-active {
  border: 0.1rem solid #000e52;
}
</style>
