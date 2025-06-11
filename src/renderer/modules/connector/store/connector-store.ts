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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */
// #!if MOCK_MODE === 'ENABLED'
import {
  MOCK_CONNECTOR_CERTS_CONFIG,
  MOCK_CONNECTOR_CONFIG,
} from '@/renderer/modules/connector/connector-mock/mock-config';
import { MOCK_CARD_PIN_STATUS, MOCK_CARD_TERMINALS } from '@/renderer/modules/connector/connector-mock/mock-constants';
import { MockCIdpJWSOptions } from '@/renderer/modules/connector/connector-mock/jws-jose-tools/jws-tool-helper';
import { MockJwsSignature } from '@/renderer/modules/connector/connector-mock/jws-jose-tools/mock-jws-signature';
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';
// #!endif
import { ActionContext, Module } from 'vuex';
import { TRootStore } from '@/renderer/store';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { launch as authSignLauncher } from '@/renderer/modules/connector/connector_impl/auth-sign-launcher';
import { launch as certificateReaderLauncher } from '@/renderer/modules/connector/connector_impl/certificate-reader-launcher';
import { getConfig } from '@/renderer/utils/get-configs';
import { launch as getCardTerminalsLauncher } from '@/renderer/modules/connector/connector_impl/get-card-terminals-launcher';
import { launch as getCardLauncher } from '@/renderer/modules/connector/connector_impl/get-cards-launcher';

import { logger } from '@/renderer/service/logger';
import { validateCardCertificate, validateSignedChallenge } from '@/renderer/modules/connector/services';
import { ConnectorError, UserfacingError } from '@/renderer/errors/errors';

import * as pinVerifier from '@/renderer/modules/connector/connector_impl/verify-pin-launcher';
import * as pinChecker from '@/renderer/modules/connector/connector_impl/check-pin-status';
import { TCardData, TCardTerminal, TConnectorStore } from '@/renderer/modules/connector/type-definitions';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { ERROR_CODES } from '@/error-codes';
import { convertDerToConcatenated, createUnsignedJws } from '@/renderer/modules/gem-idp/services/signing-service';
import { SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';

const base64url = require('base64url');
const PIN_STATUS_VERIFIED = 'VERIFIED';
const PIN_STATUS_VERIFIABLE = 'VERIFIABLE';

const INITIAL_CARDS_STATE = {
  [ECardTypes.HBA]: undefined,
  [ECardTypes.SMCB]: undefined,
};

export const connectorStore: Module<TConnectorStore, TRootStore> = {
  namespaced: true,
  state: {
    cards: { ...INITIAL_CARDS_STATE },
  },
  mutations: {
    setHbaCardData(state: TConnectorStore, cardData: TCardData): void {
      const hbaCardData = { ...state.cards.HBA, ...cardData };
      state.cards = { ...state.cards, [ECardTypes.HBA]: hbaCardData };
    },
    setSmcbCardData(state: TConnectorStore, cardData: TCardData): void {
      const smcbCardData = { ...state.cards[ECardTypes.SMCB], ...cardData };
      state.cards = { ...state.cards, [ECardTypes.SMCB]: smcbCardData };
    },
    setTerminals(state: TConnectorStore, terminals: TCardTerminal): void {
      state.terminals = terminals;
    },

    resetStore(state: TConnectorStore): void {
      logger.debug('resetStore');
      state.cards = { ...INITIAL_CARDS_STATE };
      state.terminals = undefined;
    },
  },
  actions: {
    async getSignedAuthChallenge(context: ActionContext<TConnectorStore, TRootStore>, data): Promise<string> {
      const { cardType } = data as {
        cardType: ECardTypes;
      };

      const challenge = this.state.idpServiceStore.challenge;
      const cardCertificate = <string>context?.state?.cards[cardType]?.certificate;

      const jwsParts = await createUnsignedJws(cardCertificate, challenge);

      ConnectorConfig.setAuthSignParameter({
        ...ConnectorConfig.authSignParameter,
        base64data: <string>jwsParts.hashedChallenge,
      });

      let jwsSignature;
      // #!if MOCK_MODE === 'ENABLED'
      if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
        const jwsHelper = new MockCIdpJWSOptions(cardType, challenge);
        try {
          const mockJwsSignature = new MockJwsSignature(cardType);
          const isEccCert = mockJwsSignature.isEccCert(mockJwsSignature.getPrivateKey());
          jwsSignature = await mockJwsSignature.createJws(
            isEccCert,
            jwsHelper.getPayload(),
            jwsHelper.getProtectedHeader(isEccCert),
          );
          logger.debug('jwsSignature: ', jwsSignature);
        } catch (err) {
          logger.error('jwsSignature was not created: ', err.message);
        }
      } else {
        // #!endif
        try {
          const cardData = <TCardData>context.state.cards[cardType];
          logger.debug('cardData', JSON.stringify(cardData));

          const signedChallengeFromConnector = await authSignLauncher(cardData.cardHandle);
          let signature = base64url.fromBase64(signedChallengeFromConnector);

          // For the ECC we need to convert the signature from DER to concatenated
          if (ConnectorConfig.authSignParameter.signatureType === SIGNATURE_TYPES.ECC) {
            signature = convertDerToConcatenated(signature, 64);
          }

          jwsSignature = `${jwsParts.header}.${jwsParts.payload}.${signature}`;
          logger.debug('JWS signature created: ', jwsSignature);
        } catch (err) {
          logger.error(`Could not get signed challenge for authentication: ${err.message}`);
          if (err instanceof ConnectorError || err instanceof UserfacingError) {
            throw err;
          }
          throw new UserfacingError("JWS Couldn't be created", err.message, ERROR_CODES.AUTHCL_1117);
        }
        // #!if MOCK_MODE === 'ENABLED'
      }
      // #!endif

      if (!jwsSignature || !validateSignedChallenge(jwsSignature)) {
        logger.error('Could not get valid JWS');
        throw new UserfacingError(
          'JWS signature is not valid',
          'JWS signature missing or invalid',
          ERROR_CODES.AUTHCL_0004,
        );
      }

      logger.debug(`A JWS signature fetched for card type ${cardType}.`);

      return jwsSignature;
    },
    getCardCertificate: async function (
      context: ActionContext<TConnectorStore, TRootStore>,
      cardType: ECardTypes,
    ): Promise<void> {
      let certificate = '';
      let certificateChain;
      const cardHandle = context.state.cards[cardType]?.cardHandle;

      try {
        // #!if MOCK_MODE === 'ENABLED'
        if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
          logger.warn('Mock connector configuration is enabled! Using mocked certificate chain!');
          certificateChain =
            cardType === ECardTypes.HBA
              ? readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT, true)
              : readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.SMCB_CERT, true);
        } else {
          // #!endif
          certificateChain = await certificateReaderLauncher(<string>cardHandle);

          // #!if MOCK_MODE === 'ENABLED'
        }
        // #!endif
        certificate = certificateChain;
      } catch (err) {
        logger.error(`Get certificate error: ${err.message}`);
        throw err;
      }

      if (!certificate || !validateCardCertificate(certificate)) {
        throw new UserfacingError(
          'Invalid card certificate',
          `Card certificate for ${cardType} not found or not valid`,
          ERROR_CODES.AUTHCL_1111,
        );
      }

      if (cardType === ECardTypes.HBA) {
        context.commit('setHbaCardData', { certificate: certificate });
      } else {
        context.commit('setSmcbCardData', { certificate: certificate });
      }
    },
    /**
     * Searches for connected card terminals in the network
     * Error handling happens in the AuthFlow.vue
     * @param context
     */
    async getCardTerminals(context: ActionContext<TConnectorStore, TRootStore>): Promise<void> {
      let cardTerminals;
      // #!if MOCK_MODE === 'ENABLED'
      if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
        logger.warn('Mock connector configuration is enabled! Using mocked CardTerminals!');
        cardTerminals = MOCK_CARD_TERMINALS;
      } else {
        // #!endif
        cardTerminals = await getCardTerminalsLauncher();

        // #!if MOCK_MODE === 'ENABLED'
      }
      // #!endif
      context.commit('setTerminals', cardTerminals);
    },
    async getCardHandle(context: ActionContext<TConnectorStore, TRootStore>, cardType: ECardTypes): Promise<void> {
      let cardHandle, response;

      // #!if MOCK_MODE === 'ENABLED'
      if (!getConfig(MOCK_CONNECTOR_CONFIG).value) {
        // #!endif
        response = await getCardLauncher(cardType);
        cardHandle = response?.cardHandle;
        // #!if MOCK_MODE === 'ENABLED'
      }
      // #!endif

      logger.debug(`cardHandle for ${cardType.toUpperCase()}-card: ${cardHandle}`);
      if (cardType === ECardTypes.HBA) {
        context.commit('setHbaCardData', { ...response, cardHandle });
      } else {
        context.commit('setSmcbCardData', { ...response, cardHandle });
        logger.debug('setSmcbCardData: response:', response, ' cardHandle:', cardHandle);
      }
    },

    async checkPinStatus(context: ActionContext<TConnectorStore, TRootStore>, cardType: ECardTypes): Promise<boolean> {
      // #!if MOCK_MODE === 'ENABLED'
      if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
        return true;
      }
      // #!endif
      let pinStatusResult;
      const cardHandle = context.state.cards[cardType]?.cardHandle;

      try {
        // #!if MOCK_MODE === 'ENABLED'
        if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
          logger.warn('Mock connector configuration is enabled! Using mocked card PIN status!');
          pinStatusResult = MOCK_CARD_PIN_STATUS;
        } else {
          // #!endif
          pinStatusResult = await pinChecker.getPinStatus(cardType, <string>cardHandle);

          // #!if MOCK_MODE === 'ENABLED'
        }
        // #!endif

        logger.debug(
          `PIN status for ${cardType.toUpperCase()}-card with CardHandle:${cardHandle} is: ${
            pinStatusResult.pinStatus
          }`,
        );
        if (cardType === ECardTypes.HBA) {
          context.commit('setHbaCardData', { pinStatus: pinStatusResult.pinStatus, cardType: ECardTypes.HBA });
        } else {
          context.commit('setSmcbCardData', {
            pinStatus: pinStatusResult.pinStatus,
            cardType: ECardTypes.SMCB,
          });
        }

        return pinStatusResult.pinStatus === PIN_STATUS_VERIFIED;
      } catch (err) {
        logger.error(`Cannot check PIN status due to : ${err.message}`);
        throw err;
      }
    },
    verifyPin: async function (
      context: ActionContext<TConnectorStore, TRootStore>,
      cardType: ECardTypes,
    ): Promise<void> {
      // #!if MOCK_MODE === 'ENABLED'
      if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
        context.commit('setHbaCardData', { pinStatus: 'VERIFIED' });
        context.commit('setSmcbCardData', { pinStatus: 'VERIFIED' });
      } else {
        // #!endif
        const cardData = context.state.cards[cardType];
        try {
          if (cardData?.pinStatus === PIN_STATUS_VERIFIABLE && context.state.terminals) {
            await pinVerifier.launch(context.state.terminals, cardData);
          }
          const pinStatusResult = await pinChecker.getPinStatus(cardType, <string>cardData?.cardHandle);

          if (cardType === ECardTypes.HBA) {
            context.commit('setHbaCardData', { pinStatus: pinStatusResult.pinStatus });
          } else {
            context.commit('setSmcbCardData', { pinStatus: pinStatusResult.pinStatus });
          }
        } catch (err) {
          logger.error(`Cannot VerifyPIN because: ${err.error || err.message}`);
          throw err;
        }
        // #!if MOCK_MODE === 'ENABLED'
      }
      // #!endif
    },
  },
};
