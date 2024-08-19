jest.spyOn(window.api, 'sendSync').mockReturnValue(JSON.stringify(process.env));

import { launch as getCards } from '@/renderer/modules/connector/connector_impl/get-cards-launcher';
import { getPinStatus } from '@/renderer/modules/connector/connector_impl/check-pin-status';
import { logger } from '@/renderer/service/logger';
import { ERROR_CODES } from '@/error-codes';
import { ConnectorError } from '@/renderer/errors/errors';
import { connectorHbaReadabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-hba-readability';

// Mock modules
jest.mock('@/renderer/modules/connector/connector_impl/get-cards-launcher');
jest.mock('@/renderer/modules/connector/connector_impl/check-pin-status');
jest.mock('@/renderer/service/logger');

const mockedGetCards = getCards as jest.Mock;
const mockedGetPinStatus = getPinStatus as jest.Mock;
const mockedLoggerDebug = logger.debug as jest.Mock;

describe('connectorHbaReadabilityTest', () => {
  const mockCardInfo = {
    cardHandle: 'handle',
    slotNr: '1',
    ctId: '1234',
    iccsn: 'iccsn',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure if pinStatus is not VERIFIED or VERIFIABLE', async () => {
    mockedGetCards.mockResolvedValue(mockCardInfo);
    mockedGetPinStatus.mockResolvedValue({ pinStatus: 'TRANSPORT_PIN', status: 'TRANSPORT_PIN' });

    const result = await connectorHbaReadabilityTest();

    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'HBA Verfügbarkeit',
      status: 'failure',
      details:
        'Ihre Karte in Slot 1 vom Kartenterminal 1234 ist noch mit einer Transport-PIN belegt. Wandeln Sie diesen in einen eigenen PIN um',
    });
  });

  it('should return success if pinStatus is VERIFIED', async () => {
    mockedGetCards.mockResolvedValue(mockCardInfo);
    mockedGetPinStatus.mockResolvedValue({ pinStatus: 'VERIFIED' });

    const result = await connectorHbaReadabilityTest();

    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'HBA Verfügbarkeit',
      status: 'success',
      details: 'HBA in Slot 1 vom Kartenterminal 1234 gefunden',
    });
  });

  it('should return success if pinStatus is VERIFIABLE', async () => {
    mockedGetCards.mockResolvedValue(mockCardInfo);
    mockedGetPinStatus.mockResolvedValue({ pinStatus: 'VERIFIABLE' });

    const result = await connectorHbaReadabilityTest();

    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'HBA Verfügbarkeit',
      status: 'success',
      details: 'HBA in Slot 1 vom Kartenterminal 1234 gefunden',
    });
  });

  it('should handle ERROR_CODES.AUTHCL_1105 and return success', async () => {
    const error = new ConnectorError('Multiple HBAs found');
    error.code = ERROR_CODES.AUTHCL_1105;

    mockedGetCards.mockRejectedValue(error);

    const result = await connectorHbaReadabilityTest();

    expect(mockedLoggerDebug).toHaveBeenCalledWith('Multiple HBA found, no error');
    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'HBA Verfügbarkeit',
      status: 'success',
      details: 'Mehrere HBAs im Karten-Terminal gefunden',
    });
  });

  it('should handle other ConnectorError and return warning', async () => {
    const error = new ConnectorError('Test Connector Error');
    error.code = 'SOME_CODE';
    error.message = 'Test Connector Error';
    error.description = 'Test Connector Error Description';

    mockedGetCards.mockRejectedValue(error);

    const result = await connectorHbaReadabilityTest();

    expect(mockedLoggerDebug).toHaveBeenCalledWith('Test Connector Error');
    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'HBA Verfügbarkeit',
      status: 'warning',
      details:
        'Hinweis: Es wurde keine HBA im Kartenterminal gefunden. Sie können dies ignorieren, wenn Sie für die Fachanwendung keinen HBA benötigen',
    });
  });

  it('should handle generic errors and return warning', async () => {
    const error = new Error('Generic Error');

    mockedGetCards.mockRejectedValue(error);

    const result = await connectorHbaReadabilityTest();

    expect(mockedLoggerDebug).toHaveBeenCalledWith('Generic Error');
    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'HBA Verfügbarkeit',
      status: 'warning',
      details: 'Hinweis: Generic Error ',
    });
  });
});
