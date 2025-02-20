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

import sdsParser from '@/renderer/modules/connector/common/sds-parser';
import { printTestTitle, readResourceFile, TestCategory } from '@tests/TestInfo';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';

let endpoints: Map<string, string>;
describe('SdsParser for TLS parses correctly for different Endpoints', () => {
  printTestTitle(__filename);
  it(TestCategory.utilTest + ': Endpoint secunet-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'secunet-PTV4.xml');
    handleSds(sdsSecunet);
    expect(endpoints.size).toEqual(14);
    expect(getEndpoint(XML_TAG_NAMES.TAG_CERTIFICATE_SERVICE)).toEqual(
      'https://10.11.217.160:443/ws/CertificateService',
    );
    expect(getEndpoint(XML_TAG_NAMES.TAG_EVENT_SERVICE)).toEqual('https://10.11.217.160:443/ws/EventService');
  });

  it(TestCategory.utilTest + ': Endpoint kops-PTV4', async () => {
    endpoints = new Map();
    const sdsKops = readResourceFile('connSds', 'kops-PTV4.xml');
    handleSds(sdsKops);
    expect(endpoints.size).toEqual(16);
    expect(getEndpoint(XML_TAG_NAMES.TAG_CERTIFICATE_SERVICE)).toEqual('https://172.24.0.2:443/certificateservice');
    expect(getEndpoint(XML_TAG_NAMES.TAG_EVENT_SERVICE)).toEqual('https://172.24.0.2:443/eventservice');
  });

  it(TestCategory.utilTest + ': Endpoint ks2-PTV4', async () => {
    endpoints = new Map();
    const sdsKs2 = readResourceFile('connSds', 'ks2-PTV4.xml');
    handleSds(sdsKs2);
    expect(endpoints.size).toEqual(7);
    expect(getEndpoint(XML_TAG_NAMES.TAG_CERTIFICATE_SERVICE)).toEqual(
      'https://localhost:9106/soap-api/CertificateService/6.0.1',
    );
    expect(getEndpoint(XML_TAG_NAMES.TAG_EVENT_SERVICE)).toEqual('https://localhost:9106/soap-api/EventService/7.2.0');
  });
});

function handleSds(sds: string) {
  endpoints = sdsParser(sds);
}

function getEndpoint(serviceName: string) {
  return endpoints.get(serviceName);
}
