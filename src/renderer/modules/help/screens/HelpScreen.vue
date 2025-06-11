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
  <div class="home flex flex-col justify-top w-full">
    <div>
      <h1 class="text-black text-[24px]">
        {{ $t('header_requirement') }}
      </h1>
      <i18n-t keypath="text_criteria_catalogue" tag="div">
        <template #url>
          <button class="text-blue-900" @click="openCriteriaCatalogueURL()">Authenticator Kriterienkatalog</button>
        </template>
      </i18n-t>
      <h1 class="text-black text-[24px]">
        {{ $t('header_manual') }}
      </h1>
      <i18n-t keypath="text_manual" tag="div">
        <template #url>
          <button class="text-blue-900" @click="openManualURL()">Authenticator Installationshandbuch</button>
        </template>
      </i18n-t>
      <h1 class="text-black text-[24px]">
        {{ $t('header_error_codes') }}
      </h1>
      <i18n-t keypath="text_error_codes" tag="div">
        <template #url>
          <button class="text-blue-900" @click="openWikiErrorCodesURL()">Authenticator Errorcodes Übersicht</button>
        </template>
      </i18n-t>
      <h1 class="text-black text-[24px]">
        {{ $t('header_github') }}
      </h1>
      <i18n-t keypath="text_github" tag="div">
        <template #url>
          <button class="text-blue-900" @click="openGitHubURL()">Authenticator GitHub Seite</button>
        </template>
      </i18n-t>
      <h1 class="text-black text-[24px]">
        {{ $t('header_privacy_notice') }}
      </h1>
      <i18n-t keypath="text_privacy_notice" tag="div">
        <template #url>
          <button class="text-blue-900" @click="openPrivacyPage()">
            Datenschutzhinweis für den gematik Authenticator
          </button>
        </template>
      </i18n-t>
    </div>
  </div>
</template>

<script>
import {
  CRITERIA_CATALOGUE_URL,
  GITHUB_URL,
  MANUAL_URL,
  WIKI_CONSENT_DECLARATION_URL,
  WIKI_ERRORCODES_URL,
} from '@/constants';

export default {
  name: 'HelpScreen',
  methods: {
    openCriteriaCatalogueURL() {
      window.api.openExternal(CRITERIA_CATALOGUE_URL);
    },
    openWikiErrorCodesURL() {
      window.api.openExternal(WIKI_ERRORCODES_URL);
    },
    openGitHubURL() {
      window.api.openExternal(GITHUB_URL);
    },
    openManualURL() {
      window.api.openExternal(MANUAL_URL);
    },
    openPrivacyPage() {
      window.api.openExternal(WIKI_CONSENT_DECLARATION_URL);
    },
  },
};
</script>
