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

import { readResourceFile, TestCategory } from '@tests/TestInfo';
import textParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';

function determinePtv(sds: string) {
  return handlePtv(sds);
}

describe('Determine PTV versions', () => {
  it(TestCategory.utilTest + ': PRODUCT_TYPE_VERSION von koco-PTV3', async () => {
    const sdsSecunet = readResourceFile('connSds', 'koco-PTV3.xml');
    const ptv = determinePtv(sdsSecunet);
    expect(ptv).toEqual('3.6.0');
  });
  it(TestCategory.utilTest + ': PRODUCT_TYPE_VERSION von koco-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'koco-PTV4.xml');
    const ptv = determinePtv(sdsSecunet);
    expect(ptv).toEqual('4.80.3');
  });

  it(TestCategory.utilTest + ': negativetest, PRODUCT_TYPE_VERSION von secunet-PTV4-testOnly', async () => {
    const sdsSecunet = readResourceFile('connSds', 'secunet-PTV4-testOnly.xml');
    const ptv = determinePtv(sdsSecunet);
    expect(ptv[0]).not.toEqual('4.3.1');
  });

  it(TestCategory.utilTest + ': PRODUCT_TYPE_VERSION von ks2-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'ks2-PTV4.xml');
    const ptv = determinePtv(sdsSecunet);
    expect(ptv).toEqual('4.80.2');
  });

  it(TestCategory.utilTest + ': PRODUCT_TYPE_VERSION von secunet-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'secunet-PTV4.xml');
    const ptv = determinePtv(sdsSecunet);
    expect(ptv).toEqual('4.8.2');
  });

  it(TestCategory.utilTest + ': PRODUCT_TYPE_VERSION von rise-PTV3', async () => {
    const sdsSecunet = readResourceFile('connSds', 'rise-PTV3.xml');
    const ptv = determinePtv(sdsSecunet);
    expect(ptv).toEqual('3.6.0');
  });
});

function handlePtv(sds: string) {
  return textParser(sds, XML_TAG_NAMES.TAG_PRODUCT_TYPE_VERSION);
}
