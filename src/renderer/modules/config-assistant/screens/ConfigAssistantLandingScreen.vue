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
  <div class="home flex flex-col mt-[128px] ml-2 mr-2 justify-items-center gap-2 text-center">
    <img src="@/assets/logo_authenticator.png" class="object-contain pr-1 h-[156px]" alt="logo icon" />
    <h2 id="lblMainCenter" class="ml-20 mr-20">{{ $t('config_assistant.landing_text') }}</h2>
    <div class="mt-8">
      <button class="bt rounded-[4px] ml-[15px] w-60" type="button" @click="startAssistant(KONNEKTOR_VENDORS.Rise)">
        {{ $t('config_assistant.start_rise') }}
      </button>
      <button class="bt rounded-[4px] ml-[15px] w-60" type="button" @click="startAssistant(KONNEKTOR_VENDORS.Koco)">
        {{ $t('config_assistant.start_koco') }}
      </button>
      <button class="bt ml-[15px] w-60" type="button" @click="startAssistant(KONNEKTOR_VENDORS.Secunet)">
        {{ $t('config_assistant.start_secunet') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { KONNEKTOR_VENDORS } from '@/@types/common-types';

const router = useRouter();
const startAssistant = (name: KONNEKTOR_VENDORS) => {
  router.push({ name: 'config-assistant', params: { konnektor: name, step: 1 } });
};
</script>
