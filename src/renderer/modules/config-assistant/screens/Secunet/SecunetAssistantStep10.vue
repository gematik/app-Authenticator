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

  *******

  For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
  -->

<template>
  <div class="m-4">
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.secunet.step10.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Secunet.mp4"
      />
    </div>
    <div class="assistant-section mb-5">
      <p class="mb-3"><strong>Einstellung zur SMC-B PIN-Abfrage</strong>&nbsp;</p>
      <p
        class="mb-1"
        :style="{ marginTop: '20px' }"
        v-html="$t('config_assistant.secunet.step10.description_text_activated')"
      ></p>
      <p
        class="mb-1"
        :style="{ marginTop: '20px' }"
        v-html="$t('config_assistant.secunet.step10.description_text_deactivated')"
      ></p>
      <AssistantToggle v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.SMCB_PIN_OPTION]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';
import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import AssistantToggle from '@/renderer/modules/config-assistant/components/AssistantToggle.vue';

const props = defineProps({
  repositoryData: {
    type: Object as PropType<TRepositoryData>,
    required: true,
  },
});
</script>
