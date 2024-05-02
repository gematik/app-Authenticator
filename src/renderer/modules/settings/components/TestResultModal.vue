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
                    <div class="text-base pl-1 pr-1 pb-1 break-words">{{ item.details }}</div>
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
              @click="closeModal"
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

export default defineComponent({
  name: 'TestResultModal',
  props: {
    functionTestResults: {
      type: Object as PropType<TestResult[]>,
      required: true,
    },
    closeModal: {
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
    openFachportalURL() {
      window.api.openExternal(FACHPORTAL_URL);
    },
    onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        this.closeModal();
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

<style lang="scss" scoped>
#test-results-container {
  background: rgba(0, 0, 0, 0.4);
}

#scrollable-content {
  max-height: 600px;
  overflow-y: auto;
}
</style>
