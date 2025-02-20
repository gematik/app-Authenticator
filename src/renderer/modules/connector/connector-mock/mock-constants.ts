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

// #!if MOCK_MODE === 'ENABLED'
export const MOCK_CARD_TERMINALS =
  '{"CardTerminal":{"Connected":"true","CtId":"Tx","IPAddress":{"IPV4Address":"22.191.127.173"},"IS_PHYSICAL":"true","MacAddress":"F4:24:2C:54:B4:FC","Name":"Terminal","ProductInformation":{"InformationDate":"2022-01-17T13:32:26.545Z","ProductIdentification":{"ProductCode":"VTerm","ProductVendorID":"EHEX","ProductVersion":{"Local":{"FWVersion":"1.1.0","HWVersion":"1.0.1"}}},"ProductMiscellaneous":{"ProductName":"Virtual Terminal","ProductVendorName":"eHealthExperts"},"ProductTypeInformation":{"ProductType":"eHealth-Kartenterminal","ProductTypeVersion":"1.2.0"}},"Slots":"4","WorkplaceIds":{"WorkplaceId":"Arbeitsplatz-x"}}}';
export const MOCK_CARD_PIN_STATUS = { statusResult: 'OK', pinStatus: 'VERIFIED' };
// #!endif
