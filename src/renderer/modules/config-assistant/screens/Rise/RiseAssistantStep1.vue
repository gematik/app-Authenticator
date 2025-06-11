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
  <div class="assistant-content m-4">
    <div class="assistant-heading flex flex-row justify-between">
      {{ $t('config_assistant.rise.step1.title') }}
      <AssistantButton
        button-link="https://wiki.gematik.de/download/attachments/540043222/Authenticator_Tutorial_Rise_small.mp4"
      />
    </div>
    <div class="mb-4">
      <p>
        {{ $t('config_assistant.rise.step1.intro') }}
      </p>
    </div>
    <div class="mb-4">
      <p>
        <strong>{{ $t('config_assistant.help_videos_title') }}</strong>
      </p>
      <p class="mb-4">{{ $t('config_assistant.help_videos_content') }}</p>
    </div>
    <div class="mb-4">
      <p>
        <strong>{{ $t('config_assistant.help_screenshots_title') }}</strong>
      </p>
      <p>{{ $t('config_assistant.help_screenshots_content') }}</p>
      <p>
        <ScreenshotHelper
          :image-description="translate('example_screenshot_description')"
          image-src="example_screenshot.jpg"
        />
      </p>
    </div>
    <div class="mb-2">
      <p>
        <strong>{{ $t('config_assistant.help_input_title') }}</strong>
      </p>
      <AssistantInput
        :disabled="true"
        placeholder="Ihre Eingabe"
        :label="translate('example')"
        type="text"
        :callback="
          () => {
            return;
          }
        "
      />
      <p>{{ $t('config_assistant.help_input_content') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AssistantButton from '@/renderer/modules/config-assistant/components/AssistantButton.vue';
import ScreenshotHelper from '@/renderer/modules/config-assistant/components/ScreenshotHelper.vue';
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import i18n from '@/renderer/i18n';

const translate = i18n.global.t;
</script>
