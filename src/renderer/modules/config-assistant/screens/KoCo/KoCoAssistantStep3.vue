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
  -->

<template>
  <div>
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.koco.step3.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator-Tutorial-KocoBox.mp4"
      />
    </div>
    <div>
      <p class="mb-1 flex flex-row justify-between">
        <strong>{{ $t('config_assistant.koco.step3.clientId_heading') }}</strong>
        <ScreenshotHelper
          image-src="koco_step3_clientId.png"
          :image-description="$t('config_assistant.koco.step3.clientId_screenshot_hint')"
        />
      </p>
      <ol class="list-decimal list-inside mb-4">
        <li class="list-item">{{ $t('config_assistant.koco.step3.clientId_step1') }}</li>
        <li class="list-item">{{ $t('config_assistant.koco.step3.clientId_step2') }}</li>
        <li class="list-item">{{ $t('config_assistant.koco.step3.clientId_step3') }}</li>
      </ol>
    </div>
    <div>
      <p class="mb-1 flex flex-row justify-between">
        <strong>{{ $t('config_assistant.koco.step3.assignMandant_heading') }}</strong>
        <ScreenshotHelper
          image-src="koco_step3_mandant.png"
          :image-description="$t('config_assistant.koco.step3.assignMandant_screenshot_hint')"
        />
      </p>
      <ol class="list-decimal list-inside mb-4">
        <li class="list-item">{{ $t('config_assistant.koco.step3.assignMandant_step1') }}</li>
        <li class="list-item">{{ $t('config_assistant.koco.step3.assignMandant_step2') }}</li>
        <li class="list-item">{{ $t('config_assistant.koco.step3.assignMandant_step3') }}</li>
      </ol>
    </div>
    <div>
      <p class="mb-1 flex flex-row justify-between">
        <strong>{{ $t('config_assistant.koco.step3.csap_heading') }}</strong>
        <ScreenshotHelper :image-src="csapScreenshots" :image-description="csapScreenshotsDescs" />
      </p>
      <ol class="list-decimal list-inside mb-2">
        <li class="list-item">{{ $t('config_assistant.koco.step3.csap_step1') }}</li>
        <li class="list-item">{{ $t('config_assistant.koco.step3.csap_step2') }}</li>
        <li class="list-item">{{ $t('config_assistant.koco.step3.csap_step3') }}</li>
      </ol>
    </div>
    <div>
      <AssistantInput
        v-model="props.repositoryData[CONTEXT_PARAMETERS_CONFIG_GROUP.CLIENT_ID]"
        :label="$t('config_assistant.koco.step3.title')"
        type="text"
        :maxlength="50"
        @update-validity="updateValidity"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';

import { CONTEXT_PARAMETERS_CONFIG_GROUP } from '@/config';
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

const csapScreenshots = ['koco_step3_csap_1.png', 'koco_step3_csap_2.png', 'koco_step3_csap_3.png'];
const csapScreenshotsDescs = [
  translate('config_assistant.koco.step3.csap_screenshot_hint1'),
  translate('config_assistant.koco.step3.csap_screenshot_hint2'),
  translate('config_assistant.koco.step3.csap_screenshot_hint3'),
];
</script>
