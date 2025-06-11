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
  <SettingsProvider :repository="configFileStoreRepo">
    <base-template>
      <router-view />
    </base-template>
  </SettingsProvider>
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
@import './global.css';

.version span {
  display: none;
}

.version:hover span {
  display: inline;
}
</style>
