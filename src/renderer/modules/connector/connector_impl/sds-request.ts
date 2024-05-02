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

import sdsParser from '../common/sds-parser';
import { logger } from '@/renderer/service/logger';
import textParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { getConnectorEndpoint, httpReqConfig } from '@/renderer/modules/connector/services';

let endpoints = new Map();
let productTypeVersion = '';

function extractEndpoints(sds: string) {
  endpoints = sdsParser(sds);
  logger.debug(`endpoints.size: ${endpoints.size}`);
}

/**
 * @deprecated The method is not in use! Remove in next version!
 */
export const getConnectorSdsTls = async (): Promise<string> => {
  const url = getConnectorEndpoint();
  const { data: connectorSdsResponse } = await window.api.httpGet(url, { ...httpReqConfig() });

  extractEndpoints(connectorSdsResponse);
  return connectorSdsResponse;
};

export const getServiceEndpointTls = async (serviceName: string): Promise<string> => {
  if (endpoints.size == 0 || productTypeVersion === '') {
    const url = getConnectorEndpoint();
    const { data: sds } = await window.api.httpGet(url, { ...httpReqConfig() });
    extractEndpoints(sds);
    extractPtv(sds);
  } else {
    logger.debug(`reuse endpoints: ${endpoints.size} xEndpoints`);
  }
  return getEndpoint(serviceName);
};

export function getEndpoint(serviceName: string): string {
  return endpoints.get(serviceName);
}

export function getProductTypeVersion(): string {
  return productTypeVersion;
}

export function clearEndpoints() {
  endpoints.clear();
  logger.debug(`endpoints cleared: ${endpoints.size} xEndpoints`);
}

function extractPtv(sds: string) {
  productTypeVersion = textParser(sds, XML_TAG_NAMES.TAG_PRODUCT_TYPE_VERSION);
  logger.debug('productVersionPTV: ' + productTypeVersion);
}
