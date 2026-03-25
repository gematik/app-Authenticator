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

import {
  isCertificateValid,
  isDiscoveryDocumentCertificateValid,
  validateCertificate,
} from '@/renderer/modules/gem-idp/services/certificate-validation-service';
import * as verifyCertificateLauncher from '@/renderer/modules/connector/connector_impl/verify-certificate-launcher';
import { IVerifyCertificateResponse } from '@/renderer/modules/connector/type-definitions';
import { logger } from '@/renderer/service/logger';
import { DISCOVERY_DOCUMENT_ROLE } from '@/constants';

// Mock the logger
jest.mock('@/renderer/service/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the verify certificate launcher
jest.mock('@/renderer/modules/connector/connector_impl/verify-certificate-launcher', () => ({
  launch: jest.fn(),
}));

const MOCK_CERTIFICATE = 'mockCertificate';
const MOCK_VERIFICATION_TIME = '2025-01-01T00:00:00Z';

const VALID_RESPONSE: IVerifyCertificateResponse = {
  status: 'OK',
  verificationResult: 'VALID',
  roleList: [DISCOVERY_DOCUMENT_ROLE],
};

const VALID_RESPONSE_NO_ROLE: IVerifyCertificateResponse = {
  status: 'OK',
  verificationResult: 'VALID',
  roleList: [],
};

const INVALID_RESPONSE: IVerifyCertificateResponse = {
  status: 'OK',
  verificationResult: 'INVALID',
  roleList: [],
  error: {
    code: '4000',
    message: 'Certificate is invalid',
  },
};

const INCONCLUSIVE_RESPONSE: IVerifyCertificateResponse = {
  status: 'OK',
  verificationResult: 'INCONCLUSIVE',
  roleList: [],
  error: {
    code: '4001',
    message: 'Certificate validation inconclusive',
  },
};

describe('Certificate Validation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCertificate', () => {
    it('should validate a certificate successfully', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(VALID_RESPONSE);

      const result = await validateCertificate(MOCK_CERTIFICATE, MOCK_VERIFICATION_TIME);

      expect(verifyCertificateLauncher.launch).toHaveBeenCalledWith(MOCK_CERTIFICATE, MOCK_VERIFICATION_TIME);
      expect(result).toEqual(VALID_RESPONSE);
      expect(logger.debug).toHaveBeenCalledWith('Validating certificate via Konnektor VerifyCertificate endpoint');
      expect(logger.debug).toHaveBeenCalledWith(
        `Certificate validation via Konnektor VerifyCertificate endpoint result: ${VALID_RESPONSE.verificationResult}`,
      );
    });

    it('should handle certificate validation errors', async () => {
      const error = new Error('Connector error');
      (verifyCertificateLauncher.launch as jest.Mock).mockRejectedValue(error);

      await expect(validateCertificate(MOCK_CERTIFICATE)).rejects.toThrow('Connector error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error validating certificate via Konnektor VerifyCertificate endpoint',
        error.message,
      );
    });

    it('should log certificate roles when present', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(VALID_RESPONSE);

      await validateCertificate(MOCK_CERTIFICATE);

      expect(logger.debug).toHaveBeenCalledWith(`Certificate roles: ${VALID_RESPONSE.roleList.join(', ')}`);
    });

    it('should log validation errors when present', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(INVALID_RESPONSE);

      await validateCertificate(MOCK_CERTIFICATE);

      expect(logger.warn).toHaveBeenCalledWith(
        `Certificate validation via Konnektor VerifyCertificate endpoint error: ${INVALID_RESPONSE.error?.code} - ${INVALID_RESPONSE.error?.message}`,
      );
    });
  });

  describe('isCertificateValid', () => {
    it('should return true for valid certificates', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(VALID_RESPONSE);

      const result = await isCertificateValid(MOCK_CERTIFICATE);

      expect(result.isValid).toBe(true);
      expect(result.roleList).toEqual(VALID_RESPONSE.roleList);
    });

    it('should return false for invalid certificates', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(INVALID_RESPONSE);

      const result = await isCertificateValid(MOCK_CERTIFICATE);

      expect(result.isValid).toBe(false);
    });

    it('should return false for inconclusive certificates', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(INCONCLUSIVE_RESPONSE);

      const result = await isCertificateValid(MOCK_CERTIFICATE);

      expect(result.isValid).toBe(false);
    });

    it('should return false when validation throws an error', async () => {
      const error = new Error('Validation error');
      (verifyCertificateLauncher.launch as jest.Mock).mockRejectedValue(error);

      const result = await isCertificateValid(MOCK_CERTIFICATE);

      expect(result.isValid).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error checking certificate validity', error.message);
    });
  });

  describe('isDiscoveryDocumentCertificateValid', () => {
    it('should return true for a valid certificate with the correct role', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(VALID_RESPONSE);

      const result = await isDiscoveryDocumentCertificateValid(MOCK_CERTIFICATE);

      expect(result).toBe(true);
    });

    it('should return false for a valid certificate without the correct role', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(VALID_RESPONSE_NO_ROLE);

      const result = await isDiscoveryDocumentCertificateValid(MOCK_CERTIFICATE);

      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(
        `Discovery document certificate is missing role: ${DISCOVERY_DOCUMENT_ROLE}`,
      );
    });

    it('should return false for an invalid certificate', async () => {
      (verifyCertificateLauncher.launch as jest.Mock).mockResolvedValue(INVALID_RESPONSE);

      const result = await isDiscoveryDocumentCertificateValid(MOCK_CERTIFICATE);

      expect(result).toBe(false);
    });

    it('should return false when validation throws an error', async () => {
      const error = new Error('Validation error');
      (verifyCertificateLauncher.launch as jest.Mock).mockRejectedValue(error);

      const result = await isDiscoveryDocumentCertificateValid(MOCK_CERTIFICATE);

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error checking certificate validity', error.message);
    });
  });
});
