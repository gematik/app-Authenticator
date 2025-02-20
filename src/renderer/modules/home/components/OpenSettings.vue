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
  <div class="flex flex-col items-center mt-[64px]">
    <p class="text-base text-baseText mb-[16px]">
      {{ $t('no_settings_found') }}
    </p>
    <button class="bt flex items-center" type="submit" @click="startConfigAssistant">
      <img class="inline-block pr-[8px]" src="@/assets/settings-icon.png" alt="settings icon" />{{
        $t('open_assistant')
      }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

async function startConfigAssistant() {
  await router.push('/config-assistant');
}
</script>
