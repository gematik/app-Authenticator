/*
 * Copyright 2026, gematik GmbH
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

/**
 * @jest-environment node
 */

import { createUnsignedJws } from '@/renderer/modules/gem-idp/services/signing-service';
import * as certificateValidationService from '@/renderer/modules/gem-idp/services/certificate-validation-service';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { ENCRYPTION_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';

// Mock the certificate validation service
jest.mock('@/renderer/modules/gem-idp/services/certificate-validation-service', () => ({
  isCertificateValid: jest.fn(),
}));

const MOCK_CARD_CERTIFICATE = 'mockCardCertificate';
const MOCK_CHALLENGE = 'mockChallenge';

describe('Signing Service with Certificate Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create unsigned JWS when certificate is valid', async () => {
    (certificateValidationService.isCertificateValid as jest.Mock).mockResolvedValue(true);

    const result = await createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE);

    expect(certificateValidationService.isCertificateValid).toHaveBeenCalledWith(MOCK_CARD_CERTIFICATE);
    expect(result).toHaveProperty('header');
    expect(result).toHaveProperty('payload');
    expect(result).toHaveProperty('hashedChallenge');
  });

  it('should throw UserfacingError when certificate is invalid', async () => {
    (certificateValidationService.isCertificateValid as jest.Mock).mockResolvedValue(false);

    await expect(createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE)).rejects.toThrow(UserfacingError);

    await expect(createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE)).rejects.toThrow(
      'The provided certificate is not valid',
    );

    try {
      await createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE);
    } catch (error) {
      expect(error).toBeInstanceOf(UserfacingError);
      expect(error.code).toBe(ERROR_CODES.AUTHCL_0004);
    }
  });

  it('should throw UserfacingError when certificate validation throws an error', async () => {
    const validationError = new Error('Validation failed');
    (certificateValidationService.isCertificateValid as jest.Mock).mockRejectedValue(validationError);

    await expect(createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE)).rejects.toThrow(UserfacingError);

    try {
      await createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE);
    } catch (error) {
      expect(error).toBeInstanceOf(UserfacingError);
      expect(error.code).toBe(ERROR_CODES.AUTHCL_0003);
    }
  });

  it('should handle RSA signature type correctly', async () => {
    (certificateValidationService.isCertificateValid as jest.Mock).mockResolvedValue(true);
    ConnectorConfig.setAuthSignParameter({ signatureType: SIGNATURE_TYPES.RSA });

    const result = await createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE);

    const header = JSON.parse(Buffer.from(result.header, 'base64').toString('utf8'));
    expect(header.alg).toBe(ENCRYPTION_TYPES.RSASSA_PSS_USING_SHA256);
  });

  it('should handle ECC signature type correctly', async () => {
    (certificateValidationService.isCertificateValid as jest.Mock).mockResolvedValue(true);
    ConnectorConfig.setAuthSignParameter({ signatureType: SIGNATURE_TYPES.ECC });

    const result = await createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE);

    const header = JSON.parse(Buffer.from(result.header, 'base64').toString('utf8'));
    expect(header.alg).toBe(ENCRYPTION_TYPES.ECC_ALG_SHA256);
  });
});
