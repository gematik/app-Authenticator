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
import { computed, ref } from 'vue';
import ToastNotification from '@/renderer/components/ToastNotification.vue';
import { TToastIconType } from '@/@types/common-types';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

interface CardWarning {
  id: string;
  cardType: ECardTypes.SMCB | ECardTypes.HBA;
  expirationDate: string;
  iccsn: string;
}

const WARNING_THRESHOLD = 90; // days

const warnings = ref<CardWarning[]>([]);

function onToastDismiss(warningId: string) {
  warnings.value = warnings.value.filter((warning) => warning.id !== warningId);
}

function newCardExpirationWarning(card: Omit<CardWarning, 'id'>) {
  if (getDaysUntilExpiration(card.expirationDate) > WARNING_THRESHOLD) {
    return; // No warning needed if expiration is more than WARNING_THRESHOLD days away
  }

  if (card.cardType !== ECardTypes.SMCB && card.cardType !== ECardTypes.HBA) {
    return; // SMC-KT is not supported
  }

  const warning: CardWarning = {
    ...card,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  };
  warnings.value.push(warning);
}

function getDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const timeDiff = expDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

const daysUntilExpiration = computed(() => {
  return warnings.value.map((warning) => ({
    id: warning.id,
    days: getDaysUntilExpiration(warning.expirationDate),
  }));
});

function getDaysForWarning(warningId: string): number {
  const daysData = daysUntilExpiration.value.find((item) => item.id === warningId);
  return daysData ? daysData.days : 0;
}

function getIconForWarning(expirationDate: string): TToastIconType {
  const daysDiff = getDaysUntilExpiration(expirationDate);
  if (daysDiff < 30) return 'error';
  if (daysDiff < 90) return 'warning';
  return 'info';
}

function getMessageForWarning(warningId: string): string {
  const days = getDaysForWarning(warningId);
  const warning = warnings.value.find((w) => w.id === warningId);

  if (!warning) return '';

  if (days <= 0) {
    return 'warning_card_expired'; //card is already expired
  } else {
    return 'warning_card_expire'; // card is about to expire
  }
}

defineExpose({
  newCardExpirationWarning,
});
</script>

<template>
  <ToastNotification
    v-for="warning in warnings"
    :key="warning.id"
    position="top-right"
    :title="$t('warning')"
    :message="
      $t(getMessageForWarning(warning.id), {
        cardType: warning.cardType,
        iccsn: warning.iccsn,
        expirationDate: new Date(warning.expirationDate).toLocaleDateString(),
        daysUntilExpiration: getDaysForWarning(warning.id) ? getDaysForWarning(warning.id) : '??',
      })
    "
    showPrimaryButton
    :showSecondaryButton="false"
    primaryButtonText="OK"
    :secondaryButtonText="$t('help')"
    :icon="getIconForWarning(warning.expirationDate)"
    :onDismiss="() => onToastDismiss(warning.id)"
    :primaryButtonAction="() => onToastDismiss(warning.id)"
  />
</template>
