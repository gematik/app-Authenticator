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

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props: any = defineProps({
  modelValue: Boolean,
  label: String,
  disabled: Boolean,
});

const emit = defineEmits(['update:modelValue']);
const model = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newValue) => {
    model.value = newValue;
  },
);

const labelText = computed(() => {
  return props.disabled ? 'Deaktiviert' : model.value ? 'Aktiviert' : 'Deaktiviert';
});

// Handler für Änderungen des Toggle-Zustands
const handleToggleChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target) return;
  const checked = target.checked;
  model.value = checked;
  emit('update:modelValue', checked);
};
</script>

<template>
  <div :class="{ 'input-container': true }">
    <!-- Label für den Toggle -->
    <label>{{ labelText }}</label>

    <!-- Toggle-Element -->
    <div class="toggle-container">
      <input
        type="checkbox"
        class="toggle-input"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleToggleChange"
      />
      <span class="toggle-slider"></span>
    </div>
  </div>
</template>

<style scoped>
@import '../../../global.css';
.input-container {
  position: relative;
  margin-top: 25px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ccc;
  border-radius: 5px;
  max-height: 50px;
  height: 50px;
  max-width: 80%;
}

label {
  padding-left: 10px;
  padding-right: 5px;
  color: #636363;
  width: 50%;
}

.toggle-container {
  position: relative;
  margin: 10px;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 60px;
  height: 34px;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #3e4784;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-input:disabled + .toggle-slider {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.toggle-input:disabled + .toggle-slider:before {
  background-color: #f8f9fa;
}
</style>
