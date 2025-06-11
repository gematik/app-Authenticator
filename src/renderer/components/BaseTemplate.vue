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

<script lang="ts" setup>
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import { computed } from 'vue';
import { IS_DEV, PROCESS_ENVS } from '@/constants';
import { useRoute } from 'vue-router';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import packageJson from '../../../package.json';

let version = packageJson.version;

const route = useRoute();

// #!if MOCK_MODE === 'ENABLED'
if (IS_DEV) {
  version = 'dev ';
}
// #!endif

const isActiveAssistant = computed(() => {
  return route.path.startsWith('/config-assistant');
});

const buildVersion = computed(() => {
  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    return packageJson.version;
  }
  // #!endif

  if (PROCESS_ENVS.BRANCH_NAME && PROCESS_ENVS.BRANCH_NAME !== PROCESS_ENVS.TAG_NAME && PROCESS_ENVS.BUILD_NUMBER) {
    return `${PROCESS_ENVS.BRANCH_NAME}-${PROCESS_ENVS.BUILD_NUMBER}`;
  }
  return PROCESS_ENVS.BUILD_NUMBER === true ? ` ${PROCESS_ENVS.BUILD_NUMBER}` : ' snapshot';
});

const { exist } = useSettings();

const settingsSet = computed(() => exist());
</script>

<template>
  <div class="h-full flex flex-col bg-primary text-defaultext">
    <div class="flex flex-row justify-between px-[32px] py-[32px]">
      <div>
        <router-link id="navLogin" to="/" class="p-1.5 mr-[16px] operator:hover bg-primary">
          {{ $t('registration') }}
        </router-link>
        <router-link id="navSettings" to="/settings" class="p-1.5 mr-[16px] operator:hover bg-primary">
          {{ $t('settings') }}
        </router-link>
        <router-link id="navHelp" to="/help" class="p-1.5 mr-[16px] operator:hover bg-primary">
          {{ $t('help') }}
        </router-link>
        <router-link
          v-if="!settingsSet"
          id="navConfigAssistant"
          to="/config-assistant"
          :class="['p-1.5', 'mr-[16px]', 'operator:hover', 'bg-primary', { 'router-link-active': isActiveAssistant }]"
        >
          {{ $t('config_assistant.menu-title') }}
        </router-link>
      </div>
      <img src="@/assets/logo_gematik.svg" class="object-contain" alt="logo" />
    </div>

    <div id="app-content" class="content flex-1 px-[32px] overflow-auto">
      <slot />
    </div>

    <div class="flex flex-row justify-between relative px-[32px] py-[32px]">
      <router-link to="/imprint" class="inline-flex">
        <img src="@/assets/info.svg" class="object-contain mr-[8px]" alt="info icon" />
        <span id="lblImprint" class="text-sm hover:underline">{{ $t('imprint') }}</span>
      </router-link>
      <div id="lblVersion" class="text-sm cursor-default" :title="buildVersion">{{ $t('version', { version }) }}</div>
    </div>

    <AuthFlow />
  </div>
</template>

<style scoped>
@import '../global.css';

#navLogin:hover,
#navSettings:hover,
#navHelp:hover,
#navConfigAssistant:hover {
  background-color: rgb(240, 240, 240);
  border-bottom: rgba(78, 91, 166, 0.5) 2px solid;
}
</style>
