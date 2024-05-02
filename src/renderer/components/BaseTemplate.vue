<!--
  - Copyright 2024 gematik GmbH
  -
  - The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
  - Sourcecode must be in compliance with the EUPL.
  -
  - You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
  -
  - Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
  - IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
  - language governing permissions and limitations under the License.ee the Licence for the specific language governing
  - permissions and limitations under the Licence.
  -->

<script lang="ts" setup>
import GemIdpAuthFlowProcess from '@/renderer/modules/gem-idp/event-listeners/GemIdpAuthFlowProcess.vue';
import { computed } from 'vue';
import { IS_DEV, PROCESS_ENVS } from '@/constants';

let version = PROCESS_ENVS.VERSION ?? 'Unbekannt';

// #!if MOCK_MODE === 'ENABLED'
if (IS_DEV) {
  version = 'dev ';
}
// #!endif

const buildVersion = computed(() => {
  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    const packageJson = require('../../../package.json');
    return packageJson.version;
  }
  // #!endif

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
        <router-link id="navLogin" to="/" class="p-1.5 mr-[16px] rounded-sm operator:hover bg-primary">
          {{ $t('registration') }}
        </router-link>
        <router-link id="navSettings" to="/settings" class="p-1.5 mr-[16px] rounded-sm operator:hover bg-primary">
          {{ $t('settings') }}
        </router-link>
        <router-link id="navHelp" to="/help" class="p-1.5 rounded-sm operator:hover bg-primary">
          {{ $t('help') }}
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

    <GemIdpAuthFlowProcess />
  </div>
</template>

<style lang="scss" scoped>
#navLogin:hover {
  background-color: rgb(240, 240, 240);
  border-bottom: rgba(78, 91, 166, 0.5) 2px solid;
}

#navSettings:hover {
  background-color: rgb(240, 240, 240);
  border-bottom: rgba(78, 91, 166, 0.5) 2px solid;
}

#navHelp:hover {
  background-color: rgb(240, 240, 240);
  border-bottom: rgba(78, 91, 166, 0.5) 2px solid;
}
</style>
