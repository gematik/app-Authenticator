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
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HomeScreen',
  props: {
    tooltipContent: {
      type: String,
      default: '',
    },
  },
});
</script>
<template>
  <div class="tooltip">
    <img alt="" src="@/assets/icon-label-tooltip.svg" />
    <span class="tooltiptext">{{ tooltipContent }}</span>
  </div>
</template>

<style scoped>
@import '../global.css';

.tooltip {
  position: relative;
  display: inline-block;
  vertical-align: -0.45rem;
  padding: 5px;
}

/* Tooltip text */
.tooltip .tooltiptext {
  visibility: hidden;
  width: 500px;
  background-color: #000e52;
  color: #fff;
  text-align: center;
  padding: 10px;
  border-radius: 6px;

  /* Position the tooltip text */
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  margin-left: -60px;

  /* Fade in tooltip */
  opacity: 0;
  transition: opacity 0.3s;
}

/* Tooltip arrow */
.tooltip .tooltiptext::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 12%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #000e52 transparent transparent transparent;
}

/* Show the tooltip text when you mouse over the tooltip container */
.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
}
</style>
