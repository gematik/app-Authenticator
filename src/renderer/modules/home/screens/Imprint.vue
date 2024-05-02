<!--
  - Copyright 2024 gematik GmbH
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
      {{ $t('managing_director') }}: Dr. Florian Hartge<br />
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
import License from '@/../LICENSE.txt';

export default defineComponent({
  name: 'ImprintScreen',
  data() {
    return {
      license: License,
    };
  },
});
</script>
