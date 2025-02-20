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
 * @jest-environment jsdom
 */
import { readMockCertificate } from '@/renderer/modules/connector/connector-mock/mock-utils';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { setSampleData } from '@tests/utils/config-sample-data';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';

const CERT_HEADER = '-----BEGIN CERTIFICATE-----';
const CERT_FOOTER = '-----END CERTIFICATE-----';

describe('reading mock certificates', () => {
  beforeAll(() => {
    jest.spyOn(FileStorageRepository as any, 'saveToCm').mockReturnValue(true);
    jest.spyOn(FileStorageRepository as any, 'readFromCm').mockReturnValue({});
  });

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
