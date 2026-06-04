<!--
  - Copyright 2026, gematik GmbH
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

<template>
  <GetCardHandle ref="cardHandleComponent" :handle-errors="handleErrors" />
  <CardExpirationWarner ref="cardExpirationWarnerComponent" />
  <PinActions ref="pinActionsComponent" :handle-errors="handleErrors" />
  <IdpActions ref="idpActionsComponent" />
  <ConnectorActions ref="connectorActionsComponent" :handle-errors="handleErrors" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import {
  IPC_CLOSE_THE_AUTHENTICATOR,
  IPC_START_AUTH_FLOW_EVENT,
  IS_DEV,
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
import { isRegisteredRpRedirectUri } from '@/renderer/utils/validate-redirect-uri-allowlist';
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
import { showLoginConsentDialog } from '@/renderer/modules/gem-idp/utils/login-consent-dialog';
import { parseAuthArguments } from '@/renderer/modules/gem-idp/services/arguments-parser';
import { getConfig } from '@/renderer/utils/get-configs';
// #!if MOCK_MODE === 'ENABLED'
import { DEVELOPER_OPTIONS } from '@/renderer/modules/connector/connector-mock/mock-config';
// #!endif
import CardHandle from '@/renderer/modules/gem-idp/components/CardHandle.vue';
import PinActions from '@/renderer/modules/gem-idp/components/PinActions.vue';
import IdpActions from '@/renderer/modules/gem-idp/components/IdpActions.vue';
import ConnectorActions from '@/renderer/modules/gem-idp/components/ConnectorActions.vue';
import CardExpirationWarner from '@/renderer/modules/gem-idp/components/CardExpirationWarner.vue';

export default defineComponent({
  name: 'AuthFlow',

  components: {
    CardExpirationWarner,
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
      // True when this flow was started via the local HTTP server: the final
      // redirect URL goes back to main over IPC instead of being opened locally.
      isServerMode: false,
      // Tracks whether main has been notified about this flow's outcome —
      // used as a safety net so the RP's GET / never hangs.
      serverModeNotified: false,
      // Flow identifier minted by main when GET / arrived; echoed back in
      // sendAuthFlowFinished so main can verify the IPC matches the pending flow.
      serverModeFlowId: '',
      // Pending close-the-app timer; a follow-up auth flow (e.g. multi-card
      // card #2) cancels it so the Authenticator stays up between cards.
      quitTimerId: null as ReturnType<typeof setTimeout> | null,
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

      // Disarm the close timer scheduled by quit() — multi-card flow #2 lands here.
      if (this.quitTimerId !== null) {
        clearTimeout(this.quitTimerId);
        this.quitTimerId = null;
      }

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

      // Safety net: ensure the RP's pending GET / always gets a response,
      // even if an exception escaped past callRedirectUri.
      if (this.isServerMode && !this.serverModeNotified) {
        logger.warn('Server-mode flow ended without notifying main — sending fallback error');
        window.api.sendAuthFlowFinished({
          flowId: this.serverModeFlowId,
          error: 'auth_flow_aborted',
        });
      }

      // Capture before the resets below; passed to quit() so multi-card
      // sessions get a longer grace window for the next GET /.
      const wasServerMode = this.isServerMode;

      // reset server-mode state so a queued legacy flow cannot inherit it
      this.isServerMode = false;
      this.serverModeNotified = false;
      this.serverModeFlowId = '';

      // first clear the stores
      this.$store.commit('connectorStore/resetStore');
      this.$store.commit('idpServiceStore/resetStore');

      // reset swal close functions
      (this.$refs.pinActionsComponent as InstanceType<typeof PinActions>).resetVerifyPinClose();

      // clear class state
      this.isAuthProcessActive = false;

      ConnectorConfig.setCardReaderParameter({
        crypt: CRYPT_TYPES.ECC,
      });

      ConnectorConfig.setAuthSignParameter({
        signatureType: SIGNATURE_TYPES.ECC,
      });

      if (!hasCurrentFlowFailed) {
        const nextFlow = this.authQueue.shift();
        if (nextFlow) {
          await this.startAuthenticationFlow(nextFlow.event, nextFlow.args);
        } else {
          this.quit(wasServerMode);
        }
      } else {
        const sameAttemptIdIndex = this.authQueue.findIndex((flow) => flow.loginAttemptId === this.attemptId);
        if (sameAttemptIdIndex > -1) {
          this.authQueue.splice(sameAttemptIdIndex, 1);
          logger.error('Flow with ID ' + this.attemptId + ' encountered an error and is removed from queue!');
        }

        const nextFlow = this.authQueue.shift();
        if (nextFlow) {
          await this.startAuthenticationFlow(nextFlow.event, nextFlow.args);
        } else {
          this.quit(wasServerMode);
        }
      }
    },
    async startAuthenticationFlow(_: Event, args: TOidcProtocol2UrlSpec): Promise<void> {
      logger.info('\n\n\n');
      logger.info('###############################################');
      logger.info('#### New Authentication Flow is started! ######');
      logger.info('###############################################');

      try {
        await this.$router.push('/');

        const IdpActionsInstance = this.$refs.idpActionsComponent as InstanceType<typeof IdpActions>;
        const CardHandleInstance = this.$refs.cardHandleComponent as InstanceType<typeof CardHandle>;
        const CardExpirationWarnerInstance = this.$refs.cardExpirationWarnerComponent as InstanceType<
          typeof CardExpirationWarner
        >;
        const PinActionsInstance = this.$refs.pinActionsComponent as InstanceType<typeof PinActions>;
        const ConnectorActionsInstance = this.$refs.connectorActionsComponent as InstanceType<typeof ConnectorActions>;

        this.isAuthProcessActive = true;

        // capture server-mode flags before any awaits so callRedirectUri can branch on them
        this.isServerMode = args.serverMode === true;
        this.serverModeNotified = false;
        this.serverModeFlowId = args.flowId ?? '';

        // parse arguments and set the state
        this.authArguments = await parseAuthArguments(args.challenge_path!, this.$store);

        // get the right card type from the scope, this is necessary because of deprecated card type logic
        this.authArguments.cardType = await getCardTypeFromScope(this.authArguments.cardType, args, this.createQueue);

        /**
         * Find card terminals
         */
        await ConnectorActionsInstance.getCardTerminals();

        /**
         * Parse and set IdP host
         */
        await IdpActionsInstance.parseAndSetIdpHost();

        /**
         * Validate that the IdP host is in the list of allowed IDP hosts
         */
        await IdpActionsInstance.validateIdpHost();

        /**
         * Read IdP data
         */
        await IdpActionsInstance.readIdpData();

        /**
         * Get challenge data from idp.
         */
        await IdpActionsInstance.getChallengeDataFromIdp();

        // In server mode we already know that this is from a official RP domain, and we can skip the consent dialog.
        if (!this.isServerMode) {
          let showLoginConsent = true;
          // #!if MOCK_MODE === 'ENABLED'
          const loginConsentSetting = getConfig(DEVELOPER_OPTIONS.SHOW_LOGIN_CONSENT_DIALOG, true).value;
          showLoginConsent = loginConsentSetting !== false;
          // #!endif
          if (showLoginConsent) {
            await showLoginConsentDialog(this.$store, this.$t);
          }
        }

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
         * Check selected Card expiration date and show warning if needed
         */
        CardExpirationWarnerInstance.checkCardExpirationWarning(this.authArguments.cardType!);

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
          alertLoginResultWithIconAndTimer('success', LOGIN_VIA_SMART_CARD_SUCCESSFUL, SHOW_DIALOG_DURATION).then(
            () => {
              logger.info('Login via smart card was successful!');
            },
          );
          await this.finishAndStartNextFlow();
        } else {
          await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION);
          await this.finishAndStartNextFlow(true);
        }
      } catch (error) {
        try {
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

          if ((error instanceof AuthFlowError && !error.errorShown) || !(error instanceof AuthFlowError)) {
            await alertLoginResultWithIconAndTimer('error', LOGIN_NOT_SUCCESSFUL, SHOW_DIALOG_DURATION);
          }

          await this.finishAndStartNextFlow(true);
        } finally {
          // Guarantee RP's pending GET / gets a response even if the cleanup above threw.
          if (this.isServerMode && !this.serverModeNotified) {
            window.api.sendAuthFlowFinished({
              flowId: this.serverModeFlowId,
              error: 'auth_flow_aborted',
            });
            this.serverModeNotified = true;
          }
        }
      }
    },
    async handleErrors(e: ConnectorError | UserfacingError | Error): Promise<void> {
      logStep('Step: handleErrors');
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
        // redirect_uri here is RAW from the attacker-controllable challenge_path;
        // only follow a registered RP origin, else it's an open-redirect 302.
        if (redirectUri && isRegisteredRpRedirectUri(redirectUri)) {
          url = redirectUri;
          if (state) stateParam = state;
        } else if (redirectUri) {
          logger.warn(`callRedirectUri: refusing unregistered error-path redirect_uri: ${redirectUri}`);
        }
      }

      if (!url || !validateRedirectUriProtocol(url)) {
        // Server-mode safety: still answer the pending GET / — otherwise
        // the RP hangs until the local HTTP server timeout.
        if (this.isServerMode && !this.serverModeNotified) {
          window.api.sendAuthFlowFinished({
            flowId: this.serverModeFlowId,
            error: errorText || errorType || 'no_valid_redirect_uri',
          });
          this.serverModeNotified = true;
        }
        return false;
      }

      const urlObj = new URL(url);

      if (!authFlowEndState.isSuccess) {
        if (!urlObj.searchParams.has('error')) {
          urlObj.searchParams.set('error', errorType || OAUTH2_ERROR_TYPE.SERVER_ERROR);
          urlObj.searchParams.set('error_description', authFlowEndState.idpError?.gamatikErrorText || errorText || '');

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

      // Server-mode: hand the URL back to main via IPC; main answers the
      // pending GET / and the RP navigates the browser itself. Error
      // params are already on finalUrl, so we always send `redirectUrl`.
      // DEEPLINK callbacks have a side-effect (launching a native client
      // via custom protocol) that the HTTP response can't replace — fire
      // it here too. OPEN_TAB and DIRECT have no useful side-effect in
      // server-mode (the RP navigates its own browser from the HTTP body).
      if (this.isServerMode) {
        if (this.authArguments.callbackType === TCallback.DEEPLINK) {
          const localDeepLink = createRedirectDeeplink(this.authArguments.deeplink, finalUrl);
          logger.info(`open local deeplink:${localDeepLink}`);
          window.api.openExternal(localDeepLink);
        }
        window.api.sendAuthFlowFinished({ flowId: this.serverModeFlowId, redirectUrl: finalUrl });
        this.serverModeNotified = true;
        return true;
      }

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
    quit(wasServerMode = false) {
      // #!if MOCK_MODE === 'ENABLED'
      if (!IS_DEV) {
        // #!endif
        // Server-mode gets a longer grace so multi-card RPs can fire the
        // next GET / before the app shuts down.
        const delayMs = wasServerMode ? 30_000 : 3_000;
        this.quitTimerId = setTimeout(() => {
          this.quitTimerId = null;
          window.api.send(IPC_CLOSE_THE_AUTHENTICATOR);
        }, delayMs);
        // #!if MOCK_MODE === 'ENABLED'
      }
      // #!endif
    },
  },
});
</script>
