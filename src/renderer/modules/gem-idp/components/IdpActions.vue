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
<script lang="ts">
import { defineComponent } from 'vue';
import { alertDefinedErrorWithDataOptional, userAgent } from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { AuthFlowError, UserfacingError } from '@/renderer/errors/errors';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { logStep, sendAutoRedirectRequest } from '@/renderer/modules/gem-idp/utils';
import { removeLastPartOfChallengePath } from '@/renderer/utils/parse-idp-url';
import { logger } from '@/renderer/service/logger';
import { IPC_SET_USER_AGENT, IDP_ALLOWED_HOSTS } from '@/constants';
import { httpsReqConfig } from '@/renderer/modules/gem-idp/services/get-idp-http-config';
// #!if MOCK_MODE === 'ENABLED'
import { getConfig } from '@/renderer/utils/get-configs';
import { DEVELOPER_OPTIONS } from '@/renderer/modules/connector/connector-mock/mock-config';
// #!endif

export default defineComponent({
  name: 'IdpActions',
  methods: {
    async readIdpData() {
      try {
        /**
         * This is the first connection to IdP, means; if there is a connection problem to IdP, it will occur here.
         */
        await this.$store.dispatch('idpServiceStore/getDiscoveryDocument');

        /**
         * Read EncJwk from IdP
         */
        await this.$store.dispatch('idpServiceStore/getIdpEncJwk');
      } catch (e) {
        if (e instanceof AuthFlowError) {
          throw e;
        }

        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0002);
        throw new AuthFlowError(
          `Error while reading IdP data (${ERROR_CODES.AUTHCL_0002})`,
          e.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.SERVER_ERROR,
        );
      }
    },
    /**
     * To get the .well-known information from the IdP, we need to parse the challengePath
     * and get the host name of it
     */
    async parseAndSetIdpHost() {
      try {
        logStep('Step: parseAndSetIdpHost');
        const challengePath = this.$store.state.idpServiceStore.challengePath;
        const parseAndSetIdpHost = removeLastPartOfChallengePath(challengePath);
        this.$store.commit('idpServiceStore/setIdpHost', parseAndSetIdpHost);
      } catch (e) {
        if (e instanceof AuthFlowError) {
          throw e;
        }

        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0001);
        throw new AuthFlowError(
          `Error while parsing and setting IdP host (${ERROR_CODES.AUTHCL_0001})`,
          e.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.INVALID_REQUEST,
        );
      }
    },
    /**
     * Validates that the IdP host is in the list of allowed IDP hosts.
     * If the host is not allowed, the auth flow will be aborted.
     */
    async validateIdpHost() {
      logStep('Step: validateIdpHost');
      const idpHost = this.$store.state.idpServiceStore.idpHost;

      try {
        const url = new URL(idpHost);
        const hostname = url.hostname;

        const allowedHosts = [...IDP_ALLOWED_HOSTS];

        // #!if MOCK_MODE === 'ENABLED'
        const additionalHosts = getConfig(DEVELOPER_OPTIONS.IDP_ADDITIONAL_ALLOWED_HOSTS, '').value as string;
        if (additionalHosts) {
          const parsed = additionalHosts
            .split(',')
            .map((h) => h.trim())
            .filter(Boolean);
          allowedHosts.push(...parsed);
        }
        // #!endif

        if (!allowedHosts.includes(hostname)) {
          logger.error(`IDP host "${hostname}" is not in the list of allowed IDP hosts`);
          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0014);
          throw new AuthFlowError(
            `Not allowed IDP! (${ERROR_CODES.AUTHCL_0014})`,
            `IDP host "${hostname}" is not allowed`,
            undefined,
            true,
            OAUTH2_ERROR_TYPE.INVALID_REQUEST,
          );
        }

        logger.info(`IDP host "${hostname}" is allowed`);
      } catch (e) {
        if (e instanceof AuthFlowError) {
          throw e;
        }

        logger.error(`Failed to validate IDP host: ${e.message}`);
        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0014);
        throw new AuthFlowError(
          `Not allowed IDP! (${ERROR_CODES.AUTHCL_0014})`,
          e.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.INVALID_REQUEST,
        );
      }
    },
    async getChallengeDataFromIdp(): Promise<boolean> {
      logStep('Step: getChallengeDataFromIdp');
      try {
        return await this.$store.dispatch('idpServiceStore/getChallengeData');
      } catch (err) {
        // customer should see the idp errors
        window.api.focusToApp();

        if (err instanceof UserfacingError && err.code === ERROR_CODES.AUTHCL_0005) {
          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0005);
          throw new AuthFlowError(
            `Error while getting challenge data from IdP (${ERROR_CODES.AUTHCL_0005})`,
            err.message,
            err?.data?.url,
            true,
            OAUTH2_ERROR_TYPE.SERVER_ERROR,
          );
        } else {
          // IdP error occurred, warn the user
          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0002);
          throw new AuthFlowError(
            `Error while getting challenge data from IdP (${ERROR_CODES.AUTHCL_0002})`,
            err.message,
            err?.data?.url,
            true,
            OAUTH2_ERROR_TYPE.SERVER_ERROR,
          );
        }
      }
    },
    /**
     * Sends the request in Browser Context to use TrustStore,
     * if this doesn't work, tries the same thing in preload context to use own certificates
     * @param url
     */
    async sendAutomaticRedirectRequest(url: string) {
      logStep('Step: sendAutomaticRedirectRequest');
      const successMessage = 'Redirecting automatically flow completed';
      try {
        // send the user agent with the clientId to the main process
        const customUserAgent = userAgent + this.$store.state.idpServiceStore.clientId;
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
                'User-Agent': userAgent + this.$store.state.idpServiceStore.clientId,
              },
            },
          });
          logger.info(successMessage + ' from preload context');
        } catch (err) {
          logger.error('Redirecting automatically request failed! Error message: ', err?.message);
          logger.debug('Own http-client auto redirect failed e.response: ', err?.response);

          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0009);
          throw new AuthFlowError(
            `Error while sending automatic redirect request (${ERROR_CODES.AUTHCL_0009})`,
            err.message,
            undefined,
            true,
            OAUTH2_ERROR_TYPE.SERVER_ERROR,
          );
        }
      }
    },
  },
});
</script>

<template><div></div></template>

<style scoped>
@import '../../../global.css';
</style>
