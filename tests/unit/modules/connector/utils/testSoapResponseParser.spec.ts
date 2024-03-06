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
