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
  <div></div>
  <MultiCardSelectModal
    v-if="showMultiCardSelectModal"
    :selected-card-type="selectedCardType"
    :multi-card-list="multiCardList"
    :resolve="selectCardPromises.resolve"
    :reject="selectCardPromises.reject"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import queryString from 'qs';
import isEqual from 'lodash/isEqual';

import MultiCardSelectModal from '@/renderer/modules/home/components/SelectMultiCardModal.vue';
import {
  AUTH_RE_TRY_TIMEOUT,
  IPC_MINIMIZE_THE_AUTHENTICATOR,
  IPC_SET_USER_AGENT,
  IPC_START_AUTH_FLOW_EVENT,
  IS_DEV,
  LOGIN_CANCELLED_BY_USER,
  LOGIN_NOT_SUCCESSFUL,
  LOGIN_VIA_SMART_CARD_SUCCESSFUL,
  SHOW_DIALOG_DURATION,
  STORAGE_CONFIG_KEYS,
  WIKI_CONSENT_DECLARATION_URL,
  WIKI_ERRORCODES_URL,
} from '@/constants';
import { logger } from '@/renderer/service/logger';
import { ConnectorError, UserfacingError } from '@/renderer/errors/errors';
import {
  CONNECTOR_ERROR_CODES,
  ERROR_CODES,
  INTERNAL_FATAL_ERRORS,
  MAPPED_CONNECTOR_FATAL_ERRORS,
  USER_FACING_WARNINGS,
} from '@/error-codes';
import { CARD_TYPE_MULTI, ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { TAuthFlowEndState, TOidcProtocol2UrlSpec } from '@/@types/common-types';
import createJwe from '@/renderer/modules/gem-idp/sign-feature/create-jwe';
import {
  alertDefinedErrorWithDataOptional,
  alertLoginResultWithIconAndTimer,
  alertTechnicErrorWithIconOptional,
  alertWithCancelButton,
  closeSwal,
  createRedirectDeeplink,
  escapeHTML,
  userAgent,
} from '@/renderer/utils/utils';
import { validateDeeplinkProtocol, validateRedirectUriProtocol } from '@/renderer/utils/validate-redirect-uri-protocol';
import { filterCardTypeFromScope, validateLauncherArguments } from '@/renderer/utils/url-service';
import { OAUTH2_ERROR_TYPE, TAccessDataResponse, TCallback, TCard } from '@/renderer/modules/gem-idp/type-definitions';
import Swal from 'sweetalert2';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { getUserIdForCard } from '@/renderer/utils/get-userId-for-card';
import { removeLastPartOfChallengePath } from '@/renderer/utils/parse-idp-url';
import { httpsReqConfig } from '@/renderer/modules/gem-idp/services/get-idp-http-config';
import { CRYPT_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import { sendAutoRedirectRequest } from '@/renderer/modules/gem-idp/utils';

/**
 * We store the sweetalert's close function in this variable.
 * This allows us to close the model automatically, after user inserts the card
 */
let pendingCardActionModalClose: undefined | typeof Swal.close;
let pinVerifyModalClose: undefined | typeof Swal.close;

export default defineComponent({
  name: 'GemIdpAuthFlowProcess',
  components: {
    MultiCardSelectModal,
  },
  data() {
    return {
      rejectPendingCardActionTimeout: (_error: UserfacingError) => {
        /* do nothing here */
      },
      isAuthProcessActive: false,
      userSavedConsent: false,
      selectedCardType: ECardTypes.HBA, // this is for multi card select modal
      currentCardType: null as null | ECardTypes, // this is the current flow's card type
      multiCardList: [],
      attemptId: '',
      showMultiCardSelectModal: false,
      selectCardPromises: {} as {
        resolve: () => void;
        reject: () => void;
      },
      // awaiting auth flow requests
      authQueue: [] as {
        event: Event;
        args: TOidcProtocol2UrlSpec;
        loginAttemptId: string;
      }[],
    };
  },
  computed: {
    errorShown() {
      return this.$store.state.gemIdpServiceStore.errorShown;
    },
  },
  watch: {
    isAuthProcessActive(val) {
      this.$store.commit('setShowLoadingSpinner', val);
    },
  },
  created() {
    window.api.on(IPC_START_AUTH_FLOW_EVENT, this.createQueue);

    // listens for click to save-consent checkbox
    document.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).id === 'save-consent') {
        this.userSavedConsent = event.target instanceof HTMLInputElement && event.target.checked;
      }
    });
  },
  methods: {
    async createQueue(event: Event, args: TOidcProtocol2UrlSpec) {
      this.logStep('createQueue');
      const loginAttemptId = this.generateUniqueId();
      this.attemptId = loginAttemptId;

      if (this.isAuthProcessActive) {
        this.authQueue.push({ event, args, loginAttemptId });
        logger.info('Auth process is already active, adding to queue');
        return;
      } else {
        await this.startAuthenticationFlow(event, args);
      }
    },
    async showMultiCardSelectDialogModal(): Promise<void> {
      this.logStep('showMultiCardSelectDialogModal');
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

    async finishAndStartNextFlow(): Promise<void> {
      const hasCurrentFlowFailed = this.errorShown;
      this.logStep('finishAndStartNextFlow');

      this.userSavedConsent = false;

      // first clear the stores
      this.$store.commit('connectorStore/resetStore');
      this.$store.commit('gemIdpServiceStore/resetStore');

      // reset swal close functions
      pinVerifyModalClose = undefined;
      pendingCardActionModalClose = undefined;

      // clear class state
      this.isAuthProcessActive = false;

      // set the default ECC value for the next flow
      ConnectorConfig.setCardReaderParameter({
        crypt: CRYPT_TYPES.ECC,
      });

      // set the default ECC value for the next flow
      ConnectorConfig.setAuthSignParameter({
        signatureType: SIGNATURE_TYPES.ECC,
      });

      // start next flow if there is one and the current flow was successful
      if (!hasCurrentFlowFailed) {
        const nextFlow = this.authQueue.shift();
        if (nextFlow) {
          await this.startAuthenticationFlow(nextFlow.event, nextFlow.args);
        }
      } else {
        // find the current flow with the same ID and remove it from the queue
        const sameAttemptIdIndex = this.authQueue.findIndex((flow) => flow.loginAttemptId === this.attemptId);
        if (sameAttemptIdIndex > -1) {
          this.authQueue.splice(sameAttemptIdIndex, 1);
          logger.error('Flow with ID ' + this.attemptId + ' encountered an error and is removed from queue!');
        }

        // check for the next flow in the queue
        const nextFlow = this.authQueue.shift();
        if (nextFlow) {
          await this.startAuthenticationFlow(nextFlow.event, nextFlow.args);
        }
      }
    },
    async startAuthenticationFlow(_: Event, args: TOidcProtocol2UrlSpec): Promise<void> {
      logger.info('\n\n\n');
      logger.info('###############################################');
      logger.info('#### New Authentication Flow is started! ######');
      logger.info('###############################################');

      let error: UserfacingError | null = null;

      // go to home page
      await this.$router.push('/');

      this.isAuthProcessActive = true;

      // get callback param from challenge path and remove it from challenge path
      const callback = this.popParamFromChallengePath('callback', args.challenge_path);
      if (!this.setCallback(callback)) {
        !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0007));
        this.finishAndStartNextFlow();
        return;
      }

      // stop the process if parameters are not valid!
      if (!this.validateParamsAndSetState(args)) {
        this.finishAndStartNextFlow();
        return;
      }

      /**
       * todo this logic is deprecated, it has a fallback and will be removed in the future
       * instead send the cardType parameter in the challenge path
       */
      const filteredChallengePath = filterCardTypeFromScope(args.challenge_path as string);
      let cardType = filteredChallengePath.card_type;

      /**
       * pop the cardType from the challenge path
       */
      const cardTypeFromCPath = this.popParamFromChallengePath('cardType', filteredChallengePath.challenge_path);

      if (cardTypeFromCPath) {
        // if cardType is MULTI, that means we have to process the auth flow for both card types
        if (CARD_TYPE_MULTI === cardTypeFromCPath.toLowerCase()) {
          // start with HBA, and the  SMCB will be processed after the HBA
          cardType = ECardTypes.HBA;

          // replace the cardType parameter with SMCB and add it to the queue
          this.createQueue(new Event(''), {
            ...args,
            challenge_path: filteredChallengePath.challenge_path.replace(
              'cardType=' + cardTypeFromCPath,
              'cardType=' + ECardTypes.SMCB,
            ),
          });
        }

        // if cardType exists and suits with ECardTypes, we use it
        else if (Object.values(ECardTypes).includes(cardTypeFromCPath as ECardTypes)) {
          // set the card type from challenge_path
          cardType = cardTypeFromCPath as ECardTypes;
          logger.info('CardType information extracted from challenge_path parameter cardType: ' + cardType);
        } else {
          // parameter isn't compatible with ECardTypes, we take the HBA as default
          logger.error('Wrong card type provided! We take the HBA as the default value.');
        }
      }

      // save card type to component state
      this.currentCardType = cardType;

      // get idp host from challenge_path
      this.parseAndSetIdpHost();

      try {
        /**
         * This is the first connection to IdP, means; if there is a connection problem to IdP, it will occur here.
         */
        await this.$store.dispatch('gemIdpServiceStore/getDiscoveryDocument');

        /**
         * Read EncJwk from IdP
         */
        await this.$store.dispatch('gemIdpServiceStore/getIdpEncJwk');
        logger.debug(
          'publicKey received: ',
          JSON.parse(JSON.stringify(this.$store.state.gemIdpServiceStore.idpEncJwk)),
        );
      } catch (e) {
        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0002);
        this.setCaughtError(ERROR_CODES.AUTHCL_0002, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
        return this.openClientIfNeeded({ isSuccess: false, url: '' });
      }

      /**
       * Get challenge data from idp.
       */
      const isChallengeDataFetched = await this.getChallengeDataFromIdp();

      /**
       * In this error case,we have already warned the user about the problem in the getChallengeDataFromIdp function
       * and opened the client if we received an url.
       */
      if (!isChallengeDataFetched) {
        return;
      }

      logger.debug('challenge code received: ' + this.$store.state.gemIdpServiceStore.challenge);
      const jwtChallenge = jsonwebtoken.decode(this.$store.state.gemIdpServiceStore.challenge);
      logger.debug('parsed challenge: ', jwtChallenge);

      try {
        // find card terminals
        await this.getCardTerminals();
        await this.getCardData(cardType);

        // there is a case that user does not enter the pin and instead cancel the auth process in the app,
        // in that case we stop the process and open the browser with a fail message
        // after PIN Verify timeouts, a process keeps on, and we stop it here!
        if (!this.isAuthProcessActive) {
          return;
        }
      } catch (err) {
        this.showMultiCardSelectModal = false;
        error = err;
        // handling happens in the getTokenAndOpenClient
      }

      // there is a case that user does not enter the pin and instead cancel the auth process in the app,
      // in that case we stop the process and open the browser with fail message
      // after PIN Verify timeouts, process keeps on, and we stop it here!
      if (!this.isAuthProcessActive) {
        return;
      }

      // even if we have errors we call getRedirectUriWithToken and get fail url and open the client
      const authFlowEndState = await this.getRedirectUriWithToken(error);
      await this.openClientIfNeeded(authFlowEndState);

      this.isAuthProcessActive = false;
      await this.finishAndStartNextFlow();
    },
    async getCardData(cardType: ECardTypes): Promise<void> {
      this.logStep('getCardData');

      // Init Card and get CardHandle
      await this.getCardHandle(cardType);

      await this.showConsentDeclaration();

      await this.checkPinStatus(cardType);

      await this.verifyPin(cardType);

      // VerifyPIN timeout after user clicked cancel in the authenticator app
      // we stop the process here!
      if (!this.isAuthProcessActive) {
        return;
      }

      // get certificate
      await this.getCardCertificate(cardType); // muss status verified

      // signature for cardType
      await this.signChallengeForCardType(cardType);

      const signatures = {
        [ECardTypes.SMCB]: this.$store.state.gemIdpServiceStore.jwsSmcbSignature,
        [ECardTypes.HBA]: this.$store.state.gemIdpServiceStore.jwsHbaSignature,
      };
      const signature = signatures[cardType];
      const idpEncJwk = this.$store.state.gemIdpServiceStore.idpEncJwk;

      if (!signature || !idpEncJwk) {
        return;
      }

      const token = jsonwebtoken.decode(this.$store.state.gemIdpServiceStore.challenge);
      const jwe = await createJwe(signature, idpEncJwk, (token as JwtPayload).exp as number); // non-null assert
      this.$store.commit('gemIdpServiceStore/setJweChallenge', jwe);
    },

    /**
     * Get Card Terminals
     * Throws only for connector connection errors
     */
    async getCardTerminals(): Promise<void> {
      this.logStep('getCardTerminals');
      try {
        await this.$store.dispatch('connectorStore/getCardTerminals');
        logger.info('getTerminals finished');
      } catch (err) {
        await this.handleErrors(err);

        !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1003));
        this.setCaughtError(ERROR_CODES.AUTHCL_1003, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      }
    },
    /**
     * Try to handle errors with defined error codes. In other case,
     * the function which call this function will handle the error by itself
     * @param e
     */
    async handleErrors(e: ConnectorError | UserfacingError | Error): Promise<void> {
      this.logStep('handleErrors');
      // focus to app to show the error
      window.api.focusToApp();

      if (
        e instanceof ConnectorError &&
        MAPPED_CONNECTOR_FATAL_ERRORS[e.code] &&
        USER_FACING_WARNINGS.includes(MAPPED_CONNECTOR_FATAL_ERRORS[e.code] || '')
      ) {
        const mappedConError = MAPPED_CONNECTOR_FATAL_ERRORS[e.code];
        !this.errorShown && (await alertDefinedErrorWithDataOptional(MAPPED_CONNECTOR_FATAL_ERRORS[e.code], e.data));
        throw new UserfacingError(e.message, e.description || '', mappedConError);
      } else if (e instanceof ConnectorError && MAPPED_CONNECTOR_FATAL_ERRORS[e.code]) {
        const mappedConError = MAPPED_CONNECTOR_FATAL_ERRORS[e.code];
        !this.errorShown && (await alertTechnicErrorWithIconOptional(mappedConError));
        throw new UserfacingError(e.message, e.description || '', mappedConError);
      } else if (e instanceof UserfacingError && e.code && INTERNAL_FATAL_ERRORS.includes(e.code)) {
        !this.errorShown && (await alertTechnicErrorWithIconOptional(e.code));
        throw e;
      } else if (e instanceof UserfacingError && USER_FACING_WARNINGS.includes(e.code || '')) {
        !this.errorShown && (await alertDefinedErrorWithDataOptional(e.code, e.data));
        throw e;
      }
    },
    async signChallengeForCardType(cardType: ECardTypes): Promise<void> {
      this.logStep('signChallengeForCardType');
      try {
        const certificate = this.$store.state.connectorStore?.cards[cardType]?.certificate;
        const challenge = this.$store.state.gemIdpServiceStore?.challenge;

        // type guarding
        if (!certificate) {
          return;
        }

        // get and save signed challenge
        const data = { cardType, challenge, certificate };
        const jwsSignature = await this.$store.dispatch('connectorStore/getSignedAuthChallenge', data);

        if (cardType === ECardTypes.HBA) {
          this.$store.commit('gemIdpServiceStore/setHbaJwsSignature', jwsSignature);
        } else {
          this.$store.commit('gemIdpServiceStore/setSmcbJwsSignature', jwsSignature);
        }
      } catch (err) {
        await this.handleErrors(err);

        !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1108));
        this.setCaughtError(ERROR_CODES.AUTHCL_1108, err.message, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      }
    },
    async getCardCertificate(cardType: ECardTypes): Promise<void> {
      this.logStep('getCardCertificate');
      try {
        await this.$store.dispatch('connectorStore/getCardCertificate', cardType);
      } catch (e) {
        try {
          // as ECC throws an error, we try to get the RSA certificate
          ConnectorConfig.setCardReaderParameter({
            crypt: CRYPT_TYPES.RSA,
          });

          ConnectorConfig.setAuthSignParameter({
            signatureType: SIGNATURE_TYPES.RSA,
          });

          await this.$store.dispatch('connectorStore/getCardCertificate', cardType);
          logger.info('getCardCertificate finished');
        } catch (err) {
          await this.handleErrors(err);

          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1107));
          this.setCaughtError(ERROR_CODES.AUTHCL_1107, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
        }
      }
    },
    /**
     * Gets card handle and also force user to place the card
     *
     * @param cardType
     */
    async getCardHandle(cardType: ECardTypes): Promise<void> {
      this.logStep('getCardHandle');
      try {
        /**
         * Get Card Handle
         * Throws ConnectorError 4047 if there is no placed cards, we wait until user places the card in that case
         */
        await this.$store.dispatch('connectorStore/getCardHandle', cardType);
        logger.debug('get CardHandle finished for:' + cardType + '-Card');

        // getCardHandle function is a recurring function! In an error case, we open a warning modal and give to the user
        // a second chance to enter the pin. This warning models close function is stored in the
        // pendingCardActionModalClose variable, in line of code, user has entered the pin and, we can close the modal
        // if it is still there!
        if (typeof pendingCardActionModalClose === 'function') {
          pendingCardActionModalClose();
        }
      } catch (err) {
        // in case of 1105, there are multiple SMC-Bs or HBAs in the connector, so the user has to choose in a modal dialog which one he want´s to use
        if (err.code === ERROR_CODES.AUTHCL_1105) {
          this.multiCardList = err.data.foundCards;
          this.selectedCardType = (this.multiCardList[0] as TCard)?.CardType;
          if (typeof pendingCardActionModalClose === 'function') {
            pendingCardActionModalClose();
          }

          try {
            const selectedCard: any = await this.showMultiCardSelectDialogModal();
            logger.debug('Selected Card:');
            logger.debug('- CardHandle:' + selectedCard.CardHandle);
            logger.debug('- Iccsn:' + selectedCard.Iccsn);
            logger.debug('- CardType:' + selectedCard.CardType);
            logger.debug('- SlotId:' + selectedCard.SlotId);
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

            return;
          } catch (err) {
            throw new UserfacingError(this.$t(LOGIN_CANCELLED_BY_USER), '', ERROR_CODES.AUTHCL_0006);
          }
        } else {
          await this.handleErrors(err);
        }

        /**
         * Connector Error code 4047 means card is not placed!
         * We give a second chance to place the card here
         * 4047 won't be handled in the handleErrors function
         */
        if (err instanceof ConnectorError && err.code === CONNECTOR_ERROR_CODES.E4047) {
          alertWithCancelButton(ERROR_CODES.AUTHCL_2001, 0, cardType)
            .then(() => {
              // to be sure that this throws only for 4047
              if (!this.multiCardList.length) {
                this.onUserCancelledCardInsert();
              }
            })
            .catch(() => {
              // do nothing here
            });

          // to close the model after user inserts the card, we store this close function here
          pendingCardActionModalClose = closeSwal();

          // if user clicks the cancel on the modal, we call the rejectPendingCardActionTimeout() function
          // this throws an error right here and user redirects to client
          await this.cardInsertReTryTimeout(AUTH_RE_TRY_TIMEOUT);

          return this.getCardHandle(cardType);
        }

        !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1001));
        this.setCaughtError(ERROR_CODES.AUTHCL_1001, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
        throw err;
      } finally {
        if (cardType === ECardTypes.HBA && this.$store.state.connectorStore.cards?.HBA?.iccsn) {
          // Get userId for selected Card
          ConnectorConfig.setContextParameters({
            ...ConnectorConfig.contextParameters,
            userId: getUserIdForCard(this.$store.state.connectorStore.cards.HBA.iccsn),
          });
        }
      }
    },

    onUserCancelledCardInsert() {
      this.logStep('onUserCancelledCardInsert');
      // user has clicked the cancel, we throw an error! This is reject function of cardInsertReTryTimeout Promise
      this.rejectPendingCardActionTimeout(
        new UserfacingError(this.$t(LOGIN_CANCELLED_BY_USER), '', ERROR_CODES.AUTHCL_0006),
      );
    },
    /**
     * Checks PIN Status. On blocked and rejected cases throws error
     * @param cardType
     */
    async checkPinStatus(cardType: ECardTypes): Promise<void> {
      this.logStep('checkPinStatus');
      try {
        const isPinStatusVerified = await this.$store.dispatch('connectorStore/checkPinStatus', cardType);

        if (!isPinStatusVerified) {
          // customer should see the pin warning
          window.api.focusToApp();
          /**
           * If the card is SMC-B and pinStatus is not verified, we show an alert dialog
           */
          if (cardType === ECardTypes.SMCB) {
            throw new UserfacingError(
              'Entering the PIN for the SMC-B is not allowed Users can only enter their HBA Pin.',
              ' To unlock the SMC-B they have to contact with their DVO or Admin.',
              ERROR_CODES.AUTHCL_1106,
            );
          }
          /**
           * If the user clicks cancel the value will be -1
           */
          alertWithCancelButton(ERROR_CODES.AUTHCL_2002, -1, cardType)
            .then(async (promptRes) => {
              const connectorState = this.$store.state.connectorStore;
              const cardData = connectorState.cards[cardType];

              if (!cardData) {
                return;
              }

              const pinStatus = cardData.pinStatus;

              // cancel process and open client
              if (pinStatus != 'VERIFIED') {
                this.isAuthProcessActive = false;

                const authFlowEndState = await this.getRedirectUriWithToken(
                  promptRes.value == -1
                    ? new UserfacingError(this.$t(LOGIN_CANCELLED_BY_USER), '', ERROR_CODES.AUTHCL_0006)
                    : null,
                );
                await this.openClientIfNeeded(authFlowEndState);
              }
            })
            .catch(() => {
              // do nothing here
            });
          pinVerifyModalClose = closeSwal();
        }
      } catch (err) {
        await this.handleErrors(err);
        if (cardType === ECardTypes.SMCB) {
          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1106));
          this.setCaughtError(ERROR_CODES.AUTHCL_1106, err.message, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
          throw new UserfacingError('SMC-B PinStatus is not verified', err.message, ERROR_CODES.AUTHCL_1106);
        } else {
          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1101));
          this.setCaughtError(ERROR_CODES.AUTHCL_1101, err.message, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
        }
      }
    },

    /**
     * Verify the PIN on VERIFIABLE case
     * @param cardType
     */
    async verifyPin(cardType: string): Promise<void> {
      this.logStep('verifyPin');
      try {
        // ask user for enter hba pin
        await this.$store.dispatch('connectorStore/verifyPin', cardType);

        // it will be here only for HBA as we don't open modal for the SMC-B
        if (typeof pinVerifyModalClose === 'function') {
          pinVerifyModalClose();
        }
      } catch (err) {
        await this.handleErrors(err);

        !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1102));
        this.setCaughtError(ERROR_CODES.AUTHCL_1102, undefined, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
        this.isAuthProcessActive = false;
        if (typeof pinVerifyModalClose === 'function') {
          pinVerifyModalClose();
        }
        throw new UserfacingError('VerifyPIN failed!', err.message, ERROR_CODES.AUTHCL_1102);
      }
    },
    async getChallengeDataFromIdp(): Promise<boolean> {
      this.logStep('getChallengeDataFromIdp');
      try {
        return await this.$store.dispatch('gemIdpServiceStore/getChallengeData');
      } catch (err) {
        // customer should see the idp errors
        window.api.focusToApp();

        if (err instanceof UserfacingError && err.code === ERROR_CODES.AUTHCL_0005) {
          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0005));
          this.setCaughtError(ERROR_CODES.AUTHCL_0005, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
        } else {
          // IdP error occurred, warn the user
          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0002));
          this.setCaughtError(
            ERROR_CODES.AUTHCL_0002,
            err?.data?.gamatikErrorText ?? undefined,
            err?.data?.oauth2ErrorType ?? OAUTH2_ERROR_TYPE.SERVER_ERROR,
          );
        }

        await this.openClientIfNeeded({ url: err?.data?.url, isSuccess: false });
        return false;
      }
    },
    /**
     * @returns URL
     */
    async getRedirectUriWithToken(error: UserfacingError | null = null): Promise<TAuthFlowEndState> {
      this.logStep('getRedirectUriWithToken');
      /**
       * send signed challenge to idp
       * this never throws error!
       */
      const accessData: TAccessDataResponse = await this.$store.dispatch('gemIdpServiceStore/getRedirectUriWithToken');

      if (error && error.code == ERROR_CODES.AUTHCL_0006) {
        !this.errorShown &&
          (await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION));
        this.setCaughtError(ERROR_CODES.AUTHCL_0006, undefined, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
      } else if (error) {
        !this.errorShown &&
          (await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION));
        this.setCaughtError('Unknown Error');
      }

      //TODO is it possible to have a accessData.errorUri and a accessData.redirectUri????
      if (accessData.errorUri) {
        !this.errorShown &&
          (await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION));
        this.setCaughtError('Unknown Error');

        return { isSuccess: false, url: accessData.errorUri };
      }

      if (accessData.redirectUri) {
        return { isSuccess: true, url: accessData.redirectUri };
      }

      !this.errorShown && (await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION));

      this.setCaughtError(
        accessData.idpError?.gematikCode ?? 'Unknown Error',
        accessData.idpError?.gamatikErrorText,
        accessData.idpError?.oauth2ErrorType,
      );

      return { isSuccess: false, url: '' };
    },

    validateParamsAndSetState(args: TOidcProtocol2UrlSpec): boolean {
      this.logStep('validateParamsAndSetState');
      try {
        validateLauncherArguments(args);
        const authReqParameters: TOidcProtocol2UrlSpec = {
          challenge_path: filterCardTypeFromScope(args.challenge_path as string).challenge_path,
        };

        if (!authReqParameters.challenge_path) {
          throw new Error('Missing challenge_path parameter!');
        }

        const url = new URL(authReqParameters.challenge_path);
        const clientId = url.searchParams.get('client_id');
        this.$store.commit('gemIdpServiceStore/setClientId', clientId);
        this.$store.commit('gemIdpServiceStore/setChallengePath', authReqParameters.challenge_path);

        return true;
      } catch (e) {
        // focus to app to show the error
        window.api.focusToApp();

        !this.errorShown && alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0001);
        this.setCaughtError(
          ERROR_CODES.AUTHCL_0001,
          'Invalid launcher parameters received.',
          OAUTH2_ERROR_TYPE.INVALID_REQUEST,
        );
        return false;
      }
    },
    setCaughtError(errorCode: string, errorDescription?: string, errorType?: OAUTH2_ERROR_TYPE) {
      this.logStep('setCaughtError');
      this.$store.commit('gemIdpServiceStore/setErrorShown');

      if (!this.$store.state.gemIdpServiceStore.caughtAuthFlowError) {
        this.$store.commit('gemIdpServiceStore/setCaughtAuthFlowError', {
          errorCode: errorCode,
          errorDescription: errorDescription,
          oauthErrorType: errorType,
        });
      }
    },
    /**
     * sleeps for x seconds
     * rejectPendingCardActionTimeout helps us to cancel timeout if user cancels the process
     * @param secs
     */
    cardInsertReTryTimeout(secs: number) {
      this.logStep('cardInsertReTryTimeout');
      return new Promise<void>((resolve, reject) => {
        this.rejectPendingCardActionTimeout = reject;
        setTimeout(() => resolve(), secs);
      });
    },

    /**
     * open client with received url
     * OR parse the challenge_path and open the redirect url with custom error
     * @param authFlowEndState
     */
    async openClientIfNeeded(authFlowEndState: TAuthFlowEndState): Promise<void> {
      this.logStep('openClientIfNeeded');

      let url: string | null = authFlowEndState.url;
      const caughtErrorObject = this.$store.state.gemIdpServiceStore.caughtAuthFlowError;

      // if there is no url, we parse the challengePath and get the redirect url
      const challengePath = this.$store.state.gemIdpServiceStore.challengePath;
      let state = '';
      if (!authFlowEndState.isSuccess && !url && challengePath) {
        const parsedHost = new URL(challengePath);

        if (parsedHost.searchParams.get('redirect_uri')) {
          url = parsedHost.searchParams.get('redirect_uri');
        }
        if (parsedHost.searchParams.get('state')) {
          state = '&state=' + parsedHost.searchParams.get('state');
        }
      }

      if (url) {
        if (!validateRedirectUriProtocol(url)) {
          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0007));
          await this.finishAndStartNextFlow();
          return;
        }

        if (authFlowEndState.isSuccess) {
          await alertLoginResultWithIconAndTimer('success', LOGIN_VIA_SMART_CARD_SUCCESSFUL, SHOW_DIALOG_DURATION);

          // #!if MOCK_MODE === 'ENABLED'
          if (!IS_DEV) {
            window.api.send(IPC_MINIMIZE_THE_AUTHENTICATOR);
          }
          // #!endif
        } else if (!url.includes('error=') && caughtErrorObject) {
          const definedError = caughtErrorObject.oauthErrorType || OAUTH2_ERROR_TYPE.SERVER_ERROR;
          url = `${url}?error=${definedError}&error_details=${caughtErrorObject.errorDescription}${state}`;
        }
        if (!authFlowEndState.isSuccess && !url.includes('error_uri')) {
          url = `${url}&error_uri=` + WIKI_ERRORCODES_URL;
        }

        // add cardType to url in any case
        url = `${url}&cardType=${this.currentCardType}`;

        url = encodeURI(url);
        switch (this.$store.state.gemIdpServiceStore.callback) {
          case TCallback.OPEN_TAB:
            // open browser
            window.api.openExternal(url);
            break;
          case TCallback.DIRECT:
            // calls callback url of resource server to complete request
            logger.debug('Try to send: ' + url);
            this.sendAutomaticRedirectRequest(url);

            break;
          case TCallback.DEEPLINK:
            // eslint-disable-next-line no-case-declarations
            const localDeepLink = createRedirectDeeplink(this.$store.state.gemIdpServiceStore.deeplink, url);
            logger.info(`open local deeplink:${localDeepLink}`);
            window.api.openExternal(localDeepLink);
            break;
        }
      }

      // reset the store in any case
      await this.finishAndStartNextFlow();
    },
    /**
     * To gets the .well-known information from the IdP, we need to parse the challengePath
     * and get the host name of it
     */
    parseAndSetIdpHost() {
      this.logStep('parseAndSetIdpHost');
      const challengePath = this.$store.state.gemIdpServiceStore.challengePath;
      const parseAndSetIdpHost = removeLastPartOfChallengePath(challengePath);
      this.$store.commit('gemIdpServiceStore/setIdpHost', parseAndSetIdpHost);
    },
    /**
     * Returns a parameter from challenge path and removes the parameter from challenge path
     * @param challengePath
     * @param paramName
     */
    popParamFromChallengePath(paramName: string, challengePath?: string): string | null {
      this.logStep('popParamFromChallengePath');
      if (challengePath && challengePath.includes(paramName)) {
        const parsedPath = queryString.parse(challengePath);
        const value = parsedPath[paramName];

        // update challenge path
        const cleanChallengePath = challengePath.replace('&' + paramName + '=' + value, '');

        this.$store.commit('gemIdpServiceStore/setChallengePath', cleanChallengePath);

        return typeof value === 'string' ? value : null;
      }

      return '';
    },
    setCallback(callbackValue: string | null): boolean {
      this.logStep('setCallback');
      this.$store.commit('gemIdpServiceStore/setCallback', TCallback.OPEN_TAB);

      if (callbackValue) {
        if (callbackValue.toUpperCase() == TCallback.DIRECT) {
          this.$store.commit('gemIdpServiceStore/setCallback', TCallback.DIRECT);
        } else if (validateDeeplinkProtocol(callbackValue)) {
          this.$store.commit('gemIdpServiceStore/setCallback', TCallback.DEEPLINK);
          this.$store.commit('gemIdpServiceStore/setDeeplink', callbackValue);
        } else {
          return false;
        }
      }

      return true;
    },
    /**
     * Sends the request in Browser Context to use TrustStore,
     * if this doesn't work, tries the same thing in preload context to use own certificates
     * @param url
     */
    async sendAutomaticRedirectRequest(url: string) {
      this.logStep('sendAutomaticRedirectRequest');
      const successMessage = 'Redirecting automatically flow completed';
      try {
        // send the user agent with the clientId to the main process
        const customUserAgent = userAgent + this.$store.state.gemIdpServiceStore.clientId;
        window.api.sendSync(IPC_SET_USER_AGENT, customUserAgent);

        await sendAutoRedirectRequest(url);

        logger.info(successMessage + ' from browser context');
      } catch (e) {
        logger.debug(
          `Auto redirect failed with status code ${e?.response?.status} and message '${e.message}'`,
          e?.response?.data,
        );

        logger.warn(
          'Redirecting automatically request failed from Browser Context. Retry in Preload Context. Error: ' +
            e.message,
        );

        try {
          await window.api.httpGet(url, {
            ...{
              ...httpsReqConfig(),
              headers: {
                'User-Agent': userAgent + this.$store.state.gemIdpServiceStore.clientId,
              },
            },
          });
          logger.info(successMessage + ' from preload context');
        } catch (err) {
          logger.error('Redirecting automatically request failed! Error message: ', err?.message);
          logger.debug('Own http-client auto redirect failed e.response: ', err?.response);

          !this.errorShown && (await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0009));
        }
      }
    },
    logStep(log: string) {
      logger.info('\n### Step: ' + log + ' ###');
    },
    async showConsentDeclaration(): Promise<boolean> {
      const cardIccsn = this.$store.state.connectorStore.cards[this.currentCardType!]!.iccsn;
      const clientId = this.$store.state.gemIdpServiceStore.clientId;
      const userConsent = this.$store.state.gemIdpServiceStore.userConsent;

      type TSavedConsents = Record<string, Record<string, string>>;
      const consentPair = clientId + '-' + cardIccsn;

      // if user has already consented for this pair, we skip the consent declaration
      const savedPairs = localStorage.getItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS);
      const savedPairsArray: TSavedConsents = savedPairs ? JSON.parse(savedPairs) : {};

      // if user has already consented for this pair and consents are identical, we skip the consent declaration
      if (savedPairsArray[consentPair] && isEqual(savedPairsArray[consentPair], userConsent?.requested_claims)) {
        return true;
      }

      // bring the app to the front
      window.api.focusToApp();

      const consent = await Swal.fire({
        title: this.$t('privacy_notice'),
        html: this.renderConsentItemList(this.$t('consent_claims_title'), userConsent!.requested_claims),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: this.$t('accept_consent'),
        cancelButtonText: this.$t('decline_consent'),
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        width: '60%',
      });

      // user clicked cancel, stop the auth process
      if (!consent.isConfirmed) {
        await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
        this.setCaughtError(ERROR_CODES.AUTHCL_0011, 'User declined consent', OAUTH2_ERROR_TYPE.ACCESS_DENIED);
        throw new UserfacingError(ERROR_CODES.AUTHCL_0011 + ' User declined consent', '', ERROR_CODES.AUTHCL_0011);
      }

      // user clicked save consent, save the pair to local storage
      if (this.userSavedConsent) {
        // get stored pairs from local storage
        const savedPairs = localStorage.getItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS);

        // parse to array
        const savedPairsObject: TSavedConsents = savedPairs ? JSON.parse(savedPairs) : {};
        savedPairsObject[consentPair] = userConsent!.requested_claims;

        // save to local storage
        localStorage.setItem(STORAGE_CONFIG_KEYS.SAVED_USER_CONSENT_PAIRS, JSON.stringify(savedPairsObject));
      }

      return true;
    },
    generateUniqueId(): string {
      return Math.random().toString(36).substring(2, 9);
    },
    renderConsentItemList(title: string, list: Record<string, string>) {
      let consentItemList = '<h2 style="text-align: left; margin: 10px 0">' + title + '</h2>';
      consentItemList += '<ul style="text-align: left ;">';
      for (const value of Object.values(list)) {
        consentItemList += `<li style="list-style: decimal;">- ${escapeHTML(value)}</li>`;
      }
      consentItemList += '</ul>';
      consentItemList += '<br>';

      // render see more information link
      consentItemList += '<div style="text-align: left">';
      consentItemList += this.$t('here_you_find_more_information');
      consentItemList +=
        '<a href="#" style="color: #0052cc" onclick="window.api.openExternal(\'' +
        WIKI_CONSENT_DECLARATION_URL +
        '\')">';
      consentItemList += this.$t('privacy_notice');

      consentItemList += '</a><br><br>';
      consentItemList += '<input id="save-consent" type="checkbox"> ';
      consentItemList += '<label for="save-consent">' + this.$t('do_not_show_in_advance') + '</label>';
      consentItemList += '</div>';

      return consentItemList;
    },
  },
});
</script>
