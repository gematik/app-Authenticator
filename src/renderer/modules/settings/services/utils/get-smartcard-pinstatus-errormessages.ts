import i18n from '@/renderer/i18n';

const translate = i18n.global.t;

export function getErrorMessage(status: string, slotNr: string, cardTerminalId: string) {
  let errorMessage: string;
  if (status === 'TRANSPORT_PIN') {
    errorMessage = translate('readability_test_transport_pin', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'BLOCKED') {
    errorMessage = translate('readability_test_blocked', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'EMPTY_PIN') {
    errorMessage = translate('readability_test_empty_pin', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'DISABLED') {
    errorMessage = translate('readability_test_disabled', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else if (status === 'VERIFIABLE') {
    errorMessage = translate('readability_test_smcb_verifiable', {
      slotNr: slotNr,
      ctId: cardTerminalId,
    });
  } else {
    errorMessage = translate('readability_test_unknown_pin_status', { status: status });
  }
  return errorMessage;
}
