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
import { IPC_UPDATE_ENV, updateProcessEnvs } from '@/constants';
import { logger } from '@/renderer/service/logger';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { clearEndpoints } from '@/renderer/modules/connector/connector_impl/sds-request';

const configFileStoreRepo = new FileStorageRepository();

/**
 * Event listener for Environment variables change.
 * We should update config store and connector's config store.
 * This should stay under App.vue as we need to call the load() function of the right repository class.
 */
window.api.on(IPC_UPDATE_ENV, () => {
  logger.info('Reloading window due to env variable changes');

  updateProcessEnvs();

  // re-load content
  configFileStoreRepo.load(true);

  // put data in connector module

  ConnectorConfig.updateConnectorParameters();
  clearEndpoints();
});
</script>

<style>
.version span {
  display: none;
}

.version:hover span {
  display: inline;
}
</style>
