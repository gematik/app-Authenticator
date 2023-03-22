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
  <div
    id="test-results-container"
    class="overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none justify-center items-center flex"
  >
    <div class="relative my-6 mx-auto max-w-6xl p-6 min-w-2">
      <!--content-->
      <div class="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
        <!--header-->

        <div class="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-md">
          <h3 class="text-2xl align-middle font-semibold">{{ $t('function_test_finished') }}</h3>
        </div>
        <!--body-->

        <div class="relative p-4 flex-auto rounded-md w-full">
          <div v-for="item in functionTestResults" :key="item" class="rounded w-full pb-4">
            <div
              class="container text-slate-500 p-2 text-lg leading-relaxed rounded-lg"
              :class="{ 'bg-green-300': item.status === 'success', 'bg-red-100': item.status === 'failure' }"
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
                  <div class="text-base pl-1 pr-1 pb-1 break-words">
                    {{ item.details }}
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
import { TestResult } from '@/renderer/modules/settings/services/test-runner';
import { Fachportal_URL } from '@/constants';

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
  },
  methods: {
    openFachportalURL() {
      window.api.openExternal(Fachportal_URL);
    },
  },
});
</script>

<style lang="scss" scoped>
#test-results-container {
  background: rgba(0, 0, 0, 0.4);
}
</style>
