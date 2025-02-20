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
      {{ $t('config_assistant.secunet.step6.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Secunet.mp4"
      />
    </div>
    <p>
      {{ $t('config_assistant.secunet.step6.intro') }}
    </p>

    <div class="text-center text-base">
      <ul class="flex flex-wrap mb-2">
        <li class="me-2">
          <a
            :class="{
              'cursor-pointer inline-block p-1 border-b-2 text-blue-950 border-blue-950 hover:text-blue-950 hover:border-blue-950':
                activeTab === TLS_AUTH_TYPE.ServerClientCertAuth,
              'cursor-pointer inline-block p-1 border-b-2 text-gray-400 border-transparent rounded-t-lg hover:text-blue-950 hover:border-blue-950':
                activeTab !== TLS_AUTH_TYPE.ServerClientCertAuth,
            }"
            @click.prevent="setActiveTab(TLS_AUTH_TYPE.ServerClientCertAuth)"
          >
            {{ $t('config_assistant.secunet.step6.server_client_cert_auth') }}
          </a>
        </li>
        <li class="me-2">
          <a
            :class="{
              'cursor-pointer inline-block p-1 border-b-2 text-blue-950 border-blue-950 hover:text-blue-950 hover:border-blue-950':
                activeTab === TLS_AUTH_TYPE.ServerClientCertAuth_Pfx,
              'cursor-pointer inline-block p-1 border-b-2 text-gray-400 border-transparent rounded-t-lg hover:text-blue-950 hover:border-blue-950':
                activeTab !== TLS_AUTH_TYPE.ServerClientCertAuth_Pfx,
            }"
            @click.prevent="setActiveTab(TLS_AUTH_TYPE.ServerClientCertAuth_Pfx)"
          >
            {{ $t('config_assistant.secunet.step6.pfx') }}
          </a>
        </li>
        <li class="me-2">
          <a
            :class="{
              'cursor-pointer inline-block p-1 border-b-2 text-blue-950 border-blue-950 hover:text-blue-950 hover:border-blue-950':
                activeTab === TLS_AUTH_TYPE.BasicAuth,
              'cursor-pointer inline-block p-1 border-b-2 text-gray-400 border-transparent rounded-t-lg hover:text-blue-950 hover:border-blue-950':
                activeTab !== TLS_AUTH_TYPE.BasicAuth,
            }"
            @click.prevent="setActiveTab(TLS_AUTH_TYPE.BasicAuth)"
          >
            {{ $t('config_assistant.secunet.step6.basic_auth') }}
          </a>
        </li>
        <li class="me-2">
          <a
            :class="{
              'cursor-pointer inline-block p-1 border-b-2 text-blue-950 border-blue-950 hover:text-blue-950 hover:border-blue-950':
                activeTab === TLS_AUTH_TYPE.ServerCertAuth,
              'cursor-pointer inline-block p-1 border-b-2 text-gray-400 border-transparent rounded-t-lg hover:text-blue-950 hover:border-blue-950':
                activeTab !== TLS_AUTH_TYPE.ServerCertAuth,
            }"
            @click.prevent="setActiveTab(TLS_AUTH_TYPE.ServerCertAuth)"
          >
            {{ $t('config_assistant.secunet.step6.no_auth') }}
          </a>
        </li>
      </ul>
    </div>
    <div id="default-tab-content">
      <div v-if="activeTab === TLS_AUTH_TYPE.ServerClientCertAuth" class="p-0 max-w-screen-md max-h-96" role="tabpanel">
        <div class="flex flex-row mb-8">
          <div class="w-2/3">
            <ol class="list-decimal list-outside ml-4">
              <li class="list-item mt-1">{{ $t('config_assistant.secunet.step6.server_client_cert_auth_step1') }}</li>
              <li class="list-item mt-2">{{ $t('config_assistant.secunet.step6.server_client_cert_auth_step2') }}</li>
              <li class="list-item mt-2">{{ $t('config_assistant.secunet.step6.server_client_cert_auth_step3') }}</li>
              <li class="list-item mt-2">{{ $t('config_assistant.secunet.step6.server_client_cert_auth_step4') }}</li>
              <li class="list-item mt-2">{{ $t('config_assistant.secunet.step6.server_client_cert_auth_step6') }}</li>
            </ol>
          </div>
          <div class="flex flex-col gap-4">
            <ScreenshotHelper
              image-src="secu_step6_cert.png"
              :image-description="$t('config_assistant.secunet.step6.screen_hint')"
            />
          </div>
        </div>
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE]"
          :file-callback="(e) => moveCertFile(e, repositoryData)"
          :label="$t('client_certificate')"
          type="file"
          @update-validity="updateValidity"
        />
        <AssistantInput
          v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY]"
          :label="$t('private_key')"
          :file-callback="(e) => movePrivateKey(e, repositoryData)"
          type="file"
          @update-validity="updateValidity"
        />
      </div>
    </div>
    <div v-if="activeTab === TLS_AUTH_TYPE.ServerClientCertAuth_Pfx" class="p-0 max-w-screen-md max-h-96">
      <p>{{ $t('config_assistant.secunet.step6.pfx') }}</p>
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE]"
        :label="$t('pfx_file')"
        :file-callback="(e) => validateP12AndMove(e, repositoryData)"
        type="file"
        @update-validity="updateValidity"
      />
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD]"
        :label="$t('pfx_file_password')"
        type="password"
        @update-validity="updateValidity"
      />
    </div>
    <div v-if="activeTab === TLS_AUTH_TYPE.BasicAuth" class="p-0 max-w-screen-md max-h-96 mt-2">
      <p class="mb-4">
        {{ $t('config_assistant.secunet.step6.basic_auth_hint') }}
      </p>
      <hr />
      <p>{{ $t('info_text_username_con') }}</p>
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.USERNAME_BASIC_AUTH]"
        :label="$t('username_from_connector')"
        type="text"
        @update-validity="updateValidity"
      />
      <p class="mt-4">{{ $t('info_text_password_con') }}</p>
      <AssistantInput
        v-model="props.repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.PASSWORD_BASIC_AUTH]"
        :label="$t('password_from_connector')"
        type="password"
        style="max-width: 80%"
        @update-validity="updateValidity"
      />
    </div>
    <div v-if="activeTab === TLS_AUTH_TYPE.ServerCertAuth" class="p-0 max-w-screen-md max-h-96 mt-2">
      <p>
        {{ $t('config_assistant.secunet.step6.no_auth_hint') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import { ENTRY_OPTIONS_CONFIG_GROUP, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { computed, PropType } from 'vue';
import { TLS_AUTH_TYPE } from '@/@types/common-types';
import { moveCertFile, movePrivateKey, validateP12AndMove } from '@/renderer/modules/settings/screens/formBuilder';
import { TRepositoryData } from '@/renderer/modules/settings/repository';

const props = defineProps({
  repositoryData: {
    type: Object as PropType<TRepositoryData>,
    required: true,
  },
});

const activeTab = computed(() => {
  return props.repositoryData[TLS_AUTH_TYPE_CONFIG];
});

const setActiveTab = (tab: TLS_AUTH_TYPE) => {
  props.repositoryData[TLS_AUTH_TYPE_CONFIG] = tab;
};

const emit = defineEmits(['update-validity']);

function updateValidity(payload: { label: string; isValid: boolean }) {
  emit('update-validity', payload);
}
</script>
