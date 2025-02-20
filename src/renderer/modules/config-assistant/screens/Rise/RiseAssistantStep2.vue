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
  <div class="assistant-content flex flex-col h-full">
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.rise.step2.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Rise_small.mp4"
      />
    </div>

    <div class="assistant-section mb-5">
      <p class="mb-3"><strong>Host:</strong>&nbsp;{{ $t('config_assistant.secunet.step2.intro') }}</p>
      <p><strong>Beispiel:</strong></p>
      <p>https://<strong>10.151.81.105</strong>:9443/htm#&nbsp;&rarr;&nbsp;Host:&nbsp;<strong>10.151.81.105</strong></p>
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME]"
        placeholder=""
        label="Host"
        type="text"
        :allow-negative-numbers="false"
        @update-validity="updateValidity"
      />
    </div>
    <ScreenshotHelper
      :image-description="$t('config_assistant.rise.step2.screen_hint')"
      image-src="rise_step2_host_port.png"
    />
    <div class="assistant-section flex-grow mt-8">
      <p class="mb-3"><strong>Port:&nbsp;</strong>{{ $t('config_assistant.rise.step2.port_text') }}</p>
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.PORT]"
        label="Port"
        type="number"
        :allow-negative-numbers="false"
        :max="65535"
        placeholder="443"
        pre-value="443"
        @update-validity="updateValidity"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';

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
