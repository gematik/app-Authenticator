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
<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({ name: 'HomeScreen', props: { tooltipContent: { type: String } } });
</script>
<template>
  <div class="tooltip">
    <img alt="" src="@/assets/icon-label-tooltip.svg" />
    <span class="tooltiptext">{{ tooltipContent }}</span>
  </div>
</template>

<style scoped>
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
  padding: 5px 0;
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
