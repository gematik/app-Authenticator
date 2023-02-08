/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { ActionContext, Module } from 'vuex';
import jsonwebtoken from 'jsonwebtoken';

import { TRootStore } from '@/renderer/store';
import { logger } from '@/renderer/service/logger';
import { CentralIdpError, UserfacingError } from '@/renderer/errors/errors';
import getIdpTlsCertificates from '@/renderer/utils/get-idp-tls-certificates';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';
import { IDP_ENDPOINTS } from '@/constants';
import {
  IIdpEncJwk,
  IJweChallenge,
  IOpenIdConfiguration,
  TGemIdpServiceStore,
} from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';
import { userAgent } from '@/renderer/utils/utils';
import { TAccessDataResponse } from '@/renderer/modules/gem-idp/type-definitions';

export const INITIAL_AUTH_STORE_STATE = {
  challengePath: '',
  challenge: '',
  jweChallenge: null,
  authRequestPath: '',
  idpHost: '',
  errorShown: false,
  jwsHbaSignature: undefined,
  jwsSmcbSignature: undefined,
  sid: undefined,
  caughtAuthFlowError: undefined,
  clientId: '',
};

const httpsReqConfig = () => ({
  https: {
    certificateAuthority: getIdpTlsCertificates(),
    rejectUnauthorized: true,
  },
});

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
    setOpenIdConfiguration(state: TGemIdpServiceStore, openIdConfiguration: IOpenIdConfiguration): void {
      state.openIdConfiguration = openIdConfiguration;
    },
    setIdpEncJwk(state: TGemIdpServiceStore, idpEncJwk: IIdpEncJwk): void {
      state.idpEncJwk = idpEncJwk;
    },
    setClientId(state: TGemIdpServiceStore, clientId: string): void {
      state.clientId = clientId;
    },
    resetStore(state: TGemIdpServiceStore): void {
      state.authRequestPath = '';
      state.jwsHbaSignature = undefined;
      state.jwsSmcbSignature = undefined;
      state.sid = undefined;
      state.challengePath = '';
      state.challenge = '';
      state.caughtAuthFlowError = undefined;
      state.errorShown = false;
      state.clientId = '';
    },
    setAuthRequestPath(state: TGemIdpServiceStore, authReqParameters: TOidcProtocol2UrlSpec): void {
      state.authRequestPath = authReqParameters.challenge_path;
      logger.debug('setAuthRequestPath ' + JSON.stringify(authReqParameters));
    },
  },
  actions: {
    async getDiscoveryDocument(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<void> {
      try {
        const res = await window.api.httpGet(context.state.idpHost + IDP_ENDPOINTS.OPENID_CONFIGURATION, false, {
          ...httpsReqConfig(),
          headers: {
            Accept: '*/*',
            'User-Agent': userAgent + context.state.clientId,
          },
        });

        context.commit('setOpenIdConfiguration', jsonwebtoken.decode(res.data));
      } catch (err) {
        throw new CentralIdpError('Could not read setOpenIdConfiguration', { error: err });
      }
    },
    async getIdpEncJwk(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<void> {
      // uri_puk_idp_enc is required
      if (!context.state?.openIdConfiguration?.uri_puk_idp_enc) {
        return;
      }

      try {
        const res = await window.api.httpGet(context.state?.openIdConfiguration?.uri_puk_idp_enc, false, {
          ...httpsReqConfig(),
          headers: {
            'User-Agent': userAgent + context.state.clientId,
          },
        });
        context.commit('setIdpEncJwk', res.data);
      } catch (err) {
        throw new CentralIdpError('could not read IdpEncJwk', { error: err });
      }
    },
    async getChallengeData(context: ActionContext<TGemIdpServiceStore, TRootStore>): Promise<boolean> {
      const { state, commit } = context;
      try {
        logger.info('state.authRequestPath ' + state.authRequestPath);
        //  IDP host and Authorization Path
        const url = state.authRequestPath;

        const { data } = await window.api.httpGet(<string>url, false, {
          ...httpsReqConfig(),
          headers: {
            'User-Agent': userAgent + context.state.clientId,
          },
        });

        logger.debug('data.challenge ' + data.challenge);
        commit('setChallenge', data.challenge);

        logger.info('challenge received successfully!');

        return true;
      } catch (err) {
        // error comes from validateAuthResponseData, just forward it
        if (err instanceof UserfacingError) {
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

        throw new CentralIdpError('Could not get challenge data for authentication', {
          error: response?.body?.error,
          url: response?.headers['error_uri'] || response?.request?.responseURL,
        });
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
        logger.info('response.status ' + response.status);
        const location_returned = response.headers['location'];
        logger.debug("response.headers['location'] " + location_returned);

        return {
          redirectUri: location_returned,
          statusCode: response.status,
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
        return {
          errorUri: errorUri,
          statusCode: response?.status || 400,
        };
      }
    },
  },
};
