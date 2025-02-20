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
<script lang="ts">
import { defineComponent } from 'vue';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { logStep } from '@/renderer/modules/gem-idp/utils';
import { AuthFlowError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import {
  alertDefinedErrorWithDataOptional,
  alertLoginResultWithIconAndTimer,
  alertWithCancelButton,
} from '@/renderer/utils/utils';
import { LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION } from '@/constants';
import Swal from 'sweetalert2';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { getConfig } from '@/renderer/utils/get-configs';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';

export default defineComponent({
  name: 'PinActions',
  data() {
    return {
      verifyPinPromise: undefined as any,
      /**
       * We store the sweetalert's close function in this variable.
       * This allows us to close the model automatically, after user inserts the card
       */
      pinVerifyModalClose: undefined as undefined | typeof Swal.close,
    };
  },
  props: {
    handleErrors: {
      type: Function,
      required: true,
    },
  },
  methods: {
    async checkPinStatus(cardType: ECardTypes): Promise<void> {
      logStep('Step: checkPinStatus');
      const smcbPinOption = !!getConfig(ENTRY_OPTIONS_CONFIG_GROUP.SMCB_PIN_OPTION).value;
      try {
        const isPinStatusVerified = await this.$store.dispatch('connectorStore/checkPinStatus', cardType);

        if (!isPinStatusVerified) {
          // customer should see the pin warning
          window.api.focusToApp();
          /**
           * If the card is SMC-B and pinStatus is not verified and the SMC-B Pin Option is deactivated, we show an alert dialog
           */
          if (cardType === ECardTypes.SMCB && !smcbPinOption) {
            await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1106);
            throw new AuthFlowError(
              `Entering the PIN for the SMC-B is not allowed Users can only enter their HBA Pin. To unlock the SMC-B
              they have to contact with their DVO or Admin. (${ERROR_CODES.AUTHCL_1106})`,
              '',
              '',
              true,
              OAUTH2_ERROR_TYPE.ACCESS_DENIED,
            );
          }
          /**
           * If the user clicks cancel, we will redirect the user to the client
           */
          const errorCode = cardType === ECardTypes.HBA ? ERROR_CODES.AUTHCL_2002 : ERROR_CODES.AUTHCL_2003;

          alertWithCancelButton(errorCode, cardType).then(async (swalRes) => {
            if (this.verifyPinPromise) {
              this.verifyPinPromise(new Error('User cancelled the PIN verification'));
            }

            // @ts-ignore cancel process and open client
            if (swalRes.dismiss === 'cancel') {
              await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
            }
          });

          this.pinVerifyModalClose = Swal.close;
        }
      } catch (err) {
        if (err instanceof AuthFlowError) {
          throw err;
        }

        await this.handleErrors(err);

        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1101);
        throw new AuthFlowError(
          `Check Pin Status failed! (${ERROR_CODES.AUTHCL_1101})`,
          err.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.ACCESS_DENIED,
        );
      }
    },
    /**
     * Verify the PIN on VERIFIABLE case
     * @param cardType
     */
    async verifyPin(cardType: string): Promise<void> {
      logStep('Step: verifyPin');
      try {
        // ask user for enter hba pin
        await new Promise((resolve, reject) => {
          this.verifyPinPromise = reject;
          this.$store
            .dispatch('connectorStore/verifyPin', cardType)
            .then((res) => {
              resolve(res);
            })
            .catch((err) => {
              reject(err);
            });
        });

        // it will be here only for HBA as we don't open modal for the SMC-B
        if (typeof this.pinVerifyModalClose === 'function') {
          this.pinVerifyModalClose();
        }
      } catch (err) {
        if (typeof this.pinVerifyModalClose === 'function') {
          this.pinVerifyModalClose();
        }

        await this.handleErrors(err);

        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1102);
        throw new AuthFlowError(
          `Verify PIN failed! (${ERROR_CODES.AUTHCL_1102})`,
          err.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.ACCESS_DENIED,
        );
      } finally {
        this.verifyPinPromise = undefined;
      }
    },
    resetVerifyPinClose() {
      this.pinVerifyModalClose = undefined;
    },
  },
});
</script>

<template>
  <div></div>
</template>

<style scoped></style>
