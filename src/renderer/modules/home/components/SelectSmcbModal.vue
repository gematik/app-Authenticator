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
  <div
    id="select-smcb-container"
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
              <h3 class="text-2xl align-middle font-semibold">{{ $t('select_smcb_header') }}</h3>
              <h3 class="text-xs align-middle font-semibold">{{ $t('select_smcb') }}</h3>
            </div>
          </div>
          <!--header-->

          <!--body-->
          <div class="relative p-4 flex-auto rounded-md w-full">
            <div class="w-full">
              <div v-for="(item, index) in smcbList" :key="index">
                <button
                  :id="'SMCB-SELECT_' + index"
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
                id="SMCB-CANCEL-SELECT"
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
  name: 'SelectSmcbModal',
  props: {
    smcbList: {
      type: Array,
      required: true,
    },
    resolve: {
      type: Function,
      required: true,
    },
    reject: {
      type: Function,
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

<style lang="scss" scoped>
#select-smcb-container {
  background: rgba(0, 0, 0, 0.4);
}
</style>
