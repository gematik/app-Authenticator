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

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { IFormInputColumnTypes } from '@/@types/common-types';

type TFileType = 'file' | 'file-path';

const model = defineModel<string | number>();

const inputElement = ref(null);

const props: any = withDefaults(
  defineProps<{
    label: string;
    placeholder?: string;
    type: IFormInputColumnTypes;
    maxlength?: number;
    max?: number;
    preValue?: string;
    allowedFiles?: string;
    allowNegativeNumbers?: boolean;
    disabled?: boolean;
    fileType?: TFileType;
    fileCallback?: (e: Event) => void;
  }>(),
  {
    placeholder: '',
    maxlength: 50,
    max: 999,
    preValue: '',
    allowNegativeNumbers: false,
    disabled: false,
    allowedFiles: 'application/x-pkcs12, .pem, .cert, .crt, .key',
    fileType: 'file-path',
    fileCallback: () => {},
  },
);

const emit = defineEmits(['update-validity']);

const isValidInput = ref(true);
const capsLock = ref(false);

document.addEventListener('keydown', function (event) {
  capsLock.value = event.getModifierState('CapsLock');
});

const idLabel = computed(() => {
  return props.label.trim().replace(/\s/g, '-').toLowerCase();
});

const min = computed(() => {
  return props.allowNegativeNumbers ? '' : 0;
});

const handleFileInput = (e: Event) => {
  const file = e.target.files && e.target.files[0];
  // for file-path type we only need absolute path of the file, not the content
  if (props.fileType === 'file-path' && file) {
    model.value = file?.path;
    props.fileCallback(e);
    return;
  }
  const reader = new FileReader();
  if (file) {
    reader.readAsText(file);
    reader.onload = () => {
      model.value = reader.result as string;
    };
    props.fileCallback(e);
    return;
  }
};

const handleInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement;

  if (props.type !== 'password') {
    target.value = target.value.trim();
  }

  // respect input length
  target.value = target.value.slice(0, props.maxlength);

  // Validate based on type
  const validateInput = (): boolean => {
    if (props.type === 'number') {
      const num = parseInt(target.value, 10);
      if (isNaN(num) || (num < 0 && !props.allowNegativeNumbers) || num > props.max || /[^0-9]/.test(target.value)) {
        target.value = '';
        return false;
      }
      return true;
    } else {
      return target.value.length > 0;
    }
  };

  // Helper function to set validity and border color
  const setValidity = (isValid: boolean) => {
    isValidInput.value = isValid;
    target.style.borderColor = isValid ? '#28a745' : '#dc3545';
  };
  const isValid = validateInput();
  setValidity(isValid);

  // we could restrict the value here, but we want to keep the user input
  model.value = target.value;
  // instead: emit a warning if the input is invalid
  emit('update-validity', { label: props.label, isValid });
};

const handleKeydown = (e: Event) => {
  if (props.type === 'number' && (e.key === '.' || e.key === ',')) {
    e.preventDefault();
  }
};

// only show the file name, not the full path
const fileName = computed(() => {
  if (model.value && props.type === 'file' && model.value !== '') {
    const fileName = model.value.toString();
    return fileName.split('\\').pop();
  }
  return '';
});

let modelWatcher: () => void;

onMounted(() => {
  if (props.type !== 'file') {
    const input = inputElement.value as HTMLInputElement;
    if (model?.value?.length === 0 && model) {
      // only use preValue if model is empty
      input.value = props.preValue;
    } else {
      if (model.value) input.value = model.value as string;
    }
  }

  // in some cases model value gets updated from outside, e.g. password for pf12 file
  modelWatcher = watch(model, (value) => {
    const input = inputElement.value as HTMLInputElement;
    if (props.type !== 'file') {
      input.value = value as string;
      handleInputChange({ target: inputElement.value });
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('keydown', function (event) {
    capsLock.value = event.getModifierState('CapsLock');
  });
  modelWatcher(); // remove model watcher
});
</script>

<template>
  <div :class="{ 'input-container': true, 'max-w-80': props.type !== 'file' && props.type !== 'password' }">
    <label :for="idLabel"
      >{{ label }}
      <span v-if="capsLock && props.type != 'file'" class="text-orange-500 text-xs warn flex flex-row gap-1 -mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path
            d="M7.27 1.047a1 1 0 0 1 1.46 0l6.345 6.77c.6.638.146 1.683-.73 1.683H11.5v1a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-1H1.654C.78 9.5.326 8.455.924 7.816zM4.5 13.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z"
          />
        </svg>
        ist an!
      </span>
    </label>
    <input
      v-if="props.type == 'text' || props.type == 'password' || props.type == 'number'"
      :id="idLabel"
      ref="inputElement"
      :type="type"
      :placeholder="placeholder"
      class="input-field"
      :min="min"
      :maxlength="maxlength"
      :max="max"
      :step="1"
      required
      :disabled="disabled"
      @change="handleInputChange"
      @keydown="handleKeydown"
    />
    <input
      v-if="props.type == 'file' && (model == '' || !model)"
      :id="idLabel"
      class="input-field-file"
      type="file"
      :disabled="disabled"
      :accept="allowedFiles"
      @change="handleFileInput"
    />
    <div v-if="props.type == 'file' && model != '' && model != undefined" class="flex flex-row flex-1">
      <input :value="fileName" class="input-field-file" disabled />
      <button class="text-red-500 font-bold pl-1 pr-2" @click="() => (model = '')">X</button>
    </div>
    <div v-if="!isValidInput" class="text-red-500 text-xs warn relative top-4 translate-x-5">
      {{ $t('please_check') }}
    </div>
  </div>
</template>

<style scoped>
.warn {
  position: absolute;
  right: -75px;
}

.input-container {
  position: relative;
  margin-top: 10px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 5px;
  max-height: 50px;
  height: 50px;
}

label {
  padding-left: 10px;
  padding-right: 5px;
  color: #636363;
  width: 50%;
}

.input-field {
  width: 50%;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  flex: 1;
  margin: 5px;
  transition: border-color 0.3s;
}

.input-field-file {
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin: 5px;
  flex: 1;
  align-self: flex-start;
  transition: border-color 0.3s;
}

.input-field:focus {
  border-color: #007bff;
  outline: none;
}

.max-w-80 {
  max-width: 80%;
}
</style>
