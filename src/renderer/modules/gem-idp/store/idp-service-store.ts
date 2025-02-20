/*
 * Copyright 2025, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.
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
  TIdpServiceStore,
} from '@/renderer/modules/gem-idp/store/idp-service-store.d';
import { parseErrorMessageToIDPError, parseUrlToIdpError, userAgent } from '@/renderer/utils/utils';
import { removePathFromChallenge } from '@/renderer/utils/parse-idp-url';
import { TAccessDataResponse } from '@/renderer/modules/gem-idp/type-definitions';
import { StatusCodes } from 'http-status-codes';
import { TClientRes } from '@/main/services/http-client';
import { httpsReqConfig } from '@/renderer/modules/gem-idp/services/get-idp-http-config';

export const INITIAL_AUTH_STORE_STATE = {
  challengePath: '',
  challenge: '',
  jweChallenge: null,
  idpHost: '',
  jwsHbaSignature: undefined,
  jwsSmcbSignature: undefined,
  clientId: '',
  callback: undefined,
  deeplink: '',
  userConsent: {
    requested_scopes: {},
    requested_claims: {},
  },
};

export const idpServiceStore: Module<TIdpServiceStore, TRootStore> = {
  namespaced: true,
  state: (): TIdpServiceStore => ({ ...INITIAL_AUTH_STORE_STATE }),
  mutations: {
    setIdpHost(state: TIdpServiceStore, host: string): void {
      state.idpHost = host;
    },
    setHbaJwsSignature(state: TIdpServiceStore, jwsSignature: string): void {
      state.jwsHbaSignature = jwsSignature;
    },
    setJweChallenge(state: TIdpServiceStore, jweChallenge: IJweChallenge): void {
      state.jweChallenge = jweChallenge;
    },
    setSmcbJwsSignature(state: TIdpServiceStore, jwsSignature: string): void {
      state.jwsSmcbSignature = jwsSignature;
    },
    setChallengePath(state: TIdpServiceStore, challengePath: string): void {
      state.challengePath = challengePath;
    },
    setChallenge(state: TIdpServiceStore, challenge: string): void {
      state.challenge = challenge;
    },
    setUserConsent(state: TIdpServiceStore, userConsent: TIdpServiceStore['userConsent']): void {
      state.userConsent = userConsent;
    },
    setOpenIdConfiguration(state: TIdpServiceStore, openIdConfiguration: IOpenIdConfiguration): void {
      state.openIdConfiguration = openIdConfiguration;
    },
    setIdpEncJwk(state: TIdpServiceStore, idpEncJwk: IIdpEncJwk): void {
      state.idpEncJwk = idpEncJwk;
    },
    setClientId(state: TIdpServiceStore, clientId: string): void {
      state.clientId = clientId;
    },
    resetStore(state: TIdpServiceStore): void {
      state.jwsHbaSignature = undefined;
      state.jwsSmcbSignature = undefined;
      state.challengePath = '';
      state.challenge = '';
      state.clientId = '';
      state.jweChallenge = null;
      state.userConsent = undefined;
    },
  },
  actions: {
    async getDiscoveryDocument(context: ActionContext<TIdpServiceStore, TRootStore>): Promise<void> {
      try {
        await context.dispatch('setOpenIdConfiguration');
      } catch (err) {
        const challengePath = context.state.challengePath;
        const parseAndSetIdpHost = removePathFromChallenge(challengePath);
        context.commit('setIdpHost', parseAndSetIdpHost);
        await context.dispatch('setOpenIdConfiguration');
      }
    },
    async setOpenIdConfiguration(context: ActionContext<TIdpServiceStore, TRootStore>): Promise<void> {
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
        logger.error('Can not get discovery document', err);
        throw new CentralIdpError('Could not get discovery document');
      }
    },
    async getIdpEncJwk(context: ActionContext<TIdpServiceStore, TRootStore>): Promise<void> {
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
        logger.error('Cannot get puk idp enc', err);
        throw new CentralIdpError('could not get IdpEncJwk');
      }
    },
    async getChallengeData(context: ActionContext<TIdpServiceStore, TRootStore>): Promise<boolean> {
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
        if (response?.statusCode == StatusCodes.MOVED_TEMPORARILY && !response?.data) {
          parsedIdpError = parseUrlToIdpError(err.message);
        }
        if (!parsedIdpError) {
          parsedIdpError = parseErrorMessageToIDPError(response?.body);
        }

        throw new CentralIdpError('Could not get challenge data for authentication', parsedIdpError);
      }
    },
    async sendAuthorizationRequestAction(
      context: ActionContext<TIdpServiceStore, TRootStore>,
    ): Promise<TAccessDataResponse> {
      const { state } = context;

      // authorization_endpoint is required
      if (!context.state?.openIdConfiguration?.authorization_endpoint) {
        return {
          errorUri: '',
          statusCode: 0,
          idpError: undefined,
        };
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
