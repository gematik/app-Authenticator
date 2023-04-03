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
  <div></div>
  <SelectSmcbModal
    v-if="showSMCBSelectModal"
    :smcb-list="smcbList"
    :resolve="selectCardPromises.resolve"
    :reject="selectCardPromises.reject"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import { parse } from 'query-string';
import SelectSmcbModal from '@/renderer/modules/home/components/SelectSmcbModal.vue';

import {
  AUTH_RE_TRY_TIMEOUT,
  IPC_CENTRAL_IDP_AUTH_START_EVENT,
  LOGIN_CANCELLED_BY_USER,
  LOGIN_NOT_SUCCESSFUL,
  LOGIN_VIA_SMART_CARD_SUCCESSFUL,
  SHOW_DIALOG_DURATION,
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
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { TAuthFlowEndState, TOidcProtocol2UrlSpec } from '@/@types/common-types';
import createJwe from '@/renderer/modules/gem-idp/sign-feature/create-jwe';
import {
  alertDefinedErrorWithDataOptional,
  alertLoginResultWithIconAndTimer,
  alertTechnicErrorAndThrow,
  alertTechnicErrorWithIconOptional,
  alertWithCancelButton,
  closeSwal,
  createRedirectDeeplink,
} from '@/renderer/utils/utils';
import { validateDeeplinkProtocol, validateRedirectUriProtocol } from '@/renderer/utils/validate-redirect-uri-protocol';
import { filterCardTypeFromScope, validateLauncherArguments } from '@/renderer/utils/url-service';
import { OAUTH2_ERROR_TYPE, TAccessDataResponse, TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import getIdpTlsCertificates from '@/renderer/utils/get-idp-tls-certificates';
import Swal from 'sweetalert2';

/**
 * We store the sweetalert's close function in this variable.
 * This allows us to close the model automatically, after user inserts the card
 */
let pendingCardActionModalClose: undefined | typeof Swal.close;
let pinVerifyModalClose: undefined | typeof Swal.close;

export default defineComponent({
  name: 'GemIdpAuthFlowProcess',
  components: {
    SelectSmcbModal,
  },
  data() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      rejectPendingCardActionTimeout: (_error: UserfacingError) => {
        /* do nothing here */
      },
      isAuthProcessActive: false,
      smcbList: [''],
      showSMCBSelectModal: false,
      selectCardPromises: { resolve: Promise.resolve as any, reject: Promise.reject as any },
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
    window.api.on(IPC_CENTRAL_IDP_AUTH_START_EVENT, this.startAuthenticationFlow);
  },
  methods: {
    async showSMCBSelectDialogModal(): Promise<void> {
      this.showSMCBSelectModal = true;

      return new Promise((resolve, reject) => {
        this.selectCardPromises = {
          resolve,

          reject: () => {
            logger.debug('reject Multi-SMCB-Select');
            this.showSMCBSelectModal = false;
            reject();
          },
        };
      });
    },

    clearStores() {
      this.$store.commit('connectorStore/resetStore');
      this.$store.commit('gemIdpServiceStore/resetStore');

      // reset swal close functions
      pinVerifyModalClose = undefined;
      pendingCardActionModalClose = undefined;

      // clear class state
      this.isAuthProcessActive = false;
    },
    async startAuthenticationFlow(_: Event, args: TOidcProtocol2UrlSpec): Promise<void> {
      let error: UserfacingError | null = null;
      // go to home page
      await this.$router.push('/');

      this.isAuthProcessActive = true;

      // get callback param from challenge path and remove it from challenge path
      const callback = this.popParamFromChallengePath('callback', args.challenge_path);
      if (!this.setCallback(callback)) {
        !this.errorShown && (await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0007));
        this.clearStores();
        return;
      }

      // stop the process if parameters are not valid!
      if (!this.validateParamsAndSetState(args)) {
        this.clearStores();
        return;
      }

      // todo remove after removing the ogr flow
      this.$store.commit('connectorStore/setFlowType', IPC_CENTRAL_IDP_AUTH_START_EVENT);

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

      const filteredChallengePath = filterCardTypeFromScope(args.challenge_path!);
      const cardType = filteredChallengePath.card_type;

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

        // there is a case that user does not enter the pin and instead cancel the auth process  in the app,
        // in that case we stop the process and open the browser with fail message
        // after PIN Verify timeouts, process keeps on, and we stop it here!
        if (!this.isAuthProcessActive) {
          return;
        }
      } catch (err) {
        this.showSMCBSelectModal = false;
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
      this.clearStores();
    },
    async getCardData(cardType: ECardTypes): Promise<void> {
      // Init Card and get CardHandle
      await this.getCardHandle(cardType);

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
      const jwe = await createJwe(signature, idpEncJwk, (token as JwtPayload).exp!); // non-null assert
      this.$store.commit('gemIdpServiceStore/setJweChallenge', jwe);
    },

    /**
     * Get Card Terminals
     * Throws only for connector connection errors
     */
    async getCardTerminals(): Promise<void> {
      try {
        await this.$store.dispatch('connectorStore/getCardTerminals');
        logger.info('getTerminals finished');
      } catch (err) {
        await this.handleErrors(err);

        !this.errorShown && (await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_1003));
        this.setCaughtError(ERROR_CODES.AUTHCL_1003, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      }
    },
    /**
     * Try to handle errors with defined error codes. In other case,
     * the function which call this function will handle the error by itself
     * @param e
     */
    async handleErrors(e: ConnectorError | UserfacingError | Error): Promise<void> {
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

        !this.errorShown && (await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1108, err.message));
        this.setCaughtError(ERROR_CODES.AUTHCL_1108, err.message, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      }
    },
    async getCardCertificate(cardType: ECardTypes): Promise<void> {
      // get card certificate
      try {
        await this.$store.dispatch('connectorStore/getCardCertificate', cardType);
        logger.info('getCardCertificate finished');
      } catch (err) {
        await this.handleErrors(err);

        !this.errorShown && (await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1107, err.message));
        this.setCaughtError(ERROR_CODES.AUTHCL_1107, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      }
    },
    /**
     * Gets card handle and also force user to place the card
     *
     * @param cardType
     */
    async getCardHandle(cardType: ECardTypes): Promise<void> {
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
        // 4047 is not handled in the handleErrors function!

        // in case of 1105, there are multiple smcbs in the connector, so the user has to choose in a modal dialog which one he want´s to use
        if (err.code === ERROR_CODES.AUTHCL_1105) {
          this.smcbList = err.data.foundCards;

          try {
            const selectedCard: any = await this.showSMCBSelectDialogModal();
            logger.debug('Selected Card:', selectedCard.CardHandle);
            logger.debug('- CardHandle:', selectedCard.SlotId);
            logger.debug('- CardHolderName:', selectedCard.CardHolderName);
            logger.debug('- Iccsn:', selectedCard.Iccsn);
            logger.debug('- CardType:', selectedCard.CardType);
            logger.debug('- SlotId:', selectedCard.SlotId);
            this.showSMCBSelectModal = false;

            this.$store.commit('connectorStore/setSmcbCardData', {
              cardHandle: selectedCard.CardHandle,
              ctId: selectedCard.CtId,
              slotNr: selectedCard.SlotId,
              cardType: selectedCard.CardType,
              iccsn: selectedCard.Iccsn,
            });

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
         */
        if (err instanceof ConnectorError && err.code === CONNECTOR_ERROR_CODES.E4047) {
          alertWithCancelButton(ERROR_CODES.AUTHCL_2001, 0, cardType).then(this.onUserCancelledCardInsert);

          // to close the model after user inserts the card, we store this close function here
          pendingCardActionModalClose = closeSwal();

          // if user clicks the cancel on the modal, we call the rejectPendingCardActionTimeout() function
          // this throws an error right here and user redirects to client
          await this.cardInsertReTryTimeout(AUTH_RE_TRY_TIMEOUT);

          return this.getCardHandle(cardType);
        }

        !this.errorShown && (await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_1001));
        this.setCaughtError(ERROR_CODES.AUTHCL_1001, undefined, OAUTH2_ERROR_TYPE.SERVER_ERROR);
        throw err;
      }
    },

    onUserCancelledCardInsert() {
      // user has clicked the cancel, we throw an error! This is reject function of cardInsertReTryTimeout Promise
      this.rejectPendingCardActionTimeout(
        new UserfacingError(this.$t(LOGIN_CANCELLED_BY_USER), '', ERROR_CODES.AUTHCL_0006),
      );
    },
    /**
     * Checks PIM Status. On blocked and rejected cases throws error
     * @param cardType
     */
    async checkPinStatus(cardType: ECardTypes): Promise<void> {
      try {
        const isPinStatusVerified = await this.$store.dispatch('connectorStore/checkPinStatus', cardType);

        if (!isPinStatusVerified) {
          // customer should see the pin warning
          window.api.focusToApp();

          /**
           * If the user clicks cancel the value will be -1
           */
          alertWithCancelButton(ERROR_CODES.AUTHCL_2002, -1, cardType).then(async (promptRes) => {
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
          });
          pinVerifyModalClose = closeSwal();
        }
      } catch (err) {
        await this.handleErrors(err);
        !this.errorShown && (await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1101, err.message));
        this.setCaughtError(ERROR_CODES.AUTHCL_1101, err.message, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
      }
    },

    /**
     * Verify the PIN on VERIFIABLE case
     * @param cardType
     */
    async verifyPin(cardType: string): Promise<void> {
      try {
        // ask user for enter pin
        await this.$store.dispatch('connectorStore/verifyPin', cardType);

        if (typeof pinVerifyModalClose === 'function') {
          pinVerifyModalClose();
        }
      } catch (err) {
        await this.handleErrors(err);

        !this.errorShown && (await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_1102));
        this.setCaughtError(ERROR_CODES.AUTHCL_1102, undefined, OAUTH2_ERROR_TYPE.ACCESS_DENIED);
        this.isAuthProcessActive = false;
        if (typeof pinVerifyModalClose === 'function') {
          pinVerifyModalClose();
        }
        throw new UserfacingError('VerifyPIN failed!', err.message, ERROR_CODES.AUTHCL_1102);
      }
    },
    async getChallengeDataFromIdp(): Promise<boolean> {
      try {
        return await this.$store.dispatch('gemIdpServiceStore/getChallengeData');
      } catch (err) {
        // customer should see the idp errors
        window.api.focusToApp();

        // Error AUTHCL_0013 means something went wrong with Auth Response validation
        if (err instanceof UserfacingError && err.code === ERROR_CODES.AUTHCL_0005) {
          !this.errorShown && (await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0005));
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
      /**
       * send signed challenge to keycloak
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
      try {
        validateLauncherArguments(args);
        const authReqParameters: TOidcProtocol2UrlSpec = {
          challenge_path: filterCardTypeFromScope(args.challenge_path!).challenge_path,
        };
        if (authReqParameters.challenge_path) {
          const url = new URL(authReqParameters.challenge_path);
          const clientId = url.searchParams.get('client_id');
          this.$store.commit('gemIdpServiceStore/setClientId', clientId);
        }
        this.$store.commit('gemIdpServiceStore/setChallengePath', authReqParameters.challenge_path);

        return true;
      } catch (e) {
        // focus to app to show the error
        window.api.focusToApp();

        !this.errorShown && alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0001);
        this.setCaughtError(
          ERROR_CODES.AUTHCL_0001,
          'Invalid launcher parameters received.',
          OAUTH2_ERROR_TYPE.INVALID_REQUEST,
        );
        return false;
      }
    },
    setCaughtError(errorCode: string, errorDescription?: string, errorType?: OAUTH2_ERROR_TYPE) {
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
      return new Promise<void>((resolve, reject) => {
        this.rejectPendingCardActionTimeout = reject;
        setTimeout(() => resolve(), secs);
      });
    },

    /**
     * open client with received url
     * OR parse the authz_path and open the redirect url with custom error
     * @param authFlowEndState
     */
    async openClientIfNeeded(authFlowEndState: TAuthFlowEndState): Promise<void> {
      let url: string | null = authFlowEndState.url;
      const caughtErrorObject = this.$store.state.gemIdpServiceStore.caughtAuthFlowError;

      // if there is no url, we parse the authz_path and get the redirect url
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
          !this.errorShown && (await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0007));
          this.clearStores();
          return;
        }

        if (authFlowEndState.isSuccess) {
          await alertLoginResultWithIconAndTimer('success', LOGIN_VIA_SMART_CARD_SUCCESSFUL, SHOW_DIALOG_DURATION);
        } else if (!url.includes('error=') && caughtErrorObject) {
          const definedError = caughtErrorObject.oauthErrorType || OAUTH2_ERROR_TYPE.SERVER_ERROR;
          url = `${url}?error=${definedError}&error_details=${caughtErrorObject.errorDescription}${state}`;
        }
        if (!authFlowEndState.isSuccess && !url.includes('error_uri')) {
          url = `${url}&error_uri=` + WIKI_ERRORCODES_URL;
        }

        url = encodeURI(url);
        switch (this.$store.state.gemIdpServiceStore.callback) {
          case TCallback.OPEN_TAB:
            // open browser
            window.api.openExternal(url);
            break;
          case TCallback.DIRECT:
            // calls callback url of resource server to complete request, this must be async, do not convert to await!
            logger.debug('Try to send: ' + url);
            await window.api
              .httpGet(url, {
                ...{
                  https: {
                    certificateAuthority: getIdpTlsCertificates(),
                    rejectUnauthorized: true,
                  },
                },
              })
              .then(() => {
                logger.info('Redirecting automatically flow completed');
              })
              .catch((err) => {
                logger.error('Redirecting automatically request failed!', err.message);
              });
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
      this.clearStores();
    },
    /**
     * To get .well-known information from the IdP, we need to parse the challengePath
     * and get the host name of it
     */
    parseAndSetIdpHost() {
      const challengePath = this.$store.state.gemIdpServiceStore.challengePath;
      const parsedChallengePath = new URL(challengePath || '');
      const host = parsedChallengePath.protocol + '//' + parsedChallengePath.host;
      this.$store.commit('gemIdpServiceStore/setIdpHost', host);
    },
    /**
     * Returns a parameter from challenge path and removes the parameter from challenge path
     * @param challengePath
     * @param paramName
     */
    popParamFromChallengePath(paramName: string, challengePath?: string): string | null {
      if (challengePath && challengePath.includes(paramName)) {
        const parsedPath = parse(challengePath);
        const value = parsedPath[paramName];

        // update challenge path
        const cleanChallengePath = challengePath.replace('&' + paramName + '=' + value, '');
        this.$store.commit('gemIdpServiceStore/setChallengePath', cleanChallengePath);

        return typeof value === 'string' ? value : null;
      }

      return '';
    },
    setCallback(callbackValue: string | null): boolean {
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
  },
});
</script>
