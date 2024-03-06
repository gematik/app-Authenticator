/*
 * Copyright 2023 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
 */

import { ActionContext, Module } from 'vuex';
import jsonwebtoken from 'jsonwebtoken';

import { TRootStore } from '@/renderer/store';
import { logger } from '@/renderer/service/logger';
import { CentralIdpError, UserfacingError } from '@/renderer/errors/errors';
import { IDP_ENDPOINTS } from '@/constants';
import {
  IIdpEncJwk,
  IJweChallenge,
  IOpenIdConfiguration,
  TGemIdpServiceStore,
} from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';
import { parseErrorMessageToIDPError, parseUrlToIdpError, userAgent } from '@/renderer/utils/utils';
import { removePathFromChallenge } from '@/renderer/utils/parse-idp-url';
import { TAccessDataResponse, TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import { StatusCodes } from 'http-status-codes';
import { TClientRes } from '@/main/services/http-client';
import { httpsReqConfig } from '@/renderer/modules/gem-idp/services/get-idp-http-config';

export const INITIAL_AUTH_STORE_STATE = {
  challengePath: '',
  challenge: '',
  jweChallenge: null,
  idpHost: '',
  errorShown: false,
  jwsHbaSignature: undefined,
  jwsSmcbSignature: undefined,
  sid: undefined,
  caughtAuthFlowError: undefined,
  clientId: '',
  callback: undefined,
  deeplink: '',
  userConsent: {
    requested_scopes: {},
    requested_claims: {},
  },
};

export const gemIdpServiceStore: Module<TGemIdpServiceStore, TRootStore> = {
  namespaced: true,
  state: (): TGemIdpServiceStore => ({ ...INITIAL_AUTH_STORE_STATE }),
  mutations: {
    setCaughtAuthFlowError(state: TGemIdpServiceStore, error: TGemIdpServiceStore['caughtAuthFlowError']): void {
      if (error) {
        state.caughtAuthFlowError = {
          errorCode: error.errorCode,
          errorDescription: error.errorDescription,
          oauthErrorType: error.oauthErrorType,
        };
      }
    },
    /**
     * To refuse showing error multiple times.
     * Get reset only at the end of the flow in the resetStore mutation
     * @param state
     */
    setErrorShown(state: TGemIdpServiceStore): void {
      state.errorShown = true;
    },
    setIdpHost(state: TGemIdpServiceStore, host: string): void {
      state.idpHost = host;
    },
    setHbaJwsSignature(state: TGemIdpServiceStore, jwsSignature: string): void {
      state.jwsHbaSignature = jwsSignature;
    },
    setJweChallenge(state: TGemIdpServiceStore, jweChallenge: IJweChallenge): void {
      state.jweChallenge = jweChallenge;
    },
    setSmcbJwsSignature(state: TGemIdpServiceStore, jwsSignature: string): void {
      state.jwsSmcbSignature = jwsSignature;
    },
    setSid(state: TGemIdpServiceStore, sid: string): void {
      state.sid = sid;
    },
    setChallengePath(state: TGemIdpServiceStore, challengePath: string): void {
      state.challengePath = challengePath;
    },
    setChallenge(state: TGemIdpServiceStore, challenge: string): void {
      state.challenge = challenge;
    },
    setUserConsent(state: TGemIdpServiceStore, userConsent: TGemIdpServiceStore['userConsent']): void {
      state.userConsent = userConsent;
    },
    setOpenIdConfiguration(state: TGemIdpServiceStore, openIdConfiguration: IOpenIdConfiguration): void {
      state.openIdConfiguration = openIdConfiguration;
    },
    setIdpEncJwk(state: TGemIdpServiceStore, idpEncJwk: IIdpEncJwk): void {
      state.idpEncJwk = idpEncJwk;
    },
    setClientId(state: TGemIdpServiceStore, clientId: string): void {
      state.clientId = clientId;
    },
    setCallback(state: TGemIdpServiceStore, callback: TCallback): void {
      state.callback = callback;
    },
    setDeeplink(state: TGemIdpServiceStore, deeplink: string): void {
      state.deeplink = deeplink;
    },
    resetStore(state: TGemIdpServiceStore): void {
      state.jwsHbaSignature = undefined;
      state.jwsSmcbSignature = undefined;
      state.sid = undefined;
      state.challengePath = '';
      state.challenge = '';
      state.caughtAuthFlowError = undefined;
      state.errorShown = false;
      state.clientId = '';
      state.callback = undefined;
      state.deeplink = '';
      state.jweChallenge = null;
      state.userConsent = undefined;
    },
  },
  actions: {
    async getDiscoveryDocument(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<void> {
      try {
        await context.dispatch('setOpenIdConfiguration');
      } catch (err) {
        const challengePath = context.state.challengePath;
        const parseAndSetIdpHost = removePathFromChallenge(challengePath);
        context.commit('setIdpHost', parseAndSetIdpHost);
        await context.dispatch('setOpenIdConfiguration');
      }
    },
    async setOpenIdConfiguration(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<void> {
      try {
        const res = await window.api.httpGet(context.state.idpHost + IDP_ENDPOINTS.OPENID_CONFIGURATION, {
          ...httpsReqConfig(),
          headers: {
            Accept: '*/*',
            'User-Agent': userAgent + context.state.clientId,
          },
        });

        context.commit('setOpenIdConfiguration', jsonwebtoken.decode(res.data));
      } catch (err) {
        logger.error('Can not get Discovery Document', err);
        throw new CentralIdpError('Could not get Discovery Document');
      }
    },
    async getIdpEncJwk(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<void> {
      // uri_puk_idp_enc is required
      if (!context.state?.openIdConfiguration?.uri_puk_idp_enc) {
        return;
      }

      try {
        const res = await window.api.httpGet(context.state?.openIdConfiguration?.uri_puk_idp_enc, {
          ...httpsReqConfig(),
          headers: {
            'User-Agent': userAgent + context.state.clientId,
          },
        });
        context.commit('setIdpEncJwk', res.data);
      } catch (err) {
        logger.error('Can not get puk idp enc', err);
        throw new CentralIdpError('could not get IdpEncJwk');
      }
    },
    async getChallengeData(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<boolean> {
      const { state, commit } = context;
      try {
        //  IDP host and Authorization Path
        const url = state.challengePath;

        const result: TClientRes = await window.api.httpGet(url, {
          ...httpsReqConfig(),
          headers: {
            'User-Agent': userAgent + context.state.clientId,
          },
        });

        //An error occurred when the IDP sends a 302 as response with a location header containing an error parameter.
        if (result.status == StatusCodes.MOVED_TEMPORARILY && result.headers?.location) {
          const parsedIdpError = parseUrlToIdpError(result.headers.location);
          if (parsedIdpError) {
            logger.debug('IDP error as redirect with location');
            throw new CentralIdpError('Could not get challenge data for authentication', parsedIdpError);
          }
        }

        logger.debug('data.challenge ' + result.data.challenge);
        commit('setChallenge', result.data.challenge);
        commit('setUserConsent', result.data.user_consent);
        logger.info('challenge received successfully!');

        return true;
      } catch (err) {
        // error comes from validateAuthResponseData, just forward it
        if (err instanceof UserfacingError || err instanceof CentralIdpError) {
          throw err;
        }

        const response = err?.response;
        const errorMessage = response?.body?.error || err.message;
        logger.error(`Cannot get challenge from IdP. IdP responds with error: ${errorMessage}`, {
          error: err.message,
          status: response?.statusCode,
          data: response?.body,
          error_uri: response?.headers?.error_uri,
        });

        // When the idp sends an exception as a redirect parse message search parameter to idp Error
        let parsedIdpError;
        if (response.statusCode == StatusCodes.MOVED_TEMPORARILY && !response.data) {
          parsedIdpError = parseUrlToIdpError(err.message);
        }
        if (!parsedIdpError) {
          parsedIdpError = parseErrorMessageToIDPError(response.body);
        }

        throw new CentralIdpError('Could not get challenge data for authentication', parsedIdpError);
      }
    },
    async getRedirectUriWithToken(
      context: ActionContext<TGemIdpServiceStore, TRootStore>,
    ): Promise<TAccessDataResponse> {
      const { state } = context;

      // authorization_endpoint is required
      if (!context.state?.openIdConfiguration?.authorization_endpoint) {
        throw Error('authorization_endpoint is required. Be sure that openIdConfiguration exists in the store.');
      }

      try {
        const payload = 'signed_challenge=' + state.jweChallenge;
        const url = context.state.openIdConfiguration.authorization_endpoint;
        const response = await window.api.httpPost(url, payload, {
          ...httpsReqConfig(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': userAgent + context.state.clientId,
          },
        });
        logger.debug('response.status ' + response.status);
        const locationReturned = response.headers?.location;

        return {
          redirectUri: locationReturned,
          statusCode: response.status,
          idpError: response.data?.body,
        };
      } catch (err) {
        const response = err?.response;
        const errorUri = response?.headers?.error_uri;

        logger.error('Could not get authorization code from IdP. Details: ', {
          error: err.message,
          status: response?.statusCode,
          data: response?.body,
          error_uri: errorUri,
        });

        const errorMessage = parseErrorMessageToIDPError(response?.body);
        return {
          errorUri: errorUri,
          statusCode: response?.status || 400,
          idpError: errorMessage,
        };
      }
    },
  },
};
