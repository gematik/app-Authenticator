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
      new UserfacingError('Technical error', 'Kein Kartenterminal gefunden', ERROR_CODES.AUTHCL_1113),
    );
  });
});
