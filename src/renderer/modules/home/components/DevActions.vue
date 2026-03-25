<!--
  - Copyright 2026, gematik GmbH
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
  <div class="m-10 text-center">
    <button class="bt ml-[15px]" type="button" @click="clearSavedUserConsents">Remove Saved User Consents</button>
    <!-- #!if MOCK_MODE === 'ENABLED' -->
    <div class="mt-4">
      <button v-if="isDev" class="bt ml-[15px]" type="button" @click="startDemoFlow">Start Flow</button>
    </div>
    <!-- #!endif -->
  </div>
</template>

<script setup>
import Swal from 'sweetalert2';
import { STORAGE_CONFIG_KEYS } from '@/constants';

const clearSavedUserConsents = () => {
  localStorage.removeItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS);
  // show success message, with sweet alert
  Swal.fire({
    icon: 'success',
    title: 'Success',
    text: 'Saved User Consents removed successfully',
    timer: 1000,
  });
};

// #!if MOCK_MODE === 'ENABLED'
import { IS_DEV } from '@/constants';
function startDemoFlow() {
  // Emit an event to start the demo flow
  window.api.openExternal(
    'authenticator://?challenge_path=http://gsltucd01.ltu.int.gematik.de:4011/sign_response?client_id=AuthenticatorDevRemote&response_type=code&redirect_uri=https%3A%2F%2Fauthenticator.example.app.dev.gematik.solutions%2Fcallback&state=eACT5zoTmntheuC3&code_challenge=RlrjrmFChX2iEtF_SZUBd2clTlVTrZQIDbrAzHtTgwE&code_challenge_method=S256&scope=openid%20gem-auth&nonce=nppivSeHDun6h8tO&cardType=HBA',
  );
}
const isDev = IS_DEV;
// #!endif
</script>
