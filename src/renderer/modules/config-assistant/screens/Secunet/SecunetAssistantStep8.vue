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
      {{ $t('config_assistant.secunet.step8.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator-Tutorial-secunetBox.mp4"
      />
    </div>
    <div>
      <p class="mb-2">
        <strong>{{ $t('config_assistant.secunet.step8.step_title') }}</strong>
      </p>
      <p>
        {{ $t('config_assistant.secunet.step8.intro') }}
      </p>
      <div class="assistant-content mt-4">
        <select v-model="props.repositoryData[TLS_AUTH_TYPE_CONFIG]" class="w-full p-2 border border-gray-300 rounded">
          <option :value="TLS_AUTH_TYPE.BasicAuth">{{ $t('config_assistant.secunet.step8.basic_auth') }}</option>
          <option :value="TLS_AUTH_TYPE.ServerClientCertAuth">
            {{ $t('config_assistant.secunet.step8.cert_option_others') }}
          </option>
          <option :value="TLS_AUTH_TYPE.ServerClientCertAuth_Pfx">
            {{ $t('config_assistant.secunet.step8.cert_option_p12') }}
          </option>
          <option :value="TLS_AUTH_TYPE.ServerCertAuth">
            {{ $t('config_assistant.secunet.step8.no_authentication') }}
          </option>
        </select>
      </div>
    </div>
    <div class="flex flex-row mt-8">
      <div class="w-2/3">
        <p class="mb-2">
          <strong>{{ $t('config_assistant.secunet.step8.authentication_description_title') }}</strong>
        </p>
        <ol class="list-decimal list-inside">
          <li class="mb-2">
            {{ $t('config_assistant.secunet.step8.authentication_description_1') }}
          </li>
          <li class="mb-2">
            {{ $t('config_assistant.secunet.step8.authentication_description_2') }}
          </li>
          <li class="mb-2">
            {{ $t('config_assistant.secunet.step8.authentication_description_3') }}
          </li>
        </ol>
      </div>
      <div class="flex flex-col justify-start items-end gap-4 w-1/3">
        <ScreenshotHelper
          :image-src="authenticationScreenshots"
          :image-description="authenticationScreenshotsDescription"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import i18n from '@/renderer/i18n';
import { TLS_AUTH_TYPE_CONFIG } from '@/config';
import { TLS_AUTH_TYPE } from '@/@types/common-types';

const translate = i18n.global.t;

const props = defineProps({
  repositoryData: {
    type: Object as PropType<TRepositoryData>,
    required: true,
  },
});

const emit = defineEmits(['update-validity']);

const authenticationScreenshots = ['secunet_step8_authentication_part1.png', 'secunet_step8_authentication_part2.png'];
const authenticationScreenshotsDescription = [
  translate('config_assistant.secunet.step8.authentication_screen_hint1'),
  translate('config_assistant.secunet.step8.authentication_screen_hint2'),
];
</script>
