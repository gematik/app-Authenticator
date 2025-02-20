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
import { getCertificates, parseCertificatesString } from '@/main/services/read-root-certs';

// normally, the real function reads certs from the windows trust store
jest.mock('electron-edge-js', () => ({
  func: jest.fn().mockImplementation(() => {
    return jest.fn((input, callback) => {
      const error = null;
      const result: string = ''; // normally a long string of certs
      callback(error, result);
    });
  }),
}));

describe('Retrieving an array of CA certificates from any OS trust store', () => {
  xit('should use certs from trust store', async () => {
    const rootCerts = getCertificates();
    // todo: this does not work in the pipeline, because this function only supports Windows and MacOS
    // todo: find a better way to test this function in the pipeline
    // on unixoide systems we'll always get an empty array []
    expect(Array.isArray(rootCerts)).toBeTruthy();
  });
});

describe('Testing Cert String splitter', () => {
  xit('should return an array with multiple certificates', () => {
    const rawData = `
      -----BEGIN CERTIFICATE-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArw5R+8WqvFtV
      -----END CERTIFICATE-----
      -----BEGIN CERTIFICATE-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArw5R+8WqvFtV
      -----END CERTIFICATE-----
    `;
    const result = parseCertificatesString(rawData);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(2);
  });

  xit('should return an array with a single certificate', () => {
    const rawData = `
      -----BEGIN CERTIFICATE-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArw5R+8WqvFtV
      -----END CERTIFICATE-----
    `;
    const result = parseCertificatesString(rawData);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
  });

  xit('should return an empty array when no certificates are found', () => {
    const rawData = 'No certificates here';
    const result = parseCertificatesString(rawData);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  xit('should return an empty array when input is empty', () => {
    const rawData = '';
    const result = parseCertificatesString(rawData);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(0);
  });

  xit('should handle mixed input with and without certificates', () => {
    const rawData = `
      Some random text
      -----BEGIN CERTIFICATE-----
      MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArw5R+8WqvFtV
      -----END CERTIFICATE-----
      More random text
    `;
    const result = parseCertificatesString(rawData);
    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toEqual(1);
  });
});
