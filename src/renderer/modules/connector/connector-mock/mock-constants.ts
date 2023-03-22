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

/* @if MOCK_MODE == 'ENABLED' */
export const MOCK_CARD_TERMINALS =
  '{"CardTerminal":{"Connected":"true","CtId":"Tx","IPAddress":{"IPV4Address":"22.191.127.173"},"IS_PHYSICAL":"true","MacAddress":"F4:24:2C:54:B4:FC","Name":"Terminal","ProductInformation":{"InformationDate":"2022-01-17T13:32:26.545Z","ProductIdentification":{"ProductCode":"VTerm","ProductVendorID":"EHEX","ProductVersion":{"Local":{"FWVersion":"1.1.0","HWVersion":"1.0.1"}}},"ProductMiscellaneous":{"ProductName":"Virtual Terminal","ProductVendorName":"eHealthExperts"},"ProductTypeInformation":{"ProductType":"eHealth-Kartenterminal","ProductTypeVersion":"1.2.0"}},"Slots":"4","WorkplaceIds":{"WorkplaceId":"Arbeitsplatz-x"}}}';
export const MOCK_CARD_PIN_STATUS = { statusResult: 'OK', pinStatus: 'VERIFIED' };
/* @endif */
