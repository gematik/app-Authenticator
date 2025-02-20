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
import { computed, onUnmounted, ref } from 'vue';
import i18n from '@/renderer/i18n';

const props = withDefaults(
  defineProps<{
    text?: string;
    imageSrc: string | string[];
    imageDescription?: string | string[];
  }>(),
  {
    text: i18n.global.t('config_assistant.help_screenshots_button'),
    imageDescription: '',
  },
);

const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'Escape':
      closeScreenshot();
      break;
    case 'ArrowLeft':
      onLeftArrowClick();
      break;
    case 'ArrowRight':
      onRightArrowClick();
      break;
  }
};

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const isScreenshotVisible = ref(false);
const currentImageIndex = ref(0);
const translate = i18n.global.t;

const closeScreenshot = () => {
  isScreenshotVisible.value = false;
  window.removeEventListener('keydown', handleKeydown);
};

const openScreenshot = () => {
  isScreenshotVisible.value = true;
  window.addEventListener('keydown', handleKeydown);
};

const currentImageSrc = computed(() => {
  if (Array.isArray(props.imageSrc)) {
    return props.imageSrc[currentImageIndex.value];
  }
  return props.imageSrc;
});

const currentImageDescription = computed(() => {
  if (Array.isArray(props.imageDescription)) {
    return props.imageDescription[currentImageIndex.value] || '';
  }
  return props.imageDescription;
});

const onLeftArrowClick = (e: Event | null = null) => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value -= 1;
  }
  e?.stopPropagation();
};

const onRightArrowClick = (e: Event | null = null) => {
  if (Array.isArray(props.imageSrc) && currentImageIndex.value < props.imageSrc.length - 1) {
    currentImageIndex.value += 1;
  }
  e?.stopPropagation();
};

const stepText = computed(() => {
  if (Array.isArray(props.imageSrc)) {
    return `(${translate('image')} ${currentImageIndex.value + 1} ${translate('config_assistant.of')} ${props.imageSrc.length})`;
  }
  return '';
});
</script>

<template>
  <div class="screenshot-helper">
    <div class="screenshot-helper__icon">
      <img src="@/assets/external-link-svgrepo-com.svg" alt="Open Screenshot Icon" @click="openScreenshot" />
    </div>
    <span class="screenshot-helper__link-text" @click="openScreenshot">{{ text }}</span>
  </div>
  <div class="screenshot-helper__overlay" :class="{ 'show-screenshot': isScreenshotVisible }" @click="closeScreenshot">
    <button class="screenshot-helper__close-button" @click="closeScreenshot">X</button>
    <img :src="require(`@/assets/assistant-screenshots/${currentImageSrc}`)" alt="Screenshot" />
    <div class="screenshot-helper__image-description">{{ currentImageDescription }} {{ stepText }}</div>
    <div v-if="Array.isArray(imageSrc)" class="screenshot-helper__nav_container">
      <div v-if="currentImageIndex == 0"></div>
      <div
        v-show="currentImageIndex > 0"
        class="screenshot-helper__nav_container__left"
        @click="(event) => onLeftArrowClick(event)"
      >
        &#129032;
      </div>

      <div
        v-show="currentImageIndex < imageSrc.length - 1"
        class="screenshot-helper__nav_container__right"
        @click="(event) => onRightArrowClick(event)"
      >
        &#129034;
      </div>
    </div>
  </div>
</template>

<style scoped>
.show-screenshot {
  display: flex !important;
}

.screenshot-helper {
  display: flex;
  align-items: center;
  font-family: Arial, sans-serif;
  color: #000e52;
  margin-top: 10px;
}

.screenshot-helper__overlay {
  display: none;
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: 99;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.8);
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.screenshot-helper__overlay img {
  max-width: 90%;
  max-height: 90%;
  box-shadow: 0 0 150px rgba(255, 255, 255, 0.44);
}

.screenshot-helper__icon {
  margin-right: 8px;
  cursor: pointer;
}

.screenshot-helper__icon img {
  width: 25px;
  height: 25px;
}

.screenshot-helper__link-text {
  font-size: 15px;
  text-decoration: underline;
  vertical-align: bottom;
  padding-top: 2px;
  cursor: pointer;
}

.screenshot-helper__close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 35px;
  height: 35px;
  background-color: transparent;
  border: 1px solid #ffffff;
  box-shadow: 0 0 1px 0 rgb(0, 0, 0);
  border-radius: 50%;
  color: #ffffff;
  font-size: 24px;
  text-shadow: 0 0 1px rgb(0, 0, 0);
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 99;
}

.screenshot-helper__close-button:hover,
.screenshot-helper__nav_container__right:hover {
  color: grey;
  background-image: linear-gradient(90deg, transparent, rgb(66, 66, 66));
}

.screenshot-helper__nav_container__left:hover {
  color: grey;
  background-image: linear-gradient(90deg, rgb(66, 66, 66), transparent);
}

.screenshot-helper__nav_container__left,
.screenshot-helper__nav_container__right {
  height: 100vh;
  width: 50px;
  text-align: center;
  padding-top: 50vh;
}

.screenshot-helper__image-description {
  margin: 10px;
  color: white;
  text-align: center;
  text-wrap: balance;
  font-size: 16px;
  user-select: none;
}

.screenshot-helper__nav_container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  color: rgba(255, 255, 255, 0.64);
  background-color: transparent;
  box-shadow: 0 0 1px 0 rgb(0, 0, 0);
  font-size: 33px;
  text-shadow: 0 0 1px rgb(0, 0, 0);
  position: fixed;
  user-select: none;
}
</style>
