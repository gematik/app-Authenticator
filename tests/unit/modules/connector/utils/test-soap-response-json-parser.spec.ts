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

import { printTestTitle, readResourceFile, TestCategory } from '@tests/TestInfo';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { findSpecificElementInResponseProperties } from '@/renderer/modules/connector/common/soap-response-json-parser';
import { checkGetCards } from '@/renderer/modules/connector/connector_impl/lookup-get-cards';
import { ConnectorError, UserfacingError } from '@/renderer/errors/errors';
import { findAvailableCardTerminals } from '@/renderer/modules/connector/connector_impl/lookup-card-terminals';
import { ERROR_CODES } from '@/error-codes';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

describe('SoapResponse JsonParser', () => {
  printTestTitle(__filename);

  it(TestCategory.utilTest + 'test find cardHandle over json parser ', async () => {
    const resp = readResourceFile('soap', 'get-cards-response.xml');
    const cardHandle = await findSpecificElementInResponseProperties(resp, XML_TAG_NAMES.TAG_CARD_HANDLE);
    expect(cardHandle).toEqual('5002b32d-151e-4f41-8ef7-afeb60590199');
  });

  it(TestCategory.utilTest + 'test find cards over json parser  ', async () => {
    const resp = readResourceFile('soap', 'get-cards-response-morecards-found.xml');
    const cards = await findSpecificElementInResponseProperties(resp, XML_TAG_NAMES.TAG_ITEM_CARD);
    const jsonObject = JSON.parse(JSON.stringify(cards));
    expect(jsonObject[0].CardHandle).toEqual('f4969bec-e2ac-4741-82fa-b94a26ba1b0b');
    expect(jsonObject.length).toEqual(2);
  });
  it(TestCategory.utilTest + 'test more cards found', async () => {
    const resp = readResourceFile('soap', 'get-cards-response-morecards-found.xml');

    // should throw an error 1105
    try {
      await checkGetCards(resp, ECardTypes.SMCB);
    } catch (err) {
      expect(err.code).toEqual(ERROR_CODES.AUTHCL_1105);
      expect(err.description).toEqual('Mehrere SMC-B-Karten als gesteckt gefunden!');
    }
  });

  it(TestCategory.utilTest + 'test no cards found ', async () => {
    const resp = readResourceFile('soap', 'get-cards-response-nocards-found.xml');

    await expect(checkGetCards(resp, ECardTypes.SMCB)).rejects.toThrow(
      new ConnectorError('4047', 'Konnektor Hinweis-Fehler', `keine ${ECardTypes.SMCB.toUpperCase()}-Karten gefunden`),
    );
  });

  it(TestCategory.utilTest + 'test GetCardTerminals Function', async () => {
    const terminalName = 'Terminal 1';
    const CardTerminalId = 'T-N-LOC';
    const resp = readResourceFile('soap', 'get-card-terminals-response.xml');
    const cardTerminals = await findAvailableCardTerminals(resp);
    const jsonObject = JSON.parse(JSON.stringify(cardTerminals));

    expect(jsonObject[0].Name).toEqual(terminalName);
    expect(jsonObject[1].CtId).toEqual(CardTerminalId);
  });
  it(TestCategory.utilTest + 'test ', async () => {
    const resp = readResourceFile('soap', 'get-card-terminals-response-no-terminals.xml');

    await expect(findAvailableCardTerminals(resp)).rejects.toThrow(
      new UserfacingError('Technical error', 'No Card-Terminals found', ERROR_CODES.AUTHCL_1113),
    );
  });
});
