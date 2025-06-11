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
    <div id="scrollable-content" class="relative my-6 mx-auto max-w-6xl p-6 min-w-2">
      <!--content-->
      <div class="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
        <!--header-->

        <div class="flex items-start p-5 justify-between border-b border-solid border-slate-200 rounded-md">
          <h3 class="text-2xl align-middle font-semibold">{{ $t('function_test_finished') }}</h3>
        </div>
        <!--body-->
        <div class="relative pb-2 pl-5 pr-5 flex-auto rounded-md w-full">
          <div v-for="title in uniqueTitles()" :key="title">
            <div class="flex justify-between pt-5 pb-2 pl-5 border-solid border-slate-200 rounded-md">
              <h3 class="text-m align-middle font-semibold">{{ title }}</h3>
            </div>

            <!-- Filter the test results based on the current title -->
            <div v-for="item in filteredTestResults(title)" :key="item.title" class="rounded w-full pb-4">
              <div
                class="container text-slate-500 p-2 text-lg leading-relaxed rounded-lg"
                :class="{
                  'bg-green-300': item.status === TestStatus.success,
                  'bg-orange-100': item.status === TestStatus.warning,
                  'bg-red-100': item.status === TestStatus.failure,
                }"
              >
                <div class="grid grid-cols-8 gap-4">
                  <div class="">
                    <img
                      v-if="item.status === 'success'"
                      src="@/assets/Success@2x.png"
                      class="object-none p-4"
                      alt="error icon"
                    />
                    <img v-else src="@/assets/Error@2x.png" class="object-none p-4" alt="error icon" />
                  </div>
                  <div class="col-span-7">
                    <div :id="item.name" class="font-bold pl-1 pr-1">{{ item.name }}</div>
                    <div class="text-base pl-1 pr-1 pb-1 break-words" v-html="escapeHTML(item.details, ['br'])"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!--footer-->
        <div class="flex justify-between p-6 border-t border-solid border-slate-200 rounded-b">
          <div class="flex justify-start">
            <button
              class="bg-blue-500 text-white active:bg-blue-600 font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
              @click="openFachportalURL()"
            >
              {{ $t('faq_info') }}
            </button>
          </div>
          <div class="flex justify-end">
            <button
              class="bg-blue-500 text-white active:bg-blue-600 font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
              @click="saveSettings"
            >
              {{ $t('save_changes') }}
            </button>
            <button
              class="bg-blue-500 text-white active:bg-blue-600 font-bold text-xs px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
              type="button"
              @click="closeFunctionTestModal"
            >
              {{ $t('close_dlg') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { FACHPORTAL_URL } from '@/constants';
import { escapeHTML } from '@/renderer/utils/utils';

export default defineComponent({
  name: 'TestResultModal',
  props: {
    functionTestResults: {
      type: Object as PropType<TestResult[]>,
      required: true,
    },
    closeFunctionTestModal: {
      type: Function,
      required: true,
    },
    saveSettings: {
      type: Function,
      required: true,
    },
  },
  computed: {
    TestStatus() {
      return TestStatus;
    },
  },
  mounted() {
    document.addEventListener('keydown', this.onKeyDown);
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.onKeyDown);
  },
  methods: {
    escapeHTML,
    openFachportalURL() {
      window.api.openExternal(FACHPORTAL_URL);
    },
    onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        this.closeFunctionTestModal();
      }
    },
    uniqueTitles() {
      return Array.from(new Set(this.functionTestResults.map((item) => item.title)));
    },
    filteredTestResults(title: string) {
      return this.functionTestResults.filter((item) => item.title === title);
    },
  },
});
</script>

<style scoped>
@import '../../../global.css';

#test-results-container {
  background: rgba(0, 0, 0, 0.4);
}

#scrollable-content {
  max-height: 600px;
  overflow-y: auto;
}
</style>
