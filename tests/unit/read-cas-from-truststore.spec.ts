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

jest.mock('@/main/services/logging', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/constants', () => ({
  IS_TEST: true,
}));

jest.mock('@/main/services/ca-trust-store-service', () => ({
  getCasFromTruststore: jest.fn(() => {
    return ['mocked-ca-cert'];
  }),
}));

jest.mock('got');

jest.mock('mac-ca', () => ({
  get: jest.fn(() => ['mocked-mac-ca-cert']),
}));

describe('Retrieving CA certificates from the OS trust store functionality', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  it('should use certs from trust store', async () => {
    const { getCasFromTruststore } = require('@/main/services/ca-trust-store-service');
    require('@/main/services/http-client');
    expect(getCasFromTruststore).toHaveBeenCalled();
  });

  test('should use mocked getCasFromTruststore', () => {
    const { getCasFromTruststore } = require('@/main/services/ca-trust-store-service');
    const cas = getCasFromTruststore();
    expect(cas).toEqual(['mocked-ca-cert']);
  });
});
