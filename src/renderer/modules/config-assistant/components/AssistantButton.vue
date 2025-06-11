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
<script setup lang="ts">
import i18n from '@/renderer/i18n';
import { logger } from '@/renderer/service/logger';

enum Positioning {
  left = 'start',
  right = 'end',
  middle = 'center',
}

const props = withDefaults(
  defineProps<{
    buttonText?: string;
    buttonLink: string;
    positioning?: Positioning;
  }>(),
  {
    positioning: Positioning.left,
    buttonText: i18n.global.t('config_assistant.help_video_button'),
  },
);

const openExternalLink = (url: string) => {
  if (window && window.api && typeof window.api.openExternal === 'function') {
    window.api.openExternal(url);
  } else {
    logger.error('window.api.openExternal is not available');
  }
};
</script>

<template>
  <div :style="`text-align: ${positioning};`">
    <a @click="openExternalLink(props.buttonLink)">{{ buttonText }}</a>
  </div>
</template>

<style scoped>
@import '../../../global.css';
div {
  margin-top: 10px;
}

a {
  background-color: transparent;
  border: 2px solid #000e52;
  border-radius: 8px;
  color: #000e52;
  font-size: 17px;
  padding: 10px 20px;
  cursor: pointer;
}

a:hover {
  background-color: #000e52;
  color: white;
}
</style>
