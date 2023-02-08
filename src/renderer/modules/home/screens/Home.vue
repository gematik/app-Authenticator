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

<template>
  <div class="home flex flex-col justify-center w-full mt-[128px]">
    <div class="flex row justify-center">
      <img src="@/assets/logo_authenticator.png" class="object-contain pr-1 h-[156px]" alt="logo icon" />
    </div>
    <h2 id="lblMainCenter" class="text-center">{{ $t('welcome_to_our_authenticator_app') }}</h2>
    <LoadingSpinner v-if="$store.state.showLoadingSpinner" />
    <OpenSettings v-if="!settingsSet"></OpenSettings>
    <MockVersionHint v-if="isMock" />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue';
import OpenSettings from '@/renderer/modules/home/components/OpenSettings.vue';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import LoadingSpinner from '@/renderer/modules/home/components/LoadingSpinner.vue';
import { checkNewUpdate } from '@/renderer/service/auto-updater-service';
import MockVersionHint from '@/renderer/modules/home/components/MockVersionHint.vue';
import { validateMockVersion } from '@/renderer/utils/validate-mock-version';

export default defineComponent({
  name: 'HomeScreen',
  components: {
    MockVersionHint,
    LoadingSpinner,
    OpenSettings,
  },
  setup() {
    const { exist } = useSettings();

    const settingsSet = computed(() => exist());

    const isMock = validateMockVersion();

    onMounted(() => {
      ConnectorConfig.updateConnectorParameters();

      // call auto update
      checkNewUpdate();
    });
    return {
      settingsSet,
      isMock,
    };
  },
});
</script>
