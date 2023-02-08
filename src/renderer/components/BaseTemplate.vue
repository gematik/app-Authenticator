<!--
  - Copyright (c) 2023 gematik GmbH
  - 
  - Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
  - the European Commission - subsequent versions of the EUPL (the Licence);
  - You may not use this work except in compliance with the Licence.
  - You may obtain a copy of the Licence at:
  - 
  -     https://joinup.ec.europa.eu/software/page/eupl
  - 
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the Licence is distributed on an "AS IS" basis,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the Licence for the specific language governing permissions and
  - limitations under the Licence.
  - 
  -->

<script lang="ts" setup>
import AuthFlowProcess from '@/renderer/modules/auth-service/event-listeners/AuthFlowProcess.vue';
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import { computed } from 'vue';
import { IS_DEV, PROCESS_ENVS } from '@/constants';

const version = IS_DEV ? 'dev ' : PROCESS_ENVS.VERSION ?? 'Unbekannt';

const buildVersion = computed(() => {
  if (IS_DEV) {
    const packageJson = require('../../../package.json');
    return packageJson.version;
  }
  if (PROCESS_ENVS.BRANCH_NAME && PROCESS_ENVS.BRANCH_NAME !== PROCESS_ENVS.TAG_NAME && PROCESS_ENVS.BUILD_NUMBER) {
    return `${PROCESS_ENVS.BRANCH_NAME}-${PROCESS_ENVS.BUILD_NUMBER}`;
  }
  return PROCESS_ENVS.BUILD_NUMBER === true ? ` ${PROCESS_ENVS.BUILD_NUMBER}` : ' snapshot';
});
</script>

<template>
  <div class="h-full flex flex-col bg-primary text-defaultext">
    <div class="flex flex-row justify-between px-[32px] py-[32px]">
      <div>
        <router-link id="navLogin" to="/" class="mr-[16px]">
          {{ $t('registration') }}
        </router-link>
        <router-link id="navSettings" to="/settings">
          {{ $t('settings') }}
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

    <AuthFlowProcess />
    <GemIdpAuthFlowProcess />
  </div>
</template>
