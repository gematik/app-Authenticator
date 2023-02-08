<!--
  - Copyright (c) 2023 gematik GmbH
  - 
  - Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
  - the European Commission - subsequent versions of the EUPL (the Licence);
  - You may not use this work except in compliance with the Licence.
  - You may obtain a copy of the Licence at:
  - 
  -     https://joinup.ec.europa.eu/software/page/eupl
  - 
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the Licence is distributed on an "AS IS" basis,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the Licence for the specific language governing permissions and
  - limitations under the Licence.
  - 
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
