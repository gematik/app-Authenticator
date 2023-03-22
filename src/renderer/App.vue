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
  <base-template>
    <SettingsProvider :repository="configFileStoreRepo">
      <router-view />
    </SettingsProvider>
  </base-template>
</template>

<script lang="ts" setup>
import BaseTemplate from '@/renderer/components/BaseTemplate.vue';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import { SettingsProvider } from '@/renderer/modules/settings/SettingsProvider';

const configFileStoreRepo = new FileStorageRepository();
</script>

<style>
.version span {
  display: none;
}

.version:hover span {
  display: inline;
}
</style>
