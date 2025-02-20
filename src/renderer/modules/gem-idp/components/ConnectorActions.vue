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
<script lang="ts">
import { defineComponent } from 'vue';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { logStep } from '@/renderer/modules/gem-idp/utils';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { CRYPT_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { alertDefinedErrorWithDataOptional } from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { AuthFlowError } from '@/renderer/errors/errors';
import jsonwebtoken, { JwtPayload } from 'jsonwebtoken';
import createJwe from '@/renderer/modules/gem-idp/sign-feature/create-jwe';

export default defineComponent({
  name: 'ConnectorActions',
  props: {
    handleErrors: {
      type: Function,
      required: true,
    },
  },
  methods: {
    async getCardCertificate(cardType: ECardTypes): Promise<void> {
      logStep('Step: getCardCertificate');
      try {
        await this.$store.dispatch('connectorStore/getCardCertificate', cardType);
      } catch (e) {
        try {
          // as ECC throws an error, we try to get the RSA certificate
          ConnectorConfig.setCardReaderParameter({
            crypt: CRYPT_TYPES.RSA,
          });

          ConnectorConfig.setAuthSignParameter({
            signatureType: SIGNATURE_TYPES.RSA,
          });

          await this.$store.dispatch('connectorStore/getCardCertificate', cardType);
          logger.info('getCardCertificate finished');
        } catch (err) {
          await this.handleErrors(err);

          await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1107);
          throw new AuthFlowError(
            `Error while getting card certificate (${ERROR_CODES.AUTHCL_1107})`,
            err.message,
            undefined,
            true,
            OAUTH2_ERROR_TYPE.SERVER_ERROR,
          );
        }
      }
    },
    async signChallengeForCardType(cardType: ECardTypes): Promise<void> {
      logStep('Step: signChallengeForCardType');
      try {
        const certificate = this.$store.state.connectorStore?.cards[cardType]?.certificate;
        const challenge = this.$store.state.idpServiceStore?.challenge;

        // type guarding
        if (!certificate) {
          return;
        }

        // get and save signed challenge
        const data = { cardType, challenge, certificate };
        const jwsSignature = await this.$store.dispatch('connectorStore/getSignedAuthChallenge', data);

        if (cardType === ECardTypes.HBA) {
          this.$store.commit('idpServiceStore/setHbaJwsSignature', jwsSignature);
        } else {
          this.$store.commit('idpServiceStore/setSmcbJwsSignature', jwsSignature);
        }
      } catch (err) {
        await this.handleErrors(err);

        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1108);
        throw new AuthFlowError(
          `Error while signing the challenge (${ERROR_CODES.AUTHCL_1108})`,
          err.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.SERVER_ERROR,
        );
      }
    },
    async setSignature(cardType: ECardTypes): Promise<void> {
      try {
        const signatures = {
          [ECardTypes.SMCB]: this.$store.state.idpServiceStore.jwsSmcbSignature,
          [ECardTypes.HBA]: this.$store.state.idpServiceStore.jwsHbaSignature,
        };
        const signature = signatures[cardType];
        const idpEncJwk = this.$store.state.idpServiceStore.idpEncJwk;

        if (!signature || !idpEncJwk) {
          return;
        }

        const token = jsonwebtoken.decode(this.$store.state.idpServiceStore.challenge);
        const jwe = await createJwe(signature, idpEncJwk, (token as JwtPayload).exp as number); // non-null assert
        this.$store.commit('idpServiceStore/setJweChallenge', jwe);
      } catch (err) {
        await this.handleErrors(err);

        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0013);
        throw new AuthFlowError(
          `Set Signature step failed (${ERROR_CODES.AUTHCL_0013})`,
          err.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.ACCESS_DENIED,
        );
      }
    },
    /**
     * Get Card Terminals
     * Throws only for connector connection errors
     */
    async getCardTerminals(): Promise<void> {
      logStep('Step: getCardTerminals');
      try {
        await this.$store.dispatch('connectorStore/getCardTerminals');
        logger.info('getTerminals finished');
      } catch (err) {
        await this.handleErrors(err);

        // if this line is called, that means handleErrors didn't throw any error
        // we show an error, and throw error
        await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_1003);
        throw new AuthFlowError(
          `Error while getting card terminals (${ERROR_CODES.AUTHCL_1003})`,
          err.message,
          undefined,
          true,
          OAUTH2_ERROR_TYPE.SERVER_ERROR,
        );
      }
    },
  },
});
</script>

<template><div></div></template>

<style scoped></style>
