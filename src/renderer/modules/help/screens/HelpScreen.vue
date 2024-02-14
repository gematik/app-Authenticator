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
  <div class="home flex flex-col justify-top w-full">
    <div>
      <h1 class="text-black text-[24px]">
        {{ $t('header_requirement') }}
      </h1>
      <i18n-t keypath="text_critieria_catalogue" tag="div">
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
