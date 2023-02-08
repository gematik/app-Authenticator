<!--
  - Copyright (c) 2023 gematik GmbH
  - 
  - Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
  - the European Commission - subsequent versions of the EUPL (the Licence);
  - You may not use this work except in compliance with the Licence.
  - You may obtain a copy of the Licence at:
  - 
  -     https://joinup.ec.europa.eu/software/page/eupl
  - 
  - Unless required by applicable law or agreed to in writing, software
  - distributed under the Licence is distributed on an "AS IS" basis,
  - WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  - See the Licence for the specific language governing permissions and
  - limitations under the Licence.
  - 
  -->

<template>
  <div />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import {
  AUTH_RE_TRY_TIMEOUT,
  IPC_AUTH_FLOW_FINISH_REDIRECT_EVENT,
  IPC_OGR_IDP_START_EVENT,
  LOGIN_CANCELLED_BY_USER,
  LOGIN_NOT_SUCCESSFUL,
  LOGIN_VIA_SMART_CARD_SUCCESSFUL,
  SHOW_DIALOG_DURATION,
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
import {
  alertDefinedErrorWithDataOptional,
  alertLoginResultWithIconAndTimer,
  alertTechnicErrorAndThrow,
  alertTechnicErrorWithIconOptional,
  alertWithCancelButton,
  closeSwal,
} from '@/renderer/utils/utils';
import { validateRedirectUriProtocol } from '@/renderer/utils/validate-redirect-uri-protocol';
import { validateLauncherArguments } from '@/renderer/utils/url-service';

/**
 * We store the sweetalert's close function in this variable.
 * This allows us to close the model automatically, after user inserts the card
 */
let pendingCardActionModalClose: ((namespace?: string) => void) | undefined;
let pinVerifyModalClose: ((namespace?: string) => void) | undefined;

export default defineComponent({
  name: 'AuthFlowProcess',
  data() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      rejectPendingCardActionTimeout: (_reason?: UserfacingError) => {
        /* do nothing here */
      }, // eslint-disable-line
      isAuthProcessActive: false,
      callRedirectEvent: false,
    };
  },
  watch: {
    isAuthProcessActive(val) {
      this.$store.commit('setShowLoadingSpinner', val);
    },
  },
  created() {
    window.api.on(IPC_OGR_IDP_START_EVENT, this.startAuthenticationFlow);
  },
  methods: {
    clearStores() {
      this.$store.commit('connectorStore/resetStore');
      this.$store.commit('authServiceStore/resetStore');

      // reset swal close functions
      pinVerifyModalClose = undefined;
      pendingCardActionModalClose = undefined;
    },

    async startAuthenticationFlow(_: Event, args: TOidcProtocol2UrlSpec): Promise<void> {
      let error: UserfacingError | null = null;
      // go to home page
      await this.$router.push('/');

      this.isAuthProcessActive = true;
      this.callRedirectEvent = !!args.serverMode;

      // stop the process if parameters are not valid!
      if (!this.validateParamsAndSetState(args)) {
        this.isAuthProcessActive = false;
        return;
      }

      this.$store.commit('connectorStore/setFlowType', IPC_OGR_IDP_START_EVENT);

      // get challenge data from IDP
      const isChallengeDataFetched = await this.getChallengeDataFromIdp();

      /**
       * In this error case,we have already warned the user about the problem in the getChallengeDataFromIdp function
       * and opened the client if we received an url.
       */
      if (!isChallengeDataFetched) {
        this.isAuthProcessActive = false;
        return;
      }

      try {
        // find card terminals
        await this.getCardTerminals();

        await this.getCardData(ECardTypes.SMCB);

        // there is a case that user does not enter the pin and instead cancel the auth process  in the app,
        // in that case we stop the process and open the browser with fail message
        // after PIN Verify timeouts, process keeps on, and we stop it here!
        if (!this.isAuthProcessActive) {
          return;
        }

        await this.getCardData(ECardTypes.HBA);
      } catch (e: any) {
        error = e;
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
    },

    /**
     * Get Card Terminals
     * Throws only for connector connection errors
     */
    async getCardTerminals(): Promise<void> {
      try {
        await this.$store.dispatch('connectorStore/getCardTerminals');
        logger.info('get Terminals finished');
      } catch (e: any) {
        await this.handleErrors(e);

        await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1003, e.message);
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
        await alertDefinedErrorWithDataOptional(MAPPED_CONNECTOR_FATAL_ERRORS[e.code], e.data);
        throw new UserfacingError(e.message, e.description || '', mappedConError);
      } else if (e instanceof ConnectorError && MAPPED_CONNECTOR_FATAL_ERRORS[e.code]) {
        const mappedConError = MAPPED_CONNECTOR_FATAL_ERRORS[e.code];

        await alertTechnicErrorWithIconOptional(mappedConError);
        throw new UserfacingError(e.message, e.description || '', mappedConError);
      } else if (e instanceof UserfacingError && e.code && INTERNAL_FATAL_ERRORS.includes(e.code)) {
        await alertTechnicErrorWithIconOptional(e.code);
        throw e;
      } else if (e instanceof UserfacingError && USER_FACING_WARNINGS.includes(e.code || '')) {
        await alertDefinedErrorWithDataOptional(e.code, e.data);
        throw e;
      }
    },
    async signChallengeForCardType(cardType: ECardTypes): Promise<void> {
      try {
        const data = { cardType };
        const jwsSignature = await this.$store.dispatch('connectorStore/getSignedAuthChallenge', data);

        logger.info('getSignedAuthChallenge finished');

        if (cardType === ECardTypes.HBA) {
          this.$store.commit('authServiceStore/setHbaJwsSignature', jwsSignature);
        } else {
          this.$store.commit('authServiceStore/setSmcbJwsSignature', jwsSignature);
        }
      } catch (e: any) {
        await this.handleErrors(e);

        await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1108, e.message);
      }
    },
    async getCardCertificate(cardType: ECardTypes): Promise<void> {
      // get card certificate
      try {
        await this.$store.dispatch('connectorStore/getCardCertificate', cardType);
        logger.info('getCardCertificate finished');
      } catch (e: any) {
        await this.handleErrors(e);

        await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1107, e.message);
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
        logger.info('get CardHandle finished for:' + cardType + '-Card');

        // getCardHandle function is a recurring function! In an error case, we open a warning modal and give to the user
        // a second chance to enter the pin. This warning models close function is stored in the
        // pendingCardActionModalClose variable, in line of code, user has entered the pin and, we can close the modal
        // if it is still there!
        if (typeof pendingCardActionModalClose === 'function') {
          pendingCardActionModalClose();
        }
      } catch (e: any) {
        // 4047 is not handled in the handleErrors function!
        await this.handleErrors(e);

        /**
         * Connector Error code 4047 means card is not placed!
         * We give a second chance to place the card here
         */
        if (e instanceof ConnectorError && e.code === CONNECTOR_ERROR_CODES.E4047) {
          alertWithCancelButton(ERROR_CODES.AUTHCL_2001, 0, cardType).then(this.onUserCancelledCardInsert);

          // to close the model after user inserts the card, we store this close function here
          pendingCardActionModalClose = closeSwal();

          // if user clicks the cancel on the modal, we call the rejectPendingCardActionTimeout() function
          // this throws an error right here and user redirects to client
          await this.cardInsertReTryTimeout(AUTH_RE_TRY_TIMEOUT);

          return this.getCardHandle(cardType);
        }

        await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_1001);
        throw e;
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

            // type guarding
            const cardData = connectorState.cards[cardType];
            if (!cardData) {
              return;
            }
            const pinStatus = cardData.pinStatus;

            // cancel process and open client
            if (pinStatus != 'VERIFIED') {
              this.isAuthProcessActive = false;

              const authFlowEndState = await this.getRedirectUriWithToken(
                promptRes == -1
                  ? new UserfacingError(this.$t('login_cancelled_by_user'), '', ERROR_CODES.AUTHCL_0006)
                  : null,
              );
              await this.openClientIfNeeded(authFlowEndState);
            }
          });
          pinVerifyModalClose = closeSwal();
        }
      } catch (e: any) {
        await this.handleErrors(e);
        await alertTechnicErrorAndThrow(ERROR_CODES.AUTHCL_1101, e.message);
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
      } catch (e: any) {
        await this.handleErrors(e);

        await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_1102);

        this.isAuthProcessActive = false;
        if (typeof pinVerifyModalClose === 'function') {
          pinVerifyModalClose();
        }
        throw new UserfacingError('VerifyPIN failed!', '', ERROR_CODES.AUTHCL_1102);
      }
    },
    async getChallengeDataFromIdp(): Promise<boolean> {
      try {
        return await this.$store.dispatch('authServiceStore/getChallengeData');
      } catch (e: any) {
        // customer should see the idp errors
        window.api.focusToApp();

        // Error AUTHCL_0005 means something went wrong with Auth Response validation
        if (e instanceof UserfacingError && e.code === ERROR_CODES.AUTHCL_0005) {
          await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0005);
        } else {
          // IdP error occurred, warn the user
          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0002);
        }

        await this.openClientIfNeeded({ url: e?.data?.url, isSuccess: false });
        return false;
      }
    },
    /**
     * @returns URL
     */
    async getRedirectUriWithToken(error: UserfacingError | null = null): Promise<TAuthFlowEndState> {
      try {
        // send signed challenge to keycloak
        const accessData = await this.$store.dispatch('authServiceStore/getRedirectUriWithToken');

        if (accessData.error_uri) {
          if (error && error.code == ERROR_CODES.AUTHCL_0006) {
            await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
          } else {
            await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION);
          }
          return { isSuccess: false, url: accessData.error_uri };
        }
        // bdr doesn't want to open client
        if (accessData.statusCode !== 200 && accessData.statusCode !== 204) {
          return { isSuccess: true, url: '' };
        }

        return { isSuccess: true, url: accessData.redirectUri };
      } catch (e: any) {
        // customer should see the error
        window.api.focusToApp();

        logger.error('Could not get token and open the client due to ', e);

        await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION);
        if (e?.data?.url) {
          return { isSuccess: false, url: e?.data?.url };
        }

        return { isSuccess: false, url: '' };
      }
    },
    validateParamsAndSetState(args: TOidcProtocol2UrlSpec): boolean {
      try {
        validateLauncherArguments(args);
        // put auth params in vuex store
        this.$store.commit('authServiceStore/setAuthRequestPath', args);

        return true;
      } catch (e: any) {
        // focus to app to show the error
        window.api.focusToApp();

        alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0001, 'error');
        return false;
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
     */ async openClientIfNeeded(authFlowEndState: TAuthFlowEndState): Promise<void> {
      let url = authFlowEndState.url;

      // if there is no url, we parse the authz_path and get the redirect url
      const authzPath = this.$store.state.authServiceStore.authRequestPath;
      if (!authFlowEndState.isSuccess && !url && authzPath) {
        const parsedHost = new URL(authzPath);

        if (parsedHost.searchParams.get('redirect_uri')) {
          const customError = this.$t(LOGIN_NOT_SUCCESSFUL);
          url = parsedHost.searchParams.get('redirect_uri') + '?error=invalid_request&error_details=' + customError;
        }
      }

      if (url) {
        if (!validateRedirectUriProtocol(url)) {
          await alertTechnicErrorWithIconOptional(ERROR_CODES.AUTHCL_0007);
          this.isAuthProcessActive = false;
          return;
        }

        if (authFlowEndState.isSuccess) {
          await alertLoginResultWithIconAndTimer('success', LOGIN_VIA_SMART_CARD_SUCCESSFUL, SHOW_DIALOG_DURATION);
        }

        // redirect and minimize the app
        if (this.callRedirectEvent) {
          window.api.send(IPC_AUTH_FLOW_FINISH_REDIRECT_EVENT, url);
          return;
        }

        // open browser
        window.api.openExternal(url);
      }
    },
  },
});
</script>
