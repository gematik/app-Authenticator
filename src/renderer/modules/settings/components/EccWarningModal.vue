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
  <div
    id="test-results-container"
    class="overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none justify-center items-center flex"
  >
    <div class="relative my-6 mx-auto max-w-6xl p-6 min-w-2 w-[800px]">
      <!--content-->
      <div class="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
        <!--header-->

        <div class="flex items-start p-6 justify-between border-b border-solid border-slate-200 rounded-md">
          <h3 class="text-2xl align-middle font-semibold">{{ $t('ecc_warning_options.modal_title') }}</h3>
        </div>
        <!--body-->
        <div id="scrollable-content" class="relative p-6 flex-auto rounded-md w-full">
          <LoadingSpinner show-text v-if="loading" />
          <div
            v-else-if="results.length"
            v-for="item in results"
            :key="item.name"
            class="rounded w-full pb-4 last:pb-0"
          >
            <div
              class="container text-slate-500 p-2 text-lg leading-relaxed rounded-lg"
              :class="{
                'bg-green-300': item.status === CertStatus.success,
                'bg-orange-100': item.status === CertStatus.loading,
                'bg-red-100': item.status === CertStatus.error,
              }"
            >
              <div class="grid grid-cols-8 gap-4">
                <div class="flex items-center justify-center">
                  <LoadingSpinner v-if="item.status === CertStatus.loading" />
                  <img
                    v-else-if="item.status === CertStatus.success"
                    src="@/assets/Success@2x.png"
                    class="object-none p-4"
                    alt="error icon"
                  />
                  <img v-else src="@/assets/Error@2x.png" class="object-none p-4" alt="error icon" />
                </div>
                <div class="col-span-7">
                  <div :id="item.name" class="pl-1 pr-1 flex justify-between">
                    <strong>{{ item.name }}</strong> <span>ICCSN: {{ item.iccsn }}</span>
                  </div>
                  <div class="text-sm pl-1 pr-1 pb-1">
                    <span>{{ $t('ecc_warning_options.ecc_validity') }}:</span>
                    <span
                      :class="{
                        'ml-1': item.status === CertStatus.success,
                        'text-red-500 ml-1': item.status !== CertStatus.success,
                      }"
                    >
                      {{
                        $t(
                          item.status === CertStatus.success
                            ? 'ecc_warning_options.your_card_is_ready_for_ecc_migration'
                            : 'ecc_warning_options.your_card_is_not_ready_for_ecc_migration',
                        )
                      }}
                    </span>
                  </div>
                  <div class="text-sm pl-1 pr-1 pb-1">
                    <span>{{ $t('ecc_warning_options.valid_to') }}:</span>
                    <span
                      :class="{
                        'ml-1': item.validity.isValid,
                        'text-red-500 ml-1': !item.validity.isValid,
                      }"
                    >
                      {{ item.validity.date.toLocaleDateString('de') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-red-500 p-2 text-lg">
            {{ $t('ecc_warning_options.no_cards_found') }}
          </div>
        </div>

        <!--footer-->
        <div class="flex justify-between p-6 border-t border-solid border-slate-200 rounded-b">
          <div v-if="!loading" class="flex justify-start w-full">
            <button
              class="bg-blue-500 text-white active:bg-blue-600 font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 w-full"
              type="button"
              @click="openFachportalURL()"
            >
              {{ $t('ecc_warning_options.ecc_migration_documentation_url') }}
            </button>
          </div>
          <div class="flex justify-end w-full">
            <button
              class="bg-blue-500 text-white active:bg-blue-600 font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150 w-full"
              type="button"
              @click="toggleEccWarningModal(false)"
            >
              {{ $t('close_dlg') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ECC_MIGRATION_GUIDE } from '@/constants';
import { alertTechnicErrorWithIconOptional, escapeHTML } from '@/renderer/utils/utils';
import LoadingSpinner from '@/renderer/modules/home/components/LoadingSpinner.vue';
import { TRealCardData } from '@/renderer/modules/connector/type-definitions';
import { launch as getCards } from '@/renderer/modules/connector/connector_impl/get-cards-launcher';
import { logger } from '@/renderer/service/logger';
import { ERROR_CODES } from '@/error-codes';

const props = defineProps({
  toggleEccWarningModal: {
    type: Function as unknown as () => (show: boolean) => {},
    required: true,
  },
});

enum CertStatus {
  'success',
  'error',
  'loading',
}

const loading = ref(true);
const results = ref(
  [] as {
    name: string;
    validity: {
      date: Date;
      isValid: boolean;
    };
    iccsn: string;
    status: CertStatus;
    version?: number;
  }[],
);

const getCerts = async () => {
  try {
    const cards: TRealCardData[] = (await getCards()) as TRealCardData[];
    results.value = cards
      .filter((card) => card?.CardHandle)
      .map((cert) => {
        const isValid = new Date(cert.CertificateExpirationDate) > new Date();
        const versionAsNumber = Number(Object.values(cert.CardVersion?.ObjectSystemVersion).join(''));
        const eccReadyVersion = 440;

        return {
          name: cert.CardType,
          iccsn: cert.Iccsn,
          validity: {
            date: new Date(cert.CertificateExpirationDate),
            isValid: isValid,
          },
          status: versionAsNumber >= eccReadyVersion ? CertStatus.success : CertStatus.error,
        };
      });
  } catch (e) {
    logger.error('Error while getting certificates', e);
    props.toggleEccWarningModal(false);
    await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_1000, 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  document.addEventListener('keydown', onKeyDown);

  await getCerts();
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown);
});

function openFachportalURL() {
  window.api.openExternal(ECC_MIGRATION_GUIDE);
}

// Close modal on escape key press
function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    props.toggleEccWarningModal(false);
  }
}

// Make methods and computed properties available to the template
defineExpose({
  escapeHTML,
  openFachportalURL,
  results,
});
</script>

<style scoped>
@import '../../../global.css';

#test-results-container {
  background: rgba(0, 0, 0, 0.4);
}

#scrollable-content {
  max-height: 400px;
  overflow-y: auto;
}
</style>
