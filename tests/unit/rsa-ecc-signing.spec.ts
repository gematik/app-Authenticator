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
 */

/**
 * @jest-environment node
 */
import { convertDerToConcatenated, createUnsignedJws } from '@/renderer/modules/gem-idp/services/signing-service';
import { ENCRYPTION_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';

const MOCK_CARD_CERTIFICATE = 'mockCardCertificate';
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
    await runTest(SIGNATURE_TYPES.ECC, ENCRYPTION_TYPES.ECC_ALG_SHA256, {
      hashedChallenge: 'UpVL47pgHp12xcyMIm7JqQCdExDoS1NH20ECDfXD2qY=',
      header: 'eyJhbGciOiJCUDI1NlIxIiwieDVjIjpbIm1vY2tDYXJkQ2VydGlmaWNhdGUiXSwidHlwIjoiSldUIiwiY3R5IjoiTkpXVCJ9',
      payload: 'eyJuand0IjoibW9ja0NoYWxsZW5nZSJ9',
    });
  });

  it('should create an unsigned JWS with RSA', async () => {
    await runTest(SIGNATURE_TYPES.RSA, ENCRYPTION_TYPES.RSASSA_PSS_USING_SHA256, {
      hashedChallenge: 'VhksYYMXO7jKfZS895M0coMwabNXBq5SLghd2Ll0YEg=',
      header: 'eyJhbGciOiJQUzI1NiIsIng1YyI6WyJtb2NrQ2FyZENlcnRpZmljYXRlIl0sInR5cCI6IkpXVCIsImN0eSI6Ik5KV1QifQ',
      payload: 'eyJuand0IjoibW9ja0NoYWxsZW5nZSJ9',
    });
  });

  it('should throw an error when creating an unsigned JWS fails', async () => {
    // jest.spyOn(global.console, 'error').mockImplementation(() => {});
    // jest.spyOn(global.console, 'log').mockImplementation(() => {});

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
