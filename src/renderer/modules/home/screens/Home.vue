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
  <div class="home flex flex-col justify-center w-full mt-[128px]">
    <div class="flex row justify-center">
      <img src="@/assets/logo_authenticator.png" class="object-contain pr-1 h-[156px]" alt="logo icon" />
    </div>
    <h2 id="lblMainCenter" class="text-center">{{ $t('welcome_to_our_authenticator_app') }}</h2>
    <LoadingSpinner v-if="$store.state.showLoadingSpinner" />
    <OpenSettings v-if="!settingsSet"></OpenSettings>
    <!-- #!if MOCK_MODE === 'ENABLED' -->
    <MockVersionHint />
    <ClearSavedUserConsents />
    <!-- #!endif -->
  </div>
</template>

<script lang="ts">
// #!if MOCK_MODE === 'ENABLED'
import ClearSavedUserConsents from '@/renderer/modules/home/components/ClearSavedUserConsents.vue';
import MockVersionHint from '@/renderer/modules/home/components/MockVersionHint.vue';
// #!endif
import { computed, defineComponent, onMounted } from 'vue';
import OpenSettings from '@/renderer/modules/home/components/OpenSettings.vue';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import LoadingSpinner from '@/renderer/modules/home/components/LoadingSpinner.vue';
import { checkNewUpdate } from '@/renderer/service/auto-updater-service';

export default defineComponent({
  name: 'HomeScreen',
  components: {
    // #!if MOCK_MODE === 'ENABLED'
    ClearSavedUserConsents,
    MockVersionHint,
    // #!endif
    LoadingSpinner,
    OpenSettings,
  },
  setup() {
    const { exist } = useSettings();

    const settingsSet = computed(() => exist());

    onMounted(() => {
      ConnectorConfig.updateConnectorParameters();

      // call auto update
      checkNewUpdate();
    });
    return {
      settingsSet,
    };
  },
});
</script>
