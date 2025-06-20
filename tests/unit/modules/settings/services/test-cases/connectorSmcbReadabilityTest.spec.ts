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

jest.spyOn(window.api, 'sendSync').mockReturnValue(JSON.stringify(process.env));

import { getPinStatus } from '@/renderer/modules/connector/connector_impl/check-pin-status';
import { logger } from '@/renderer/service/logger';
import { ERROR_CODES } from '@/error-codes';
import { ConnectorError } from '@/renderer/errors/errors';
import { connectorSmcbReadabilityTest } from '@/renderer/modules/settings/services/test-cases/connector-smcb-readability';
import { launch as getCards } from '@/renderer/modules/connector/connector_impl/get-cards-launcher';

// Mock modules
jest.mock('@/renderer/modules/connector/connector_impl/get-cards-launcher');
jest.mock('@/renderer/modules/connector/connector_impl/check-pin-status');
jest.mock('@/renderer/service/logger');

const mockedGetCards = getCards as jest.Mock;
const mockedGetPinStatus = getPinStatus as jest.Mock;
const mockedLoggerDebug = logger.debug as jest.Mock;

describe('connectorSmcbReadabilityTest', () => {
  const mockCardInfo = {
    cardHandle: 'handle',
    slotNr: '1',
    ctId: '1234',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return failure if pinStatus is not VERIFIED', async () => {
    mockedGetCards.mockResolvedValue(mockCardInfo);
    mockedGetPinStatus.mockResolvedValue({ pinStatus: 'TRANSPORT_PIN' });

    const result = await connectorSmcbReadabilityTest();

    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'SMC-B Verfügbarkeit',
      status: 'failure',
      details:
        'Ihre Karte in Slot 1 vom Kartenterminal 1234 ist noch mit einer Transport-PIN belegt. Wandeln Sie diesen in einen eigenen PIN um',
    });
  });

  it('should return success if pinStatus is VERIFIED', async () => {
    mockedGetCards.mockResolvedValue(mockCardInfo);
    mockedGetPinStatus.mockResolvedValue({ pinStatus: 'VERIFIED' });

    const result = await connectorSmcbReadabilityTest();

    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'SMC-B Verfügbarkeit',
      status: 'success',
      details: 'SMC-B in Slot 1 vom Kartenterminal 1234 gefunden',
    });
  });

  it('should handle ERROR_CODES.AUTHCL_1105 and return success', async () => {
    const error = new ConnectorError('Multiple SMCBs found');
    error.code = ERROR_CODES.AUTHCL_1105;

    mockedGetCards.mockRejectedValue(error);

    const result = await connectorSmcbReadabilityTest();

    expect(mockedLoggerDebug).toHaveBeenCalledWith('Multiple SMCBs found, no error');
    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'SMC-B Verfügbarkeit',
      status: 'success',
      details: 'Mehrere SMC-Bs im Karten-Terminal gefunden',
    });
  });

  it('should handle other ConnectorError and return failure', async () => {
    const error = new ConnectorError('Test Connector Error');
    error.code = 'SOME_CODE';
    error.message = 'Test Connector Error';
    error.description = 'Test Connector Error Description';

    mockedGetCards.mockRejectedValue(error);

    const result = await connectorSmcbReadabilityTest();

    expect(mockedLoggerDebug).toHaveBeenCalledWith('Test Connector Error');
    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'SMC-B Verfügbarkeit',
      status: 'failure',
      details: 'Fehler: SOME_CODE, Test Connector Error Description ',
    });
  });

  it('should handle generic errors and return failure', async () => {
    const error = new Error('Generic Error');

    mockedGetCards.mockRejectedValue(error);

    const result = await connectorSmcbReadabilityTest();

    expect(mockedLoggerDebug).toHaveBeenCalledWith('Generic Error');
    expect(result).toEqual({
      title: 'Allgemeiner Funktionstest',
      name: 'SMC-B Verfügbarkeit',
      status: 'failure',
      details: 'Fehler: Generic Error ',
    });
  });
});
