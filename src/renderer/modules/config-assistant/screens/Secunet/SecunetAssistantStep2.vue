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
  <div class="assistant-content m-4">
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.secunet.step2.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Secunet.mp4"
      />
    </div>
    <div class="flex flex-row">
      <div class="assistant-section mb-4 w-2/3">
        <p class="mb-4"><strong>Host:</strong>&nbsp;{{ $t('config_assistant.secunet.step2.intro') }}</p>
        <p><strong>Beispiel:</strong></p>
        <p>
          https://<strong>10.151.81.105</strong>:9443/htm#&nbsp;&rarr;&nbsp;Host:&nbsp;<strong>
            https://10.151.81.105:443
          </strong>
        </p>
      </div>
      <div class="flex flex-col justify-start items-end gap-4 w-1/3">
        <ScreenshotHelper
          :image-description="$t('config_assistant.secunet.step2.screen_hint')"
          image-src="secu_step2_host_port.png"
        />
      </div>
    </div>
    <div>
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME]"
        placeholder="Ihre Eingabe"
        label="Host"
        type="text"
        :allow-negative-numbers="false"
        @update-validity="updateValidity"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';
import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
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
