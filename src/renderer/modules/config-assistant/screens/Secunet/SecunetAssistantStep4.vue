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
      {{ $t('config_assistant.secunet.step4.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Secunet.mp4"
      />
    </div>
    <div class="flex flex-row mt-12">
      <div class="w-2/3">
        <p>
          <strong>{{ $t('config_assistant.secunet.step4.clientId_heading') }}</strong>
        </p>
        <ol class="list-decimal list-inside mb-4">
          <li class="list-item mt-2">{{ $t('config_assistant.secunet.step4.clientId_step1') }}</li>
          <li class="list-item mt-2">{{ $t('config_assistant.secunet.step4.clientId_step2') }}</li>
          <li class="list-item mt-2">{{ $t('config_assistant.secunet.step4.clientId_step3') }}</li>
          <li class="list-item mt-2">
            {{ $t('config_assistant.secunet.step4.clientId_step4') }}
          </li>
        </ol>
      </div>
      <div class="flex flex-col justify-start items-end gap-4 w-1/3">
        <ScreenshotHelper
          image-src="secu_step3_client_id.png"
          :image-description="$t('config_assistant.secunet.step4.clientId_screenshot_hint')"
        />
      </div>
    </div>
    <!--
    <div>
      <p class="mb-1 flex flex-row justify-between">
        <strong>{{ $t('config_assistant.secunet.step4.assignAuth_heading') }}</strong>
        <ScreenshotHelper
          image-src="secu_step3_auth.png"
          :image-description="$t('config_assistant.secunet.step4.assignAuth_screenshot_hint')"
        />
      </p>
      <ol class="list-decimal list-inside mb-4">
        <li class="list-item">{{ $t('config_assistant.secunet.step4.assignAuth_step1') }}</li>
        <li class="list-item">{{ $t('config_assistant.secunet.step4.assignAuth_step2') }}</li>
        <li class="list-item">{{ $t('config_assistant.secunet.step4.assignAuth_step3') }}</li>
      </ol>
    </div>
-->
    <div>
      <AssistantInput
        v-model="props.repositoryData[CONTEXT_PARAMETERS_CONFIG_GROUP.CLIENT_ID]"
        placeholder="Ihre Eingabe"
        :label="$t('config_assistant.secunet.step4.title')"
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
