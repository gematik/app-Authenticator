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

import { TRootStore } from '@/renderer/store';
import { IAuthServiceStore } from './auth-service-store.d';
import { logger } from '@/renderer/service/logger';
import { KeycloakPluginError, UserfacingError } from '@/renderer/errors/errors';
import getIdpTlsCertificates from '@/renderer/utils/get-idp-tls-certificates';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';
import { validateAuthResponseData } from '@/renderer/service/idp-response-validators';
import { userAgent } from '@/renderer/utils/utils';

export const INITIAL_AUTH_STORE_STATE = {
  challengePath: '',
  challenge: '',
  authRequestPath: '',
};

const httpsReqConfig = () => ({
  https: {
    certificateAuthority: getIdpTlsCertificates(),
    rejectUnauthorized: true,
  },
  headers: {
    'Content-Type': 'application/json; charset=UTF-8',
    'User-Agent': userAgent,
  },
});

export const authServiceStore: Module<IAuthServiceStore, TRootStore> = {
  namespaced: true,
  state: (): IAuthServiceStore => INITIAL_AUTH_STORE_STATE,
  mutations: {
    setHbaJwsSignature(state: IAuthServiceStore, jwsSignature: string): void {
      state.jwsHbaSignature = jwsSignature;
    },
    setSmcbJwsSignature(state: IAuthServiceStore, jwsSignature: string): void {
      state.jwsSmcbSignature = jwsSignature;
    },
    setSid(state: IAuthServiceStore, sid: string): void {
      state.sid = sid;
    },
    setChallengePath(state: IAuthServiceStore, challengePath: string): void {
      state.challengePath = challengePath;
    },
    setChallenge(state: IAuthServiceStore, challenge: string): void {
      state.challenge = challenge;
    },
    resetStore(state: IAuthServiceStore): void {
      state.authRequestPath = undefined;
      state.jwsHbaSignature = undefined;
      state.jwsSmcbSignature = undefined;
      state.sid = undefined;
      state.challengePath = '';
      state.challenge = '';
    },
    setAuthRequestPath(state: IAuthServiceStore, authReqParameters: TOidcProtocol2UrlSpec): void {
      state.authRequestPath = authReqParameters.authz_path;
    },
  },
  actions: {
    async getChallengeData(context: ActionContext<IAuthServiceStore, TRootStore>): Promise<boolean> {
      const { state, commit } = context;
      logger.debug('state.authRequestPath ' + JSON.stringify(context));
      try {
        //  IDP host and Authorization Path
        const url = state.authRequestPath;
        const idpHost = new URL(<string>url);
        const { data } = await window.api.httpGet(<string>url, { ...httpsReqConfig(), followRedirect: true });

        logger.info('IdP: Challenge data received successfully.');

        // extract IDP Host without Authorization Path
        // Challenge Path:challenge_endpoint received from IDP Keycloak
        const challengePath: string = idpHost.protocol + '//' + idpHost.host + data.challenge_endpoint;

        /**
         * Validates Auth Response and throws error on invalid case
         */
        validateAuthResponseData(data);

        logger.info('IdP: Challenge data validation completed.');

        if (data.challenge_endpoint) {
          commit('setChallengePath', challengePath);
        }
        commit('setSid', data.sid);
        commit('setChallenge', data.challenge);

        return true;
      } catch (e: any) {
        // error comes from validateAuthResponseData, just forward it
        if (e instanceof UserfacingError) {
          throw e;
        }

        const response = e?.response;
        const errorMessage = response?.body?.error || e.message;
        logger.error(`Cannot get challenge from IdP. IdP responds with error: ${errorMessage}`, {
          error: e,
          status: response?.statusCode,
          data: response?.body,
          error_uri: response?.headers?.error_uri,
        });

        throw new KeycloakPluginError('Could not get challenge data for authentication', {
          error: response?.body?.error,
          url: response?.headers['error_uri'] || response?.request?.responseURL,
        });
      }
    },
    async getRedirectUriWithToken(
      context: ActionContext<IAuthServiceStore, TRootStore>,
    ): Promise<{ redirectUri: string; statusCode: number; error_uri?: string }> {
      const { state } = context;
      try {
        const payload = {
          hba: {
            signed_challenge: state.jwsHbaSignature,
          },
          smcb: {
            signed_challenge: state.jwsSmcbSignature,
          },
        };

        const response = await window.api.httpPost(state.challengePath, payload, httpsReqConfig());
        logger.debug(`IdP: Token received successfully. Http Status: ${response.status}`);

        return {
          redirectUri: <string>response?.headers?.['x-callback-location'],
          statusCode: response.status,
          error_uri: <string>response?.headers?.error_uri,
        };
      } catch (e: any) {
        const response = e?.response;
        logger.error('Could not get authorization code from IdP. Details: ', {
          error: e,
          status: response?.statusCode,
          data: response?.body,
          error_uri: response?.headers?.error_uri,
        });
        throw new KeycloakPluginError('Could not get authorization code from IdP. Details: ', {
          statusCode: response?.statusCode,
          error: response?.body?.error,
          url: response?.headers?.error_uri,
        });
      }
    },
  },
};
