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
  <div>
    <!-- Basic Auth -->
    <div class="m-4" v-if="props.repositoryData[TLS_AUTH_TYPE_CONFIG] == TLS_AUTH_TYPE.BasicAuth">
      <div class="assistant-heading flex flex-row justify-between">
        {{ $t('config_assistant.rise.step9.BasicAuth.title') }}
        <AssistantButton
          button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Rise_small.mp4"
        />
      </div>
      <div class="flex flex-row mb-8">
        <div class="w-2/3">
          <strong> {{ $t('config_assistant.rise.step9.BasicAuth.title') }}</strong>
          <p class="mb-4 mt-2 flex flex-row justify-between">
            {{ $t('config_assistant.rise.step9.BasicAuth.basic_auth_hint') }}
          </p>
        </div>
        <div class="flex flex-col justify-start items-end gap-4 w-1/3">
          <ScreenshotHelper :image-src="basicAuthScreenshots" :image-description="basicAuthScreenshotsDescription" />
        </div>
      </div>
      <div class="mt-8">
        <p>{{ $t('info_text_username_con') }}</p>
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.USERNAME_BASIC_AUTH]"
          placeholder="Ihre Eingabe"
          :label="$t('username_from_connector')"
          type="text"
          @update-validity="updateValidity"
        />
      </div>
      <div class="mt-8">
        <p class="mt-4">{{ $t('info_text_password_con') }}</p>
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.PASSWORD_BASIC_AUTH]"
          placeholder="Ihre Eingabe"
          :label="$t('password_from_connector')"
          type="password"
          style="max-width: 80%"
          @update-validity="updateValidity"
        />
      </div>
    </div>
    <!-- Server Cert Auth -->
    <div class="m-4" v-if="props.repositoryData[TLS_AUTH_TYPE_CONFIG] == TLS_AUTH_TYPE.ServerClientCertAuth">
      <div class="assistant-heading flex flex-row justify-between">
        {{ $t('config_assistant.rise.step9.ServerClientCertAuth.title') }}
        <AssistantButton
          button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Rise_small.mp4"
        />
      </div>
      <div class="flex flex-row mt-8">
        <div class="w-2/3">
          <p class="mb-1 flex flex-row justify-between">
            <strong>{{ $t('config_assistant.rise.step9.ServerClientCertAuth.intro') }}</strong>
          </p>
          <ol class="list-decimal list-outside ml-4">
            <li class="list-item mt-2">
              {{ $t('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_step1') }}
            </li>
            <li class="list-item mt-2">
              {{ $t('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_step2') }}
            </li>
            <li class="list-item mt-2">
              {{ $t('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_step3') }}
            </li>
            <li class="list-item mt-2">
              {{ $t('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_step4') }}
            </li>
            <li class="list-item mt-2">
              {{ $t('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_step5') }}
            </li>
            <li class="list-item mt-2">
              {{ $t('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_step6') }}
            </li>
          </ol>
        </div>
        <div class="flex flex-col justify-start items-end gap-4 w-1/3">
          <ScreenshotHelper :image-src="certScreenshots" :image-description="certScreenshotsDescription" />
        </div>
      </div>
      <div class="mt-8">
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE]"
          :file-callback="(e) => moveCertFile(e, repositoryData)"
          :label="$t('client_certificate')"
          type="file"
          @update-validity="updateValidity"
        />
      </div>
      <div class="mt-4">
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY]"
          :label="$t('private_key')"
          :file-callback="(e) => movePrivateKey(e, repositoryData)"
          type="file"
          @update-validity="updateValidity"
        />
      </div>
    </div>
    <!-- PFX Cert Auth -->
    <div class="m-4" v-if="props.repositoryData[TLS_AUTH_TYPE_CONFIG] == TLS_AUTH_TYPE.ServerClientCertAuth_Pfx">
      <div class="assistant-heading flex flex-row justify-between">
        {{ $t('config_assistant.rise.step9.ServerClientCertAuth_Pfx.title') }}
        <AssistantButton
          button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Rise_small.mp4"
        />
      </div>
      <div>
        <strong>{{ $t('config_assistant.rise.step9.ServerClientCertAuth_Pfx.pfx') }}</strong>
        <p class="mb-1 mt-2">
          {{ $t('config_assistant.rise.step9.ServerClientCertAuth_Pfx.pfx_hint') }}
        </p>
      </div>
      <div class="mt-4">
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE]"
          :label="$t('pfx_file')"
          :file-callback="(e) => validateP12AndMove(e, repositoryData)"
          type="file"
          @update-validity="updateValidity"
        />
      </div>
      <div class="mt-4">
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD]"
          :label="$t('pfx_file_password')"
          type="password"
          @update-validity="updateValidity"
        />
      </div>
    </div>
    <!-- ServerCertAuth -->
    <div class="m-4" v-if="props.repositoryData[TLS_AUTH_TYPE_CONFIG] == TLS_AUTH_TYPE.ServerCertAuth">
      <div class="assistant-heading flex flex-row justify-between">
        {{ $t('config_assistant.rise.step9.ServerCertAuth.step_title') }}
      </div>

      <div class="mt-4 bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
        <p class="font-bold">{{ $t('config_assistant.rise.step9.ServerCertAuth.no_authentication_hint') }}</p>
        <p>{{ $t('config_assistant.rise.step9.ServerCertAuth.no_authentication_text') }}</p>
      </div>
      <div class="mt-4">
        <p>{{ $t('config_assistant.rise.step9.ServerCertAuth.no_authentication_back') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import { ENTRY_OPTIONS_CONFIG_GROUP, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { PropType } from 'vue';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { moveCertFile, movePrivateKey, validateP12AndMove } from '@/renderer/modules/settings/screens/formBuilder';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import i18n from '@/renderer/i18n';

const props = defineProps({
  repositoryData: {
    type: Object as PropType<TRepositoryData>,
    required: true,
  },
});

const translate = i18n.global.t;

const emit = defineEmits(['update-validity']);

function updateValidity(payload: { label: string; isValid: boolean }) {
  emit('update-validity', payload);
}

const basicAuthScreenshots = [
  'rise_step9_user_pw_part1.png',
  'rise_step9_user_pw_part2.png',
  'rise_step9_user_pw_part3.png',
];
const basicAuthScreenshotsDescription = [
  translate('config_assistant.rise.step9.BasicAuth.basicAuth_screen_hint1'),
  translate('config_assistant.rise.step9.BasicAuth.basicAuth_screen_hint2'),
  translate('config_assistant.rise.step9.BasicAuth.basicAuth_screen_hint3'),
];

const certScreenshots = [
  'rise_step10_cert_part1.png',
  'rise_step10_cert_part2.png',
  'rise_step10_cert_part3.png',
  'rise_step10_cert_part4.png',
];
const certScreenshotsDescription = [
  translate('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_screen_hint1'),
  translate('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_screen_hint2'),
  translate('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_screen_hint3'),
  translate('config_assistant.rise.step9.ServerClientCertAuth.server_client_cert_auth_screen_hint4'),
];
</script>
