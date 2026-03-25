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
<script setup lang="ts">
import { ref } from 'vue';
import { useStore } from 'vuex';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import CardExpiredWarning from '@/renderer/components/CardExpiredWarning.vue';
import { logStep } from '@/renderer/modules/gem-idp/utils';
import { logger } from '@/renderer/service/logger';
import { X509Certificate } from '@peculiar/x509';
import { useSettings } from '@/renderer/modules/settings/useSettings';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';

const store = useStore();
const cardExpirationWarningRef = ref<InstanceType<typeof CardExpiredWarning>>();
const { load } = useSettings();
const configValues = ref<TRepositoryData>({ ...load() });

function getCardCertificate(cardType: ECardTypes): string | null {
  return store.state.connectorStore?.cards[cardType]?.certificate || null;
}

function extractExpirationDate(certificate: string): string | null {
  try {
    const cert = new X509Certificate(certificate);
    if (!cert.notAfter) {
      return null;
    }
    return cert.notAfter.toISOString().split('T')[0] + 'Z';
  } catch (error) {
    logger.error('Failed to parse certificate:', error);
    return null;
  }
}

function checkCardExpirationWarning(cardType: ECardTypes): void {
  logStep('Step: check CardExpiration');

  if (!configValues.value[ENTRY_OPTIONS_CONFIG_GROUP.WARN_CARD_EXPIRATION] && cardType === ECardTypes.SMCB) {
    logger.debug('Card expiration warning is disabled for SMC-B Cards in settings.');
    return;
  }

  const cardCertificate = getCardCertificate(cardType);
  if (!cardCertificate) {
    logger.debug(`No card certificate found for card type: ${cardType}`);
    return;
  }

  const expirationDate = extractExpirationDate(cardCertificate);
  if (!expirationDate) {
    logger.debug('No valid expiration date found for the card certificate.');
    return;
  }

  logger.info(`Card ${cardType} expires on ${expirationDate}`);

  cardExpirationWarningRef.value?.newCardExpirationWarning({
    cardType,
    expirationDate,
    iccsn: store.state.connectorStore?.cards[cardType]?.iccsn,
  });
}

defineExpose({
  checkCardExpirationWarning,
});
</script>

<template>
  <CardExpiredWarning ref="cardExpirationWarningRef" />
</template>
