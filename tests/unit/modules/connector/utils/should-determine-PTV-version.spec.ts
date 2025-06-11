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
