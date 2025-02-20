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

<template>
  <MultiCardSelectModal
    v-if="showMultiCardSelectModal"
    :selected-card-type="selectedCardType"
    :multi-card-list="multiCardList"
    :resolve="selectCardPromises.resolve"
    :reject="selectCardPromises.reject"
  />
</template>

<script lang="ts">
import Swal from 'sweetalert2';
import { defineComponent } from 'vue';
import MultiCardSelectModal from '@/renderer/modules/gem-idp/components/SelectMultiCardModal.vue';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { logger } from '@/renderer/service/logger';
import {
  alertDefinedErrorWithDataOptional,
  alertLoginResultWithIconAndTimer,
  alertWithCancelButton,
} from '@/renderer/utils/utils';
import { CONNECTOR_ERROR_CODES, ERROR_CODES } from '@/error-codes';

import { AUTH_RE_TRY_TIMEOUT, LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION } from '@/constants';
import { AuthFlowError, ConnectorError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE, TCard } from '@/renderer/modules/gem-idp/type-definitions';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { logStep } from '@/renderer/modules/gem-idp/utils';
import { getUserIdForCard } from '@/renderer/utils/get-userId-for-card';

let pendingCardActionModalClose: undefined | typeof Swal.close;

export default defineComponent({
  name: 'GetCardHandle',
  components: { MultiCardSelectModal },
  props: {
    handleErrors: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      cancelCardInsertModal: (_error: AuthFlowError) => {
        /* do nothing here */
      },
      multiCardList: [],
      showMultiCardSelectModal: false,
      selectedCardType: ECardTypes.HBA, // this is for multi card select modal
      selectCardPromises: {} as {
        resolve: (cardData: any) => void;
        reject: () => void;
      },
    };
  },
  methods: {
    /**
     * Gets card handle and also force user to place the card
     */
    async getCardHandle(cardType: ECardTypes): Promise<void> {
      logStep('Step: getCardHandle');
      try {
        /**
         * Get Card Handle
         * Throws ConnectorError 4047 if there is no placed cards, we wait until user places the card in that case
         */
        await this.$store.dispatch('connectorStore/getCardHandle', cardType);
        logger.debug('get CardHandle finished for:' + cardType + '-Card');

        // if there is a pending modal close function from the previous missing card action, we close it here
        if (typeof pendingCardActionModalClose === 'function') pendingCardActionModalClose();
      } catch (err) {
        if (err.code === ERROR_CODES.AUTHCL_1105) {
          return await this.handleMultiCard(err);
        } else if (err instanceof ConnectorError && err.code === CONNECTOR_ERROR_CODES.E4047) {
          return await this.handleMissingCardAction(cardType);
        }

        // handle the errors that predefined
        await this.handleErrors(err);

        // show alert for unknown read card handle error
        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1001);
        throw new AuthFlowError(
          `Error occurred while reading card information (${ERROR_CODES.AUTHCL_1001})`,
          err.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.SERVER_ERROR,
        );
      } finally {
        // This stays in the finally block, because after selecting the multiple card, which happens in the catch block,
        // we need to set the context parameters for the selected card
        if (cardType === ECardTypes.HBA && this.$store.state.connectorStore.cards?.HBA?.iccsn) {
          // Get userId for selected Card
          ConnectorConfig.setContextParameters({
            ...ConnectorConfig.contextParameters,
            userId: getUserIdForCard(this.$store.state.connectorStore.cards.HBA.iccsn),
          });
        }
      }
    },

    /**
     * in case of 1105, there are multiple SMC-Bs or HBAs in the connector,
     * so the user has to choose in a modal dialog which one he want´s to use
     * @param err
     */
    async handleMultiCard(err: any) {
      this.multiCardList = err.data.foundCards;
      this.selectedCardType = (this.multiCardList[0] as TCard)?.CardType;

      // if there is a swal modal, we need to close it before to show the multi-card-select modal
      if (typeof pendingCardActionModalClose === 'function') {
        pendingCardActionModalClose();
      }

      try {
        const selectedCard: any = await this.showMultiCardSelectDialogModal();
        this.showMultiCardSelectModal = false;

        const cardData = {
          cardHandle: selectedCard.CardHandle,
          ctId: selectedCard.CtId,
          slotNr: selectedCard.SlotId,
          cardType: selectedCard.CardType,
          iccsn: selectedCard.Iccsn,
        };

        if (selectedCard.CardType === ECardTypes.SMCB) {
          this.$store.commit('connectorStore/setSmcbCardData', cardData);
        } else {
          this.$store.commit('connectorStore/setHbaCardData', cardData);
        }
      } catch (err) {
        await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
        throw new AuthFlowError('User cancelled the card selection', '', '', true, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
      }
    },
    async handleMissingCardAction(cardType: ECardTypes) {
      if (!pendingCardActionModalClose) {
        alertWithCancelButton(ERROR_CODES.AUTHCL_2001, cardType).then(() => {
          // to be sure that this throws only for 4047
          if (!this.multiCardList.length) {
            this.onUserCancelledCardInsert();
          }
        });

        // to close the model after user inserts the card, we store this close function here
        pendingCardActionModalClose = Swal.close;
      }

      await this.sleep(AUTH_RE_TRY_TIMEOUT);

      return await this.getCardHandle(cardType);
    },
    async showMultiCardSelectDialogModal(): Promise<void> {
      logStep('Step: showMultiCardSelectDialogModal');
      this.showMultiCardSelectModal = true;
      window.api.focusToApp();

      return new Promise((resolve, reject) => {
        this.selectCardPromises = {
          resolve,

          reject: () => {
            logger.debug('reject Multi-Card-Select');
            this.showMultiCardSelectModal = false;
            reject();
          },
        };
      });
    },
    /**
     * User has clicked the cancel, we throw an error! This is reject function of sleep Promise
     */
    async onUserCancelledCardInsert() {
      logStep('Step: onUserCancelledCardInsert');
      await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
      this.cancelCardInsertModal(
        new AuthFlowError('User cancelled the card selection', '', '', true, OAUTH2_ERROR_TYPE.ACCESS_DENIED),
      );
    },
    /**
     * sleeps for x seconds
     * cancelCardInsertModal helps us to cancel timeout if user cancels the process
     * @param secs
     */
    sleep(secs: number) {
      logStep('Step: sleep');
      return new Promise<void>((resolve, reject) => {
        this.cancelCardInsertModal = reject;
        setTimeout(() => resolve(), secs);
      });
    },
  },
});
</script>

<style lang="scss" scoped>
#multi-card-select-container {
  background: rgba(0, 0, 0, 0.4);
}
</style>
