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
  <div class="m-4">
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.rise.step3.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Rise_small.mp4"
      />
    </div>
    <div>
      <p class="mb-1 flex flex-row justify-between">
        <strong>{{ $t('config_assistant.rise.step3.step_title') }}</strong>
      </p>
      <p class="mb-1 flex flex-row justify-between">
        {{ $t('config_assistant.rise.step3.description') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import i18n from '@/renderer/i18n';

const translate = i18n.global.t;

const props = defineProps({
  repositoryData: {
    type: Object as PropType<TRepositoryData>,
    required: true,
  },
});

const emit = defineEmits(['update-validity']);

function updateValidity(payload: { label: string; isValid: boolean }) {
  emit('update-validity', payload);
}
</script>
