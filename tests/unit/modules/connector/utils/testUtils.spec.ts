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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { printTestTitle, readResourceFile, TestCategory } from '@tests/TestInfo';
import { checkSoapError, getHomedir } from '@/renderer/modules/connector/common/utils';
import * as fs from 'fs';
import sdsParser from '@/renderer/modules/connector/common/sds-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

let endpoints = new Map();
describe('Utils test collection', () => {
  printTestTitle(__filename);
  it(TestCategory.utilTest + ': uuid', async () => {
    const uuidV4Regex = /^[A-F\d]{8}-[A-F\d]{4}-4[A-F\d]{3}-[89AB][A-F\d]{3}-[A-F\d]{12}$/i;
    const isValidV4UUID = (uuid: string) => uuidV4Regex.test(uuid);
    expect(isValidV4UUID('ffg59067fgklfsjkd')).toBeFalsy();
    expect(isValidV4UUID('f48c6df9-942e-427a-80de-3adbf319159f')).toBeTruthy();
    expect('4000'.match('^[0-9]*$')).toBeTruthy();
    expect('123456'.match('^[0-9]*$')).toBeTruthy();
    expect('undefined'.match('^[0-9]*$')).toBeFalsy();
    expect('u5566nde245f'.match('^[0-9]*$')).toBeFalsy();
  });

  it(TestCategory.utilTest + ': checkSoapError', async () => {
    try {
      const soapRespNoError = readResourceFile('soap', 'get-cards-response.xml');
      expect(checkSoapError(soapRespNoError)).toStrictEqual(
        new UserfacingError('Unknown Connector Error', '', ERROR_CODES.AUTHCL_1116),
      );
    } catch (e: any) {
      expect(e).toBe(new UserfacingError('XML response parse error', e.message, ERROR_CODES.AUTHCL_1110));
    }
  });
  it(TestCategory.utilTest + ': getHomedir', async () => {
    expect(fs.existsSync(getHomedir())).toBeTruthy();
  });

  it(TestCategory.utilTest + ': Endpoint', async () => {
    const sdsSecunet = readResourceFile('connSds', 'secunet-PTV4.xml');
    handleSds(sdsSecunet);
    expect(endpoints.size).toEqual(14);

    const result = getEndpoint(XML_TAG_NAMES.TAG_EVENT_SERVICE);
    expect(result).toEqual('https://10.11.217.160:443/ws/EventService');
  });

  it(TestCategory.utilTest + ': getEndpointFromArray', async () => {
    const sdsKocoPtv3 = readResourceFile('connSds', 'koco-PTV3.xml');
    handleSds(sdsKocoPtv3);
    expect(endpoints.size).toEqual(12);

    const result = getEndpoint(XML_TAG_NAMES.TAG_EVENT_SERVICE);
    expect(result).toEqual('https://10.11.236.247:443/service/systeminformationservice');
  });
});

function handleSds(sds: string) {
  endpoints = sdsParser(sds);
}

function getEndpoint(serviceName: string): string {
  return endpoints.get(serviceName);
}
