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
    v-if="hide !== true"
    class="form-element-container flex justify-between items-center px-[48px] py-[8px] bg-neutral inner-box-shadow"
  >
    <div class="text-sm" :for="`input-${name}`">
      <label :id="`form-${name}-label`" class="text-sm"> {{ label }} </label>
      <Tooltip :tooltip-content="infoText"></Tooltip>
    </div>
    <div>
      <div v-if="type === 'input' || type === 'password' || type === 'email' || type === 'number' || type === 'date'">
        <input
          :id="`form-${name}`"
          v-model="model[name]"
          :placeholder="placeholder"
          :disabled="disabled"
          :type="type"
          :required="required"
          :class="{
            'settings-input': true,
            'settings-input__changed': isChanged,
          }"
          @change="onLocalChange"
          @blur="onLocalChange"
        />
      </div>
      <div v-if="type === 'text'">
        <textarea
          :id="`form-${name}`"
          v-model="model[name]"
          :placeholder="placeholder"
          :disabled="disabled"
          :required="required"
          :class="{
            'settings-input': true,
            'settings-input__changed': isChanged,
          }"
          @change="onLocalChange"
          @blur="onLocalChange"
        />
      </div>
      <div v-else-if="type === 'drop-down'">
        <select
          :id="`form-${name}`"
          v-model="model[name]"
          :disabled="disabled"
          :required="required"
          :class="{
            'settings-input': true,
            'settings-input__changed': isChanged,
          }"
          @change="onLocalChange"
          @blur="onLocalChange"
        >
          <option v-for="(boolOpt, index) in getOptions()" :key="index" :value="boolOpt.value">
            {{ boolOpt.text }}
          </option>
        </select>
      </div>
      <div v-else-if="type === 'file' || type === 'file-path'">
        <label class="flex row justify-between settings-input w-[233px] leading-[100%] truncate overflow-hidden">
          <span
            v-for="file in iterable ? model[name] : [model[name]]"
            :key="file"
            class="w-[273px] overflow-hidden truncate rtl"
            :title="type === 'file-path' ? file : $t('file_selected')"
          >
            {{ type === 'file-path' ? file : $t('file_selected') }}
          </span>
          <img
            v-if="!model[name] || iterable"
            src="@/assets/file-upload.svg"
            alt="File-Upload Icon"
            class="object-none"
          />
          <input
            v-if="!model[name] || iterable"
            :id="`form-${name}`"
            :disabled="disabled"
            :required="required && !iterable"
            accept=".pem,.p12,.cer"
            title=""
            type="file"
            @change="onFileChange"
          />
          <button v-if="model[name]" type="button" @click="clearValue">
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </label>
      </div>
      <div v-if="!isValid" class="text-error text-[12px] px-[15px] pt-[5px]">{{ $t('value_is_not_valid') }}</div>
      <div v-if="isChanged" class="text-orange-500 text-[12px] px-[15px] pt-[5px]">
        {{ $t('setting_is_unsaved') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { IFormInputColumnTypes, IFormInputDropDownOptions, IFormInputDropDownOptionType } from '@/@types/common-types';
import Tooltip from '@/renderer/components/Tooltip.vue';

export default defineComponent({
  name: 'FormElement',
  components: { Tooltip },
  props: {
    model: {
      type: Object,
      required: true,
    },
    required: {
      type: Boolean,
      required: true,
    },
    iterable: {
      type: Boolean,
      required: false,
      default: false,
    },
    type: {
      type: String as PropType<IFormInputColumnTypes>,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    optionsType: {
      type: String as PropType<IFormInputDropDownOptionType>,
      required: false,
      default: () => '',
    },
    options: {
      type: Array as PropType<IFormInputDropDownOptions[]>,
      required: false,
      default: () => [],
    },
    placeholder: {
      type: String,
      required: false,
      default: '',
    },
    validationRegex: {
      type: RegExp,
      required: false,
      default: null,
    },
    validateInput: {
      type: Function,
      required: false,
      default: undefined,
    },
    sanitizeInput: {
      type: Function,
      required: false,
      default: undefined,
    },
    hide: {
      type: Boolean,
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    infoText: {
      type: String,
      required: false,
      default: '',
    },
    /**
     * Get fired for whole form any time an element changes
     */
    onFormChange: {
      type: Function,
      required: false,
      default: (): void => {},
    },
    /**
     * Get fired only for the element's listener
     */
    onElementChange: {
      type: Function,
      required: false,
      default: (): void => {},
    },
    accept: {
      type: String,
      required: false,
      default: '.pem',
    },
    /**
     * Event trigger for updating the internal init value
     * e.g. a save got performed successfully
     */
    updateInitValue: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      isValid: true,
      initValue: undefined as string | undefined,
    };
  },
  computed: {
    isChanged(): boolean {
      return this.initValue !== this.model[this.name];
    },
  },
  watch: {
    /* Update init value when this prop gets altered */
    updateInitValue() {
      this.initValue = this.model[this.name];
    },
  },
  mounted() {
    this.initValue = this.model[this.name];
    // We use this to check if the value is changed and notify the user
  },
  created() {
    this.validate();
    this.trimInput();
  },
  methods: {
    clearValue(): void {
      this.model[this.name] = '';
    },
    /**
     * after each change we call this method and this method fires prop onFormChange
     */
    onLocalChange(): void {
      this.validate();
      this.trimInput();
      this.onFormChange();
    },
    async onFileChange(e: Event): Promise<void> {
      const input = e.target as HTMLInputElement;
      const file = input.files && input.files[0];

      // for file-path type we only need absolute path of the file, not the content
      if (this.type === 'file-path' && file) {
        if (!this.iterable) {
          this.model[this.name] = window.api.showFilePath(file) || '';

          this.onElementChange(e);
          this.onFormChange();
          return;
        }

        if (!this.model[this.name].length) {
          this.model[this.name] = [];
        }
        this.model[this.name].push(window.api.showFilePath(file) || '');

        this.onElementChange(e);
        this.onFormChange();
        return;
      }

      const reader = new FileReader();
      if (file) {
        reader.readAsText(file);

        reader.onload = () => {
          this.model[this.name] = reader.result;
        };
      }

      this.onElementChange();
      this.onFormChange();
    },

    getOptions(): IFormInputDropDownOptions[] {
      if (this.options?.length) {
        return this.options;
      } else if (this.optionsType) {
        const optionTypes = {
          standardBool: [
            { text: this.$t('enabled'), value: true },
            { text: this.$t('disabled'), value: false },
          ],
        };

        return optionTypes[this.optionsType];
      }
      return [];
    },
    validate() {
      if (this.model[this.name] && this.validateInput) {
        this.isValid = this.validateInput(this.model[this.name]);
      } else if (this.model[this.name] && this.validationRegex && !this.validationRegex.test(this.model[this.name])) {
        this.isValid = false;
      } else {
        this.isValid = true;
      }
    },

    trimInput() {
      if (this.model[this.name] && this.sanitizeInput) {
        this.sanitizeInput(this.model[this.name]);
      }
    },
  },
});
</script>

<style scoped>
@import '../global.css';

.form-element-container:last-of-type {
  @apply rounded-bl-[8px];
  @apply rounded-br-[8px];
}

.inner-box-shadow {
  box-shadow:
    inset -1px 0 0 #e4e7ec,
    inset 1px 0 0 #e4e7ec,
    inset 0 -1px 0 #e4e7ec;
}

.settings-input {
  @apply h-[36px] rounded-[8px] px-[12px] py-[8px] bg-neutral border-inputBorder border;
  @apply w-[333px] leading-[100%];
  /* focus: focus: */
}

.settings-input__changed {
  @apply border-orange-500;
}

.settings-input:focus {
  @apply bg-inputBgFocus border-inputBorderFocus outline-none;
}

.rtl {
  direction: rtl;
}

input[type='file'] {
  opacity: 0;
  position: absolute;
}
</style>
