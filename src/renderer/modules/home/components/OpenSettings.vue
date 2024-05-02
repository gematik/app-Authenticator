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
  <div class="flex flex-col items-center mt-[64px]">
    <p class="text-base text-baseText mb-[16px]">
      {{ $t('no_settings_found') }}
    </p>
    <button class="bt" type="submit" @click="$router.push('/settings')">
      <img class="inline pr-[8px]" src="@/assets/settings-icon.png" alt="settings icon" />{{ $t('open_settings') }}
    </button>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'OpenSettings',
  components: {},
});
</script>
