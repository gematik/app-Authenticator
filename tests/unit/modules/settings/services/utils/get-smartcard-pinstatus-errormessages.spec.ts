import { getErrorMessage } from '@/renderer/modules/settings/services/utils/get-smartcard-pinstatus-errormessages';

describe('getErrorMessage', () => {
  const slotNr = '1';
  const cardTerminalId = '1234';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct message for TRANSPORT_PIN status', () => {
    const result = getErrorMessage('TRANSPORT_PIN', slotNr, cardTerminalId);

    expect(result).toBe(
      'Ihre Karte in Slot 1 vom Kartenterminal 1234 ist noch mit einer Transport-PIN belegt. Wandeln Sie diesen in einen eigenen PIN um',
    );
  });

  it('should return the correct message for BLOCKED status', () => {
    const result = getErrorMessage('BLOCKED', slotNr, cardTerminalId);

    expect(result).toBe(
      'Ihre Karte in Slot 1 vom Kartenterminal 1234 ist blockiert oder durch mehrfache Eingabe einer falschen PIN gesperrt',
    );
  });

  it('should return the correct message for EMPTY_PIN status', () => {
    const result = getErrorMessage('EMPTY_PIN', slotNr, cardTerminalId);

    expect(result).toBe('Ihre Karte in Slot 1 vom Kartenterminal 1234 hat keinen vergebenen PIN');
  });

  it('should return the correct message for DISABLED status', () => {
    const result = getErrorMessage('DISABLED', slotNr, cardTerminalId);

    expect(result).toBe(
      'Ihre Karte in Slot 1 vom Kartenterminal 1234 hat keinen PIN-Schutz. Bitte vergeben Sie für eine sichere Nutzung Ihrer Karte einen PIN',
    );
  });

  it('should return the correct message for VERIFIABLE status', () => {
    const result = getErrorMessage('VERIFIABLE', slotNr, cardTerminalId);

    expect(result).toBe(
      'Ihre SMC-B Karte in Slot 1 vom Kartenterminal 1234 ist nicht freigeschaltet. Bitte schalten Sie diese in Ihrem Kartenverwaltungssystem frei und starten Sie die Funktionstest erneut',
    );
  });

  it('should return the correct message for unknown status', () => {
    const result = getErrorMessage('UNKNOWN_STATUS', slotNr, cardTerminalId);

    expect(result).toBe('Unbekannter PIN Status: $UNKNOWN_STATUS');
  });
});
