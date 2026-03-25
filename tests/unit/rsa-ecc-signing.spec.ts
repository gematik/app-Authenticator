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
import { convertDerToConcatenated, createUnsignedJws } from '@/renderer/modules/gem-idp/services/signing-service';
import { ENCRYPTION_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import * as certificateValidationService from '@/renderer/modules/gem-idp/services/certificate-validation-service';

const MOCK_CARD_CERTIFICATE =
  'MIIC+jCCAqCgAwIBAgICG3owCgYIKoZIzj0EAwIwgYQxCzAJBgNVBAYTAkRFMR8wHQYDVQQKDBZnZW1hdGlrIEdtYkggTk9ULVZBTElEMTIwMAYDVQQLDClLb21wb25lbnRlbi1DQSBkZXIgVGVsZW1hdGlraW5mcmFzdHJ1a3R1cjEgMB4GA1UEAwwXR0VNLktPTVAtQ0EyOCBURVNULU9OTFkwHhcNMjEwNTA2MTUyNzM1WhcNMjYwNTA1MTUyNzM0WjB9MQswCQYDVQQGEwJBVDEoMCYGA1UECgwfUklTRSBHbWJIIFRFU1QtT05MWSAtIE5PVC1WQUxJRDEpMCcGA1UEBRMgMzg3NzgtVjAxSTAwMDFUMjAyMTA1MDYxNDM5NTk0NDYxGTAXBgNVBAMMEGRpc2MucnUuaWRwLnJpc2UwWjAUBgcqhkjOPQIBBgkrJAMDAggBAQcDQgAElo3SbQ2crhiNRf0/w+QoPQ4q650SJuS7Y2XblWfqfF4eBozMBAkBcFP5HGZ3xuJQIY2I/0S6+JW4Bo9kzOFWyaOCAQUwggEBMB0GA1UdDgQWBBR+ezMYT4ALe6Z/iKKS6n4IrDd8kDAfBgNVHSMEGDAWgBQAajiQ85muIY9S2u7BjG6ArWEiyTBPBggrBgEFBQcBAQRDMEEwPwYIKwYBBQUHMAGGM2h0dHA6Ly9vY3NwMi10ZXN0cmVmLmtvbXAtY2EudGVsZW1hdGlrLXRlc3Qvb2NzcC9lYzAOBgNVHQ8BAf8EBAMCB4AwIQYDVR0gBBowGDAKBggqghQATASBIzAKBggqghQATASBSzAMBgNVHRMBAf8EAjAAMC0GBSskCAMDBCQwIjAgMB4wHDAaMAwMCklEUC1EaWVuc3QwCgYIKoIUAEwEggQwCgYIKoZIzj0EAwIDSAAwRQIgVJ3MmANydZeBHAshzlZeTyz0IIZj3B/4NO2ZGbjAvNcCIQCTsarcikFbR+gdSGN7jswQ2vfjGrWyXUUTxGYgCVI4Qg==';
const MOCK_CHALLENGE = 'mockChallenge';

const runTest = async (signatureType: SIGNATURE_TYPES, expectedAlg: string, expectedResponse: any) => {
  ConnectorConfig.setAuthSignParameter({ signatureType });

  const result = await createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE);

  expect(result).toEqual(expectedResponse);

  const header = JSON.parse(Buffer.from(result.header, 'base64').toString('utf8'));
  expect(header.alg).toBe(expectedAlg);
  expect(header.x5c).toEqual([MOCK_CARD_CERTIFICATE]);
};

describe('RSA and ECC Signing', () => {
  let mockDigest: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    if (mockDigest) {
      mockDigest.mockRestore();
    }
  });

  it('should create an unsigned JWS with ECC', async () => {
    jest.spyOn(certificateValidationService, 'isCertificateValid').mockResolvedValue({ isValid: true, roleList: [] });
    await runTest(SIGNATURE_TYPES.ECC, ENCRYPTION_TYPES.ECC_ALG_SHA256, {
      hashedChallenge: 'PyV6zZ4HaRagPBiXZtMmNrpJXJt5FS/9MaQX6P34+jU=',
      header:
        'eyJhbGciOiJCUDI1NlIxIiwieDVjIjpbIk1JSUMrakNDQXFDZ0F3SUJBZ0lDRzNvd0NnWUlLb1pJemowRUF3SXdnWVF4Q3pBSkJnTlZCQVlUQWtSRk1SOHdIUVlEVlFRS0RCWm5aVzFoZEdscklFZHRZa2dnVGs5VUxWWkJURWxFTVRJd01BWURWUVFMRENsTGIyMXdiMjVsYm5SbGJpMURRU0JrWlhJZ1ZHVnNaVzFoZEdscmFXNW1jbUZ6ZEhKMWEzUjFjakVnTUI0R0ExVUVBd3dYUjBWTkxrdFBUVkF0UTBFeU9DQlVSVk5VTFU5T1RGa3dIaGNOTWpFd05UQTJNVFV5TnpNMVdoY05Nall3TlRBMU1UVXlOek0wV2pCOU1Rc3dDUVlEVlFRR0V3SkJWREVvTUNZR0ExVUVDZ3dmVWtsVFJTQkhiV0pJSUZSRlUxUXRUMDVNV1NBdElFNVBWQzFXUVV4SlJERXBNQ2NHQTFVRUJSTWdNemczTnpndFZqQXhTVEF3TURGVU1qQXlNVEExTURZeE5ETTVOVGswTkRZeEdUQVhCZ05WQkFNTUVHUnBjMk11Y25VdWFXUndMbkpwYzJVd1dqQVVCZ2NxaGtqT1BRSUJCZ2tySkFNREFnZ0JBUWNEUWdBRWxvM1NiUTJjcmhpTlJmMC93K1FvUFE0cTY1MFNKdVM3WTJYYmxXZnFmRjRlQm96TUJBa0JjRlA1SEdaM3h1SlFJWTJJLzBTNitKVzRCbzlrek9GV3lhT0NBUVV3Z2dFQk1CMEdBMVVkRGdRV0JCUitlek1ZVDRBTGU2Wi9pS0tTNm40SXJEZDhrREFmQmdOVkhTTUVHREFXZ0JRQWFqaVE4NW11SVk5UzJ1N0JqRzZBcldFaXlUQlBCZ2dyQmdFRkJRY0JBUVJETUVFd1B3WUlLd1lCQlFVSE1BR0dNMmgwZEhBNkx5OXZZM053TWkxMFpYTjBjbVZtTG10dmJYQXRZMkV1ZEdWc1pXMWhkR2xyTFhSbGMzUXZiMk56Y0M5bFl6QU9CZ05WSFE4QkFmOEVCQU1DQjRBd0lRWURWUjBnQkJvd0dEQUtCZ2dxZ2hRQVRBU0JJekFLQmdncWdoUUFUQVNCU3pBTUJnTlZIUk1CQWY4RUFqQUFNQzBHQlNza0NBTURCQ1F3SWpBZ01CNHdIREFhTUF3TUNrbEVVQzFFYVdWdWMzUXdDZ1lJS29JVUFFd0VnZ1F3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUlnVkozTW1BTnlkWmVCSEFzaHpsWmVUeXowSUlaajNCLzROTzJaR2JqQXZOY0NJUUNUc2FyY2lrRmJSK2dkU0dON2pzd1EydmZqR3JXeVhVVVR4R1lnQ1ZJNFFnPT0iXSwidHlwIjoiSldUIiwiY3R5IjoiTkpXVCJ9',
      payload: 'eyJuand0IjoibW9ja0NoYWxsZW5nZSJ9',
    });
  });

  it('should create an unsigned JWS with RSA', async () => {
    jest.spyOn(certificateValidationService, 'isCertificateValid').mockResolvedValue({ isValid: true, roleList: [] });
    await runTest(SIGNATURE_TYPES.RSA, ENCRYPTION_TYPES.RSASSA_PSS_USING_SHA256, {
      hashedChallenge: 'bnzFtXFP2mwX9gZxFWCUzRPKfDuRUxLUoI0jAn2V0rg=',
      header:
        'eyJhbGciOiJQUzI1NiIsIng1YyI6WyJNSUlDK2pDQ0FxQ2dBd0lCQWdJQ0czb3dDZ1lJS29aSXpqMEVBd0l3Z1lReEN6QUpCZ05WQkFZVEFrUkZNUjh3SFFZRFZRUUtEQlpuWlcxaGRHbHJJRWR0WWtnZ1RrOVVMVlpCVEVsRU1USXdNQVlEVlFRTERDbExiMjF3YjI1bGJuUmxiaTFEUVNCa1pYSWdWR1ZzWlcxaGRHbHJhVzVtY21GemRISjFhM1IxY2pFZ01CNEdBMVVFQXd3WFIwVk5Ma3RQVFZBdFEwRXlPQ0JVUlZOVUxVOU9URmt3SGhjTk1qRXdOVEEyTVRVeU56TTFXaGNOTWpZd05UQTFNVFV5TnpNMFdqQjlNUXN3Q1FZRFZRUUdFd0pCVkRFb01DWUdBMVVFQ2d3ZlVrbFRSU0JIYldKSUlGUkZVMVF0VDA1TVdTQXRJRTVQVkMxV1FVeEpSREVwTUNjR0ExVUVCUk1nTXpnM056Z3RWakF4U1RBd01ERlVNakF5TVRBMU1EWXhORE01TlRrME5EWXhHVEFYQmdOVkJBTU1FR1JwYzJNdWNuVXVhV1J3TG5KcGMyVXdXakFVQmdjcWhrak9QUUlCQmdrckpBTURBZ2dCQVFjRFFnQUVsbzNTYlEyY3JoaU5SZjAvdytRb1BRNHE2NTBTSnVTN1kyWGJsV2ZxZkY0ZUJvek1CQWtCY0ZQNUhHWjN4dUpRSVkySS8wUzYrSlc0Qm85a3pPRld5YU9DQVFVd2dnRUJNQjBHQTFVZERnUVdCQlIrZXpNWVQ0QUxlNlovaUtLUzZuNElyRGQ4a0RBZkJnTlZIU01FR0RBV2dCUUFhamlRODVtdUlZOVMydTdCakc2QXJXRWl5VEJQQmdnckJnRUZCUWNCQVFSRE1FRXdQd1lJS3dZQkJRVUhNQUdHTTJoMGRIQTZMeTl2WTNOd01pMTBaWE4wY21WbUxtdHZiWEF0WTJFdWRHVnNaVzFoZEdsckxYUmxjM1F2YjJOemNDOWxZekFPQmdOVkhROEJBZjhFQkFNQ0I0QXdJUVlEVlIwZ0JCb3dHREFLQmdncWdoUUFUQVNCSXpBS0JnZ3FnaFFBVEFTQlN6QU1CZ05WSFJNQkFmOEVBakFBTUMwR0JTc2tDQU1EQkNRd0lqQWdNQjR3SERBYU1Bd01Da2xFVUMxRWFXVnVjM1F3Q2dZSUtvSVVBRXdFZ2dRd0NnWUlLb1pJemowRUF3SURTQUF3UlFJZ1ZKM01tQU55ZFplQkhBc2h6bFplVHl6MElJWmozQi80Tk8yWkdiakF2TmNDSVFDVHNhcmNpa0ZiUitnZFNHTjdqc3dRMnZmakdyV3lYVVVUeEdZZ0NWSTRRZz09Il0sInR5cCI6IkpXVCIsImN0eSI6Ik5KV1QifQ',
      payload: 'eyJuand0IjoibW9ja0NoYWxsZW5nZSJ9',
    });
  });

  it('should throw an error when creating an unsigned JWS fails', async () => {
    jest.spyOn(certificateValidationService, 'isCertificateValid').mockResolvedValue({ isValid: true, roleList: [] });
    const mockError = new Error('JWS hashing failed');
    mockDigest = jest.spyOn(window.crypto.subtle, 'digest').mockImplementation(() => {
      throw mockError;
    });

    await expect(createUnsignedJws(MOCK_CARD_CERTIFICATE, MOCK_CHALLENGE)).rejects.toThrow('JWS hashing failed');
  });

  it('should convert a DER encoded certificate to Concatenated format', () => {
    const base64urlString =
      'MEUCIGYFXpGblxpAvUE21td5u33ahar2wsRiIgG_cu49QujlAiEAgWqy4Hyw43mXxuZLlfKk9DNlmnNq9DtZ2SSYREZGf7g';
    const outputLength = 64;
    expect(convertDerToConcatenated(base64urlString, outputLength)).toBe(
      'ZgVekZuXGkC9QTbW13m7fdqFqvbCxGIiAb9y7j1C6OWBarLgfLDjeZfG5kuV8qT0M2Wac2r0O1nZJJhERkZ_uA',
    );
  });

  it('should thrown an error while converting a DER with an invalid signature', () => {
    const base64urlString = 'malformedBase64urlString';
    const outputLength = 10;
    expect(() => convertDerToConcatenated(base64urlString, outputLength)).toThrow('Invalid format of ECDSA signature');
  });
});
