/*
 * Copyright 2023 gematik GmbH
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

/**
 * @jest-environment jsdom
 */
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { setSampleData } from '../../../../utils/config-sample-data';

const CERT_HEADER = '-----BEGIN CERTIFICATE-----';
const CERT_FOOTER = '-----END CERTIFICATE-----';

describe('reading mock certificates', () => {
  it('no path defined', async function () {
    expect(() => {
      readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.SMCB_KEY);
    }).toThrowError('Missing certificate path for connector.mockSmcbKey');
  });

  it('certificate exists', async function () {
    const certPath = process.cwd() + '/tests/resources/certs/example/example-cer.cer';
    setSampleData({ [MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY]: certPath });
    expect(readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY)).toBeTruthy();
  });

  it('reads certificate and cleans header and footer', async function () {
    const certPath = process.cwd() + '/tests/resources/certs/example/example-cer.cer';
    setSampleData({ [MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT]: certPath });

    const hbaKeyCert = readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT, true);

    expect(hbaKeyCert.includes(CERT_HEADER)).toBeFalsy();
    expect(hbaKeyCert.includes(CERT_FOOTER)).toBeFalsy();
    expect(hbaKeyCert.includes('\n')).toBeFalsy();
  });

  it('reads key file and keeps header and footer', async function () {
    const certPath = process.cwd() + '/tests/resources/certs/example/example-cer.cer';
    setSampleData({ [MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY]: certPath });

    const hbaKeyCert = readMockCertificate(MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY);

    expect(hbaKeyCert.includes(CERT_HEADER)).toBeTruthy();
    expect(hbaKeyCert.includes(CERT_FOOTER)).toBeTruthy();
    expect(hbaKeyCert.includes('\n')).toBeTruthy();
  });
});
