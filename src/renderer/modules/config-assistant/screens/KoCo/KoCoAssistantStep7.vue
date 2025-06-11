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
  <div class="mt-4 mr-4 ml-4">
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.koco.step7.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator-Tutorial-KocoBox.mp4"
      />
    </div>
    <div class="flex flex-row">
      <div class="w-2/3">
        <p>
          <strong>{{ $t('config_assistant.koco.step7.csap_heading') }}</strong>
        </p>
        <ol class="list-decimal list-inside mb-4">
          <li class="list-item mt-2">{{ $t('config_assistant.koco.step7.csap_step1') }}</li>
          <li class="list-item mt-2">{{ $t('config_assistant.koco.step7.csap_step2') }}</li>
          <li class="list-item mt-2">{{ $t('config_assistant.koco.step7.csap_step3') }}</li>
        </ol>
      </div>
      <div class="flex flex-col justify-start items-end gap-4 w-1/3">
        <ScreenshotHelper :image-src="csapScreenshots" :image-description="csapScreenshotsDescs" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';

import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import i18n from '@/renderer/i18n';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';

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

const csapScreenshots = ['koco_step3_csap_1.png', 'koco_step3_csap_2.png', 'koco_step3_csap_3.png'];
const csapScreenshotsDescs = [
  translate('config_assistant.koco.step3.csap_screenshot_hint1'),
  translate('config_assistant.koco.step3.csap_screenshot_hint2'),
  translate('config_assistant.koco.step3.csap_screenshot_hint3'),
];
</script>
