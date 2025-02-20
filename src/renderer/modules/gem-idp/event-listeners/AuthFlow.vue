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
  <GetCardHandle ref="cardHandleComponent" :handle-errors="handleErrors" />
  <PinActions ref="pinActionsComponent" :handle-errors="handleErrors" />
  <IdpActions ref="idpActionsComponent" />
  <ConnectorActions ref="connectorActionsComponent" :handle-errors="handleErrors" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import {
  IPC_MINIMIZE_THE_AUTHENTICATOR,
  IPC_START_AUTH_FLOW_EVENT,
  // #!if MOCK_MODE === 'ENABLED'
  IS_DEV,
  // #!endif
  LOGIN_NOT_SUCCESSFUL,
  LOGIN_VIA_SMART_CARD_SUCCESSFUL,
  SHOW_DIALOG_DURATION,
  WIKI_ERRORCODES_URL,
} from '@/constants';
import { logger } from '@/renderer/service/logger';
import { AuthFlowError, ConnectorError, UserfacingError } from '@/renderer/errors/errors';
import { INTERNAL_FATAL_ERRORS, MAPPED_CONNECTOR_FATAL_ERRORS, USER_FACING_WARNINGS } from '@/error-codes';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { TAuthFlowEndState, TOidcProtocol2UrlSpec } from '@/@types/common-types';
import {
  alertDefinedErrorWithDataOptional,
  alertLoginResultWithIconAndTimer,
  alertTechnicErrorWithIconOptional,
  createRedirectDeeplink,
} from '@/renderer/utils/utils';
import { validateRedirectUriProtocol } from '@/renderer/utils/validate-redirect-uri-protocol';
import { getCardTypeFromScope } from '@/renderer/utils/card-type-service';
import {
  OAUTH2_ERROR_TYPE,
  TAccessDataResponse,
  TAuthArguments,
  TCallback,
} from '@/renderer/modules/gem-idp/type-definitions';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { CRYPT_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import { logStep } from '@/renderer/modules/gem-idp/utils';
import { showConsentDeclaration } from '@/renderer/modules/gem-idp/utils/consent-declaration';
import { parseAuthArguments } from '@/renderer/modules/gem-idp/services/arguments-parser';
import CardHandle from '@/renderer/modules/gem-idp/components/CardHandle.vue';
import PinActions from '@/renderer/modules/gem-idp/components/PinActions.vue';
import IdpActions from '@/renderer/modules/gem-idp/components/IdpActions.vue';
import ConnectorActions from '@/renderer/modules/gem-idp/components/ConnectorActions.vue';

export default defineComponent({
  name: 'AuthFlow',
  components: {
    ConnectorActions,
    IdpActions,
    PinActions,
    GetCardHandle: CardHandle,
  },
  data() {
    return {
      isAuthProcessActive: false,
      attemptId: '',
      // awaiting auth flow requests
      authQueue: [] as {
        event: Event;
        args: TOidcProtocol2UrlSpec;
        loginAttemptId: string;
      }[],
      authArguments: {
        deeplink: '',
        callbackType: TCallback.OPEN_TAB,
        cardType: ECardTypes.SMCB,
      } as TAuthArguments,
    };
  },
  watch: {
    isAuthProcessActive(val) {
      this.$store.commit('setShowLoadingSpinner', val);
    },
  },
  created() {
    window.api.on(IPC_START_AUTH_FLOW_EVENT, this.createQueue);
  },
  methods: {
    async createQueue(event: Event, args: TOidcProtocol2UrlSpec) {
      logStep('Step: createQueue');
      // generate a random ID for the current auth flow
      const loginAttemptId = Math.random().toString(36).substring(2, 9);
      this.attemptId = loginAttemptId;

      if (this.isAuthProcessActive) {
        this.authQueue.push({ event, args, loginAttemptId });
        logger.info('Auth process is already active, adding to queue');
        return;
      } else {
        await this.startAuthenticationFlow(event, args);
      }
    },
    async finishAndStartNextFlow(hasCurrentFlowFailed = false): Promise<void> {
      logStep('Step: finishAndStartNextFlow');

      // reset authArguments
      this.authArguments = {
        deeplink: '',
        callbackType: TCallback.OPEN_TAB,
        cardType: ECardTypes.SMCB,
      };

      // first clear the stores
      this.$store.commit('connectorStore/resetStore');
      this.$store.commit('idpServiceStore/resetStore');

      // reset swal close functions
      (this.$refs.pinActionsComponent as InstanceType<typeof PinActions>).resetVerifyPinClose();

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

      try {
        // go to home page
        await this.$router.push('/');

        // get component instances
        const IdpActionsInstance = this.$refs.idpActionsComponent as InstanceType<typeof IdpActions>;
        const CardHandleInstance = this.$refs.cardHandleComponent as InstanceType<typeof CardHandle>;
        const PinActionsInstance = this.$refs.pinActionsComponent as InstanceType<typeof PinActions>;
        const ConnectorActionsInstance = this.$refs.connectorActionsComponent as InstanceType<typeof ConnectorActions>;

        this.isAuthProcessActive = true;

        // parse arguments and set the state
        this.authArguments = await parseAuthArguments(args.challenge_path!, this.$store);

        // get the right card type from the scope, this is necessary because of deprecated card type logic
        this.authArguments.cardType = await getCardTypeFromScope(this.authArguments.cardType, args, this.createQueue);

        /**
         * Parse and set IdP host
         */
        await IdpActionsInstance.parseAndSetIdpHost();

        /**
         * Read IdP data
         */
        await IdpActionsInstance.readIdpData();

        /**
         * Get challenge data from idp.
         */
        await IdpActionsInstance.getChallengeDataFromIdp();

        /**
         * Find card terminals
         */
        await ConnectorActionsInstance.getCardTerminals();

        /**
         * Get CardHandle and force user to place the card
         */
        await CardHandleInstance.getCardHandle(this.authArguments.cardType!);

        /**
         * Show consent declaration
         */
        await showConsentDeclaration(this.authArguments.cardType!, this.$store, this.$t);

        /**
         * Check and verify the pin status
         */
        await PinActionsInstance.checkPinStatus(this.authArguments.cardType!);
        await PinActionsInstance.verifyPin(this.authArguments.cardType!);

        /**
         * Get the card certificate
         */
        await ConnectorActionsInstance.getCardCertificate(this.authArguments.cardType!);

        /**
         * Sign the challenge for the card type
         */
        await ConnectorActionsInstance.signChallengeForCardType(this.authArguments.cardType!);

        /**
         * Set signature
         */
        await ConnectorActionsInstance.setSignature(this.authArguments.cardType!);

        /**
         * Get the redirect uri with token
         * This should never throw error!
         */
        const authFlowEndState = await this.sendAuthorizationRequest();

        /**
         * Return back to the client
         * This should never throw error!
         */
        const isRedirectSuccessful = await this.callRedirectUri(authFlowEndState);

        if (isRedirectSuccessful && authFlowEndState.isSuccess) {
          await alertLoginResultWithIconAndTimer('success', LOGIN_VIA_SMART_CARD_SUCCESSFUL, SHOW_DIALOG_DURATION);
          await this.finishAndStartNextFlow();
        } else {
          await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION);
          await this.finishAndStartNextFlow(true);
        }
      } catch (error) {
        let errorUrl = '';
        if (error instanceof AuthFlowError && error.errorUrl) {
          errorUrl = error.errorUrl;
        }

        const authFlowEndState = await this.sendAuthorizationRequest();

        await this.callRedirectUri(
          {
            isSuccess: false,
            url: errorUrl || authFlowEndState.url,
          },
          error.errorType,
          error.message,
        );

        // if this is an AuthFlowError and we have already shown the error, we don't need to show it again
        // OR if this is not an AuthFlowError, we show the error
        if ((error instanceof AuthFlowError && !error.errorShown) || !(error instanceof AuthFlowError)) {
          await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION);
        }

        await this.finishAndStartNextFlow(true);
      }
    },

    /**
     * Try to handle errors with defined error codes. In other case,
     * the function which call this function will handle the error by itself
     * @param e
     */
    async handleErrors(e: ConnectorError | UserfacingError | Error): Promise<void> {
      logStep('Step: handleErrors');
      // focus to app to show the error
      window.api.focusToApp();

      if (
        e instanceof ConnectorError &&
        MAPPED_CONNECTOR_FATAL_ERRORS[e.code] &&
        USER_FACING_WARNINGS.includes(MAPPED_CONNECTOR_FATAL_ERRORS[e.code] || '')
      ) {
        await alertDefinedErrorWithDataOptional(MAPPED_CONNECTOR_FATAL_ERRORS[e.code], e.data);
        throw new AuthFlowError(
          `Internal Connector Error ${e.code} `,
          e.message,
          '',
          true,
          OAUTH2_ERROR_TYPE.SERVER_ERROR,
        );
      } else if (e instanceof ConnectorError && MAPPED_CONNECTOR_FATAL_ERRORS[e.code]) {
        const mappedConError = MAPPED_CONNECTOR_FATAL_ERRORS[e.code];
        await alertTechnicErrorWithIconOptional(mappedConError);
        throw new AuthFlowError(
          `Internal Connector Error ${e.code} `,
          e.message,
          '',
          true,
          OAUTH2_ERROR_TYPE.SERVER_ERROR,
        );
      } else if (e instanceof UserfacingError && e.code && INTERNAL_FATAL_ERRORS.includes(e.code)) {
        await alertTechnicErrorWithIconOptional(e.code);
        throw new AuthFlowError(`Internal Error ${e.code} `, e.message, '', true, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      } else if (e instanceof UserfacingError && USER_FACING_WARNINGS.includes(e.code || '')) {
        await alertDefinedErrorWithDataOptional(e.code, e.data);
        throw new AuthFlowError(`Internal Error ${e.code} `, e.message, '', true, OAUTH2_ERROR_TYPE.SERVER_ERROR);
      }
    },

    /**
     * @returns URL
     */
    async sendAuthorizationRequest(): Promise<TAuthFlowEndState> {
      logStep('Step: sendAuthorizationRequest');

      /**
       * send signed challenge to idp
       * this never throws error!
       */
      const accessData: TAccessDataResponse = await this.$store.dispatch(
        'idpServiceStore/sendAuthorizationRequestAction',
      );

      if (accessData.errorUri) {
        return { isSuccess: false, url: accessData.errorUri, idpError: accessData.idpError };
      }

      if (accessData.redirectUri) {
        return { isSuccess: true, url: accessData.redirectUri };
      }

      return { isSuccess: false, url: '', idpError: accessData.idpError };
    },

    /**
     * open client with received url
     * OR parse the challenge_path and open the redirect url with custom error
     * @param authFlowEndState
     * @param errorType
     * @param errorText
     */
    async callRedirectUri(
      authFlowEndState: TAuthFlowEndState,
      errorType?: OAUTH2_ERROR_TYPE,
      errorText?: string,
    ): Promise<boolean> {
      logStep('Step: callRedirectUri');

      let url = authFlowEndState.url;
      const challengePath = this.$store.state.idpServiceStore.challengePath;
      let stateParam = '';

      if (!authFlowEndState.isSuccess && !url && challengePath) {
        const parsedChallengePath = new URL(challengePath);
        const redirectUri = parsedChallengePath.searchParams.get('redirect_uri');
        const state = parsedChallengePath.searchParams.get('state');
        if (redirectUri) url = redirectUri;
        if (state) stateParam = state;
      }

      if (!url || !validateRedirectUriProtocol(url)) return false;

      const urlObj = new URL(url);

      if (authFlowEndState.isSuccess) {
        // #!if MOCK_MODE === 'ENABLED'
        if (!IS_DEV) {
          // #!endif
          window.api.send(IPC_MINIMIZE_THE_AUTHENTICATOR);
          // #!if MOCK_MODE === 'ENABLED'
        }
        // #!endif
      } else {
        if (!urlObj.searchParams.has('error')) {
          urlObj.searchParams.set('error', errorType || OAUTH2_ERROR_TYPE.SERVER_ERROR);
          urlObj.searchParams.set('error_details', authFlowEndState.idpError?.gamatikErrorText || errorText || '');

          // add the gematikCode to the error url as error_code
          if (authFlowEndState.idpError?.gematikCode) {
            urlObj.searchParams.set('error_code', authFlowEndState.idpError?.gematikCode);
          }
          if (stateParam) urlObj.searchParams.set('state', stateParam);
        }

        if (!urlObj.searchParams.has('error_uri')) {
          urlObj.searchParams.set('error_uri', WIKI_ERRORCODES_URL);
        }
      }

      urlObj.searchParams.set('cardType', this.authArguments.cardType);

      const finalUrl = urlObj.toString();

      try {
        switch (this.authArguments.callbackType) {
          case TCallback.OPEN_TAB:
            window.api.openExternal(finalUrl);
            break;
          case TCallback.DIRECT:
            logger.debug('Try to send: ' + finalUrl);
            await (this.$refs.idpActionsComponent as InstanceType<typeof IdpActions>).sendAutomaticRedirectRequest(
              finalUrl,
            );
            break;
          case TCallback.DEEPLINK:
            // eslint-disable-next-line no-case-declarations
            const localDeepLink = createRedirectDeeplink(this.authArguments.deeplink, finalUrl);
            logger.info(`open local deeplink:${localDeepLink}`);
            window.api.openExternal(localDeepLink);
            break;
        }
        return true;
      } catch (error) {
        return false;
      }
    },
  },
});
</script>
