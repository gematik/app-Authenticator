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

import * as jsonwebtoken from 'jsonwebtoken';
import { validateJwtX5cCertificate } from '@/renderer/modules/gem-idp/services/jwt-x5c-validation-service';
import { UserfacingError } from '@/renderer/errors/errors';
import { logger } from '@/renderer/service/logger';
import {
  isCertificateValid,
  isDiscoveryDocumentCertificateValid,
} from '@/renderer/modules/gem-idp/services/certificate-validation-service';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn(),
}));

// Mock the certificate validation service
jest.mock('@/renderer/modules/gem-idp/services/certificate-validation-service', () => ({
  isCertificateValid: jest.fn(),
  isDiscoveryDocumentCertificateValid: jest.fn(),
}));

// Mock the logger
jest.mock('@/renderer/service/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const MOCK_CERTIFICATE =
  'MIIC+jCCAqCgAwIBAgICG3owCgYIKoZIzj0EAwIwgYQxCzAJBgNVBAYTAkRFMR8wHQYDVQQKDBZnZW1hdGlrIEdtYkggTk9ULVZBTElEMTIwMAYDVQQLDClLb21wb25lbnRlbi1DQSBkZXIgVGVsZW1hdGlraW5mcmFzdHJ1a3R1cjEgMB4GA1UEAwwXR0VNLktPTVAtQ0EyOCBURVNULU9OTFkwHhcNMjEwNTA2MTUyNzM1WhcNMjYwNTA1MTUyNzM0WjB9MQswCQYDVQQGEwJBVDEoMCYGA1UECgwfUklTRSBHbWJIIFRFU1QtT05MWSAtIE5PVC1WQUxJRDEpMCcGA1UEBRMgMzg3NzgtVjAxSTAwMDFUMjAyMTA1MDYxNDM5NTk0NDYxGTAXBgNVBAMMEGRpc2MucnUuaWRwLnJpc2UwWjAUBgcqhkjOPQIBBgkrJAMDAggBAQcDQgAElo3SbQ2crhiNRf0/w+QoPQ4q650SJuS7Y2XblWfqfF4eBozMBAkBcFP5HGZ3xuJQIY2I/0S6+JW4Bo9kzOFWyaOCAQUwggEBMB0GA1UdDgQWBBR+ezMYT4ALe6Z/iKKS6n4IrDd8kDAfBgNVHSMEGDAWgBQAajiQ85muIY9S2u7BjG6ArWEiyTBPBggrBgEFBQcBAQRDMEEwPwYIKwYBBQUHMAGGM2h0dHA6Ly9vY3NwMi10ZXN0cmVmLmtvbXAtY2EudGVsZW1hdGlrLXRlc3Qvb2NzcC9lYzAOBgNVHQ8BAf8EBAMCB4AwIQYDVR0gBBowGDAKBggqghQATASBIzAKBggqghQATASBSzAMBgNVHRMBAf8EAjAAMC0GBSskCAMDBCQwIjAgMB4wHDAaMAwMCklEUC1EaWVuc3QwCgYIKoIUAEwEggQwCgYIKoZIzj0EAwIDSAAwRQIgVJ3MmANydZeBHAshzlZeTyz0IIZj3B/4NO2ZGbjAvNcCIQCTsarcikFbR+gdSGN7jswQ2vfjGrWyXUUTxGYgCVI4Qg==';
const MOCK_JWT_WITH_X5C =
  'eyJhbGciOiJCUDI1NlIxIiwia2lkIjoicHVrX2Rpc2Nfc2lnIiwieDVjIjpbIk1JSUMrakNDQXFDZ0F3SUJBZ0lDRzNvd0NnWUlLb1pJemowRUF3SXdnWVF4Q3pBSkJnTlZCQVlUQWtSRk1SOHdIUVlEVlFRS0RCWm5aVzFoZEdscklFZHRZa2dnVGs5VUxWWkJURWxFTVRJd01BWURWUVFMRENsTGIyMXdiMjVsYm5SbGJpMURRU0JrWlhJZ1ZHVnNaVzFoZEdscmFXNW1jbUZ6ZEhKMWEzUjFjakVnTUI0R0ExVUVBd3dYUjBWTkxrdFBUVkF0UTBFeU9DQlVSVk5VTFU5T1RGa3dIaGNOTWpFd05UQTJNVFV5TnpNMVdoY05Nall3TlRBMU1UVXlOek0wV2pCOU1Rc3dDUVlEVlFRR0V3SkJWREVvTUNZR0ExVUVDZ3dmVWtsVFJTQkhiV0pJSUZSRlUxUXRUMDVNV1NBdElFNVBWQzFXUVV4SlJERXBNQ2NHQTFVRUJSTWdNemczTnpndFZqQXhTVEF3TURGVU1qQXlNVEExTURZeE5ETTVOVGswTkRZeEdUQVhCZ05WQkFNTUVHUnBjMk11Y25VdWFXUndMbkpwYzJVd1dqQVVCZ2NxaGtqT1BRSUJCZ2tySkFNREFnZ0JBUWNEUWdBRWxvM1NiUTJjcmhpTlJmMC93K1FvUFE0cTY1MFNKdVM3WTJYYmxXZnFmRjRlQm96TUJBa0JjRlA1SEdaM3h1SlFJWTJJLzBTNitKVzRCbzlrek9GV3lhT0NBUVV3Z2dFQk1CMEdBMVVkRGdRV0JCUitlek1ZVDRBTGU2Wi9pS0tTNm40SXJEZDhrREFmQmdOVkhTTUVHREFXZ0JRQWFqaVE4NW11SVk5UzJ1N0JqRzZBcldFaXlUQlBCZ2dyQmdFRkJRY0JBUVJETUVFd1B3WUlLd1lCQlFVSE1BR0dNMmgwZEhBNkx5OXZZM053TWkxMFpYTjBjbVZtTG10dmJYQXRZMkV1ZEdWc1pXMWhkR2xyTFhSbGMzUXZiMk56Y0M5bFl6QU9CZ05WSFE4QkFmOEVCQU1DQjRBd0lRWURWUjBnQkJvd0dEQUtCZ2dxZ2hRQVRBU0JJekFLQmdncWdoUUFUQVNCU3pBTUJnTlZIUk1CQWY4RUFqQUFNQzBHQlNza0NBTURCQ1F3SWpBZ01CNHdIREFhTUF3TUNrbEVVQzFFYVdWdWMzUXdDZ1lJS29JVUFFd0VnZ1F3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUlnVkozTW1BTnlkWmVCSEFzaHpsWmVUeXowSUlaajNCLzROTzJaR2JqQXZOY0NJUUNUc2FyY2lrRmJSK2dkU0dON2pzd1EydmZqR3JXeVhVVVR4R1lnQ1ZJNFFnPT0iXSwidHlwIjoiSldUIn0.eyJpYXQiOjE3NTgxMjMwMDAsImV4cCI6MTc1ODIwOTQwMCwiaXNzdWVyIjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlIiwiandrc191cmkiOiJodHRwczovL2lkcC1yZWYuYXBwLnRpLWRpZW5zdGUuZGUvY2VydHMiLCJ1cmlfZGlzYyI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS8ud2VsbC1rbm93bi9vcGVuaWQtY29uZmlndXJhdGlvbiIsImF1dGhvcml6YXRpb25fZW5kcG9pbnQiOiJodHRwczovL2lkcC1yZWYuYXBwLnRpLWRpZW5zdGUuZGUvYXV0aCIsInNzb19lbmRwb2ludCI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS9hdXRoL3Nzb19yZXNwb25zZSIsInRva2VuX2VuZHBvaW50IjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlL3Rva2VuIiwiYXV0aF9wYWlyX2VuZHBvaW50IjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlL2F1dGgvYWx0ZXJuYXRpdmUiLCJ1cmlfcGFpciI6Imh0dHBzOi8vaWRwLXBhaXJpbmctcmVmLnplbnRyYWwuaWRwLnNwbGl0ZG5zLnRpLWRpZW5zdGUuZGUvcGFpcmluZ3MiLCJmZWRfaWRwX2xpc3RfdXJpIjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlL2RpcmVjdG9yeS9mZWRfaWRwX2xpc3QiLCJmZWRlcmF0aW9uX2F1dGhvcml6YXRpb25fZW5kcG9pbnQiOiJodHRwczovL2lkcC1yZWYuYXBwLnRpLWRpZW5zdGUuZGUvZmVkYXV0aCIsInVyaV9wdWtfaWRwX2VuYyI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS9jZXJ0cy9wdWtfaWRwX2VuYyIsInVyaV9wdWtfaWRwX3NpZyI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS9jZXJ0cy9wdWtfaWRwX3NpZyIsImNvZGVfY2hhbGxlbmdlX21ldGhvZHNfc3VwcG9ydGVkIjpbIlMyNTYiXSwicmVzcG9uc2VfdHlwZXNfc3VwcG9ydGVkIjpbImNvZGUiXSwiZ3JhbnRfdHlwZXNfc3VwcG9ydGVkIjpbImF1dGhvcml6YXRpb25fY29kZSJdLCJpZF90b2tlbl9zaWduaW5nX2FsZ192YWx1ZXNfc3VwcG9ydGVkIjpbIkJQMjU2UjEiXSwiYWNyX3ZhbHVlc19zdXBwb3J0ZWQiOlsiZ2VtYXRpay1laGVhbHRoLWxvYS1oaWdoIl0sInJlc3BvbnNlX21vZGVzX3N1cHBvcnRlZCI6WyJxdWVyeSJdLCJ0b2tlbl9lbmRwb2ludF9hdXRoX21ldGhvZHNfc3VwcG9ydGVkIjpbIm5vbmUiXSwic2NvcGVzX3N1cHBvcnRlZCI6WyJvcGVuaWQiLCJlLXJlemVwdCIsImUtcmV6ZXB0LWRldiIsImVQQS1QUy1nZW10ayIsImVQQS1ibXQtcXQiLCJlUEEtYm10LXF1IiwiZVBBLWJtdC1ydCIsImVQQS1ibXQtcnUiLCJlUEEtaWJtLXJ1LWludCIsImVQQS1pYm0xIiwiZVBBLWlibTIiLCJlYnRtLWJkciIsImVidG0tYmRyMiIsImZoLWZva3VzLWRlbWlzIiwiZmhpci12emQiLCJnZW0tYXV0aCIsImdtdGlrLWRlbWlzIiwiZ210aWstZGVtaXMtZmtiIiwiZ210aWstZGVtaXMtZnJhIiwiZ210aWstZGVtaXMtcXMiLCJnbXRpay1kZW1pcy1yZWYiLCJnbXRpay1kZW1pcy1ydS10ZXN0IiwiZ210aWstZmhpcmRpcmVjdG9yeS1zc3AiLCJnbXRpay16ZXJvdHJ1c3QtcG9jIiwiaXJkLWJtZyIsImt2c2gtb3B0Iiwib2dyLW5leGVuaW8tZGVtbyIsIm9nci1uZXhlbmlvLWRldiIsIm9nci1uZXhlbmlvLXByZXByb2QiLCJvZ3ItbmV4ZW5pby10ZXN0Iiwib3JnYW5zcGVuZGUtcmVnaXN0ZXIiLCJwYWlyaW5nIiwicnBkb2MtZW1tYSIsInJwZG9jLWVtbWEtcGhhYiIsInRpLW1lc3NlbmdlciIsInRpLXNjb3JlIiwidGktc2NvcmUyIiwienZyLWJub3RrIl0sInN1YmplY3RfdHlwZXNfc3VwcG9ydGVkIjpbInBhaXJ3aXNlIl19.e96KBP0N0lVOX3rzstN7AbPw5pD52ic8doIMSLGQK3mLhiBzLl9nCzOOG_HCrMLmc_Jt2ML0WJg7RerizLiBCQ';
const MOCK_JWT_WITHOUT_X5C =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NTgxMjMwMDAsImV4cCI6MTc1ODIwOTQwMCwiaXNzdWVyIjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlIiwiandrc191cmkiOiJodHRwczovL2lkcC1yZWYuYXBwLnRpLWRpZW5zdGUuZGUvY2VydHMiLCJ1cmlfZGlzYyI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS8ud2VsbC1rbm93bi9vcGVuaWQtY29uZmlndXJhdGlvbiIsImF1dGhvcml6YXRpb25fZW5kcG9pbnQiOiJodHRwczovL2lkcC1yZWYuYXBwLnRpLWRpZW5zdGUuZGUvYXV0aCIsInNzb19lbmRwb2ludCI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS9hdXRoL3Nzb19yZXNwb25zZSIsInRva2VuX2VuZHBvaW50IjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlL3Rva2VuIiwiYXV0aF9wYWlyX2VuZHBvaW50IjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlL2F1dGgvYWx0ZXJuYXRpdmUiLCJ1cmlfcGFpciI6Imh0dHBzOi8vaWRwLXBhaXJpbmctcmVmLnplbnRyYWwuaWRwLnNwbGl0ZG5zLnRpLWRpZW5zdGUuZGUvcGFpcmluZ3MiLCJmZWRfaWRwX2xpc3RfdXJpIjoiaHR0cHM6Ly9pZHAtcmVmLmFwcC50aS1kaWVuc3RlLmRlL2RpcmVjdG9yeS9mZWRfaWRwX2xpc3QiLCJmZWRlcmF0aW9uX2F1dGhvcml6YXRpb25fZW5kcG9pbnQiOiJodHRwczovL2lkcC1yZWYuYXBwLnRpLWRpZW5zdGUuZGUvZmVkYXV0aCIsInVyaV9wdWtfaWRwX2VuYyI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS9jZXJ0cy9wdWtfaWRwX2VuYyIsInVyaV9wdWtfaWRwX3NpZyI6Imh0dHBzOi8vaWRwLXJlZi5hcHAudGktZGllbnN0ZS5kZS9jZXJ0cy9wdWtfaWRwX3NpZyIsImNvZGVfY2hhbGxlbmdlX21ldGhvZHNfc3VwcG9ydGVkIjpbIlMyNTYiXSwicmVzcG9uc2VfdHlwZXNfc3VwcG9ydGVkIjpbImNvZGUiXSwiZ3JhbnRfdHlwZXNfc3VwcG9ydGVkIjpbImF1dGhvcml6YXRpb25fY29kZSJdLCJpZF90b2tlbl9zaWduaW5nX2FsZ192YWx1ZXNfc3VwcG9ydGVkIjpbIkJQMjU2UjEiXSwiYWNyX3ZhbHVlc19zdXBwb3J0ZWQiOlsiZ2VtYXRpay1laGVhbHRoLWxvYS1oaWdoIl0sInJlc3BvbnNlX21vZGVzX3N1cHBvcnRlZCI6WyJxdWVyeSJdLCJ0b2tlbl9lbmRwb2ludF9hdXRoX21ldGhvZHNfc3VwcG9ydGVkIjpbIm5vbmUiXSwic2NvcGVzX3N1cHBvcnRlZCI6WyJvcGVuaWQiLCJlLXJlemVwdCIsImUtcmV6ZXB0LWRldiIsImVQQS1QUy1nZW10ayIsImVQQS1ibXQtcXQiLCJlUEEtYm10LXF1IiwiZVBBLWJtdC1ydCIsImVQQS1ibXQtcnUiLCJlUEEtaWJtLXJ1LWludCIsImVQQS1pYm0xIiwiZVBBLWlibTIiLCJlYnRtLWJkciIsImVidG0tYmRyMiIsImZoLWZva3VzLWRlbWlzIiwiZmhpci12emQiLCJnZW0tYXV0aCIsImdtdGlrLWRlbWlzIiwiZ210aWstZGVtaXMtZmtiIiwiZ210aWstZGVtaXMtZnJhIiwiZ210aWstZGVtaXMtcXMiLCJnbXRpay1kZW1pcy1yZWYiLCJnbXRpay1kZW1pcy1ydS10ZXN0IiwiZ210aWstZmhpcmRpcmVjdG9yeS1zc3AiLCJnbXRpay16ZXJvdHJ1c3QtcG9jIiwiaXJkLWJtZyIsImt2c2gtb3B0Iiwib2dyLW5leGVuaW8tZGVtbyIsIm9nci1uZXhlbmlvLWRldiIsIm9nci1uZXhlbmlvLXByZXByb2QiLCJvZ3ItbmV4ZW5pby10ZXN0Iiwib3JnYW5zcGVuZGUtcmVnaXN0ZXIiLCJwYWlyaW5nIiwicnBkb2MtZW1tYSIsInJwZG9jLWVtbWEtcGhhYiIsInRpLW1lc3NlbmdlciIsInRpLXNjb3JlIiwidGktc2NvcmUyIiwienZyLWJub3RrIl0sInN1YmplY3RfdHlwZXNfc3VwcG9ydGVkIjpbInBhaXJ3aXNlIl19.e96KBP0N0lVOX3rzstN7AbPw5pD52ic8doIMSLGQK3mLhiBzLl9nCzOOG_HCrMLmc_Jt2ML0WJg7RerizLiBCQ';

const MOCK_DECODED_WITH_X5C = {
  header: {
    x5c: [MOCK_CERTIFICATE],
  },
  payload: {},
};

const MOCK_DECODED_WITHOUT_X5C = {
  header: {},
  payload: {},
};

describe('JWT x5c Validation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jsonwebtoken.decode as jest.Mock).mockImplementation((token, options) => {
      if (options && options.complete === true) {
        return token === MOCK_JWT_WITH_X5C ? MOCK_DECODED_WITH_X5C : MOCK_DECODED_WITHOUT_X5C;
      }
      return null;
    });
  });

  describe('validateJwtX5cCertificate', () => {
    it('should validate x5c certificate when present in JWT', async () => {
      (isCertificateValid as jest.Mock).mockResolvedValue({ isValid: true, roleList: [] });

      await validateJwtX5cCertificate(MOCK_JWT_WITH_X5C, 'Test Context');

      expect(isCertificateValid).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(logger.debug).toHaveBeenCalledWith('Validating x5c certificate from Test Context');
      expect(logger.debug).toHaveBeenCalledWith('x5c certificate validation successful for Test Context');
    });

    it('should throw UserfacingError when x5c certificate validation fails', async () => {
      (isCertificateValid as jest.Mock).mockResolvedValue({ isValid: false, roleList: [] });

      await expect(validateJwtX5cCertificate(MOCK_JWT_WITH_X5C, 'Test Context')).rejects.toThrow(UserfacingError);

      expect(isCertificateValid).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(logger.error).toHaveBeenCalledWith('x5c certificate validation failed for Test Context');
    });

    it('should throw UserfacingError when JWT does not contain x5c certificate', async () => {
      await expect(validateJwtX5cCertificate(MOCK_JWT_WITHOUT_X5C, 'Test Context')).rejects.toThrow(UserfacingError);

      expect(isCertificateValid).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('No x5c certificate found in JWT token from Test Context');
    });

    it('should call isDiscoveryDocumentCertificateValid when isDiscoveryDoc is true', async () => {
      (isDiscoveryDocumentCertificateValid as jest.Mock).mockResolvedValue(true);

      await validateJwtX5cCertificate(MOCK_JWT_WITH_X5C, 'Test Context', true);

      expect(isDiscoveryDocumentCertificateValid).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(isCertificateValid).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('x5c certificate validation successful for Test Context');
    });

    it('should throw UserfacingError when discovery doc validation fails', async () => {
      (isDiscoveryDocumentCertificateValid as jest.Mock).mockResolvedValue(false);

      await expect(validateJwtX5cCertificate(MOCK_JWT_WITH_X5C, 'Test Context', true)).rejects.toThrow(UserfacingError);

      expect(isDiscoveryDocumentCertificateValid).toHaveBeenCalledWith(MOCK_CERTIFICATE);
      expect(logger.error).toHaveBeenCalledWith('x5c certificate validation failed for Test Context');
    });

    it('should re-throw UserfacingError on validation error', async () => {
      const errorMessage = 'test error';
      (isCertificateValid as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(validateJwtX5cCertificate(MOCK_JWT_WITH_X5C, 'Test Context')).rejects.toThrow(UserfacingError);
      expect(logger.warn).toHaveBeenCalledWith('Could not validate x5c certificate from Test Context:', errorMessage);
    });
  });
});
