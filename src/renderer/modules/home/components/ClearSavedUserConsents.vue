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

<template>
  <div class="m-10 text-center">
    <button class="bt ml-[15px]" type="button" @click="clearSavedUserConsents">Remove Saved User Consents</button>
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
</script>
