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
    id="multi-card-select-container"
    class="overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none justify-center items-center flex"
  >
    <div class="relative my-6 mx-auto max-w-6xl p-6 min-w-2">
      <!--content-->
      <div>
        <!--body-->

        <div
          class="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none px-6"
        >
          <div class="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-md">
            <div>
              <h3 class="text-2xl align-middle font-semibold">
                {{ $t('multi_card_select_header', { cardType: selectedCardType }) }}
              </h3>
              <h3 class="text-xs align-middle font-semibold">
                {{ $t('multi_card_select', { cardType: selectedCardType }) }}
              </h3>
            </div>
          </div>
          <!--header-->

          <!--body-->
          <div class="relative p-4 flex-auto rounded-md w-full">
            <div class="w-full">
              <div v-for="(item, index) in multiCardList" :key="index">
                <button
                  :id="'MULTI-CARD-SELECT_' + index"
                  class="bg-blue-500 w-full text-white active:bg-blue-600 font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                  type="button"
                  @click="resolve(item)"
                >
                  {{ 1 + index }}. {{ item.CardType }} / Kartenhalter: {{ item.CardHolderName }} / ICCSN:
                  {{ item.Iccsn }}
                </button>
              </div>
            </div>

            <div>
              <button
                id="MULTI-CARD-CANCEL-SELECT"
                class="bt font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                @click="reject"
              >
                {{ $t('cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'MultiCardSelectModal',
  props: {
    selectedCardType: {
      type: String,
      required: true,
    },
    multiCardList: {
      type: Array as () => Array<any>,
      required: true,
    },
    resolve: {
      type: Function,
      required: true,
    },
    reject: {
      type: Function as any,
      required: true,
    },
  },
  data: function () {
    return {
      items: [],
    };
  },
  methods: {},
});
</script>

<style scoped>
@import '../../../global.css';

#multi-card-select-container {
  background: rgba(0, 0, 0, 0.4);
}
</style>
