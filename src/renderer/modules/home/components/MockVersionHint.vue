<!--
  - Copyright 2023 gematik GmbH
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
  <div class="m-10">
    <div class="flex row justify-center">
      <img src="@/assets/Error@2x.png" alt="error icon" />
    </div>
    <div class="flex row justify-center text-center text-red-700">
      <i18n-t keypath="mock_version_hint" tag="div">
        <template #url>
          <button class="text-blue-900" @click="openSharePointURL()">gematik SharePoint</button>
        </template>
      </i18n-t>
    </div>
  </div>
</template>

<script>
import { SharePoint_URL } from '@/constants';

export default {
  name: 'MockVersionHint',
  methods: {
    openSharePointURL() {
      window.api.openExternal(SharePoint_URL);
    },
  },
};
</script>
