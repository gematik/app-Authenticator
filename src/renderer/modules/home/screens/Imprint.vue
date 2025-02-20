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
  -->

<template>
  <div class="home flex flex-col justify-top w-full">
    <h1 class="text-black text-[36px]">
      {{ $t('imprint') }}
    </h1>
    <p class="mt-[24px]">
      gematik GmbH<br />
      Friedrichstraße 136<br />
      10117 Berlin<br />
    </p>
    <p class="mt-[15px]">
      <a href="tel:+493040041-0">Tel +49 30 40041-0</a><br />
      {{ $t('imprint_no_support_hint') }}<br />
      {{ $t('imprint_support_hint') }} <br />
      Fax +49 30 40041-111<br />
      <a href="mailto:info@gematik.de">info@gematik.de</a><br />
    </p>
    <p class="mt-[15px]">
      Amtsgericht Charlottenburg HRB 96351 B<br />
      {{ $t('managing_director') }}: Dr. Florian Fuhrmann, Brenya Adjei, Dr. Florian Hartge<br />
      {{ $t('vat_number') }}: DE241843684
    </p>

    <h1 class="mt-[24px] text-black text-[36px]">
      {{ $t('license') }}
    </h1>
    <!-- There seems to be a bug in tailwindcss so we have to set the font family in style -->
    <pre class="whitespace-pre-line font-sans" style="font-family: 'Apercu', serif">

      {{ license }}
    </pre>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ImprintScreen',
  data() {
    return {
      license: window.api.readLicenceFile(),
    };
  },
});
</script>
