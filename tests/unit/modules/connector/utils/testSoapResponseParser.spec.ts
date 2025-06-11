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

import soapRespParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { printTestTitle, readResourceFile, TestCategory } from '@tests/TestInfo';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';

describe('SoapResponseParser parses correctly for', () => {
  printTestTitle(__filename);

  it(TestCategory.utilTest + ': cardHandle', async () => {
    const resp = readResourceFile('soap', 'get-cards-response.xml');
    const cardHandle = soapRespParser(resp, XML_TAG_NAMES.TAG_CARD_HANDLE);
    expect(cardHandle).toEqual('5002b32d-151e-4f41-8ef7-afeb60590199');
    expect(cardHandle.length).toEqual(36);
  });

  it(TestCategory.utilTest + ': faultstring', async () => {
    const faultResp = readResourceFile('soap', 'soap-error-response.xml');
    const errorCode = soapRespParser(faultResp, 'Code');
    expect(errorCode).toEqual('4004');
    const faultstring = soapRespParser(faultResp, 'faultstring');
    expect(faultstring).toEqual('Ungültige Mandanten-ID');
    const errorText = soapRespParser(faultResp, 'ErrorText');
    expect(errorText).toEqual('Ungültige Mandanten-ID');
  });

  it(TestCategory.utilTest + ': pinStatus', async () => {
    const getPinstatusResp = readResourceFile('soap', 'get-pin-status-response.xml');
    const pinStatus = soapRespParser(getPinstatusResp, XML_TAG_NAMES.TAG_PINSTATUS);
    expect(pinStatus).toEqual('VERIFIED');
  });
});
