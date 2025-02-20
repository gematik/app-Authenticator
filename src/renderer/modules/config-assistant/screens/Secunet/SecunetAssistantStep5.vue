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
      {{ $t('config_assistant.secunet.step5.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Secunet.mp4"
      />
    </div>
    <div class="flex flex-row mb-8">
      <div class="w-2/3">
        <p>
          <strong>{{ $t('config_assistant.secunet.step5.intro') }}</strong>
        </p>
        <ol class="list-decimal list-outside ml-4">
          <li class="list-item mt-4">{{ $t('config_assistant.secunet.step5.workplaceId_step1') }}</li>
          <li class="list-item mt-4">{{ $t('config_assistant.secunet.step5.workplaceId_step2') }}</li>
          <li class="list-item mt-4">{{ $t('config_assistant.secunet.step5.workplaceId_step3') }}</li>
          <li class="list-item mt-4">{{ $t('config_assistant.secunet.step5.workplaceId_step4') }}</li>
          <li class="list-item mt-4">{{ $t('config_assistant.secunet.step5.workplaceId_step5') }}</li>
        </ol>
      </div>
      <div class="flex flex-col gap-4">
        <ScreenshotHelper
          image-src="secu_step5_arbeitsplatz.png"
          :image-description="$t('config_assistant.secunet.step5.screen_hint')"
        />
      </div>
    </div>
    <AssistantInput
      v-model="props.repositoryData[CONTEXT_PARAMETERS_CONFIG_GROUP.WORKPLACE_ID]"
      :label="$t('config_assistant.secunet.step5.title')"
      type="text"
      :maxlength="50"
      @update-validity="updateValidity"
    />
  </div>
</template>

<script setup lang="ts">
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
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
