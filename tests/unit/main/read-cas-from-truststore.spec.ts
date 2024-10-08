/*
 * Copyright 2024 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
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
