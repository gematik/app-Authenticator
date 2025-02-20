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

import sdsParser from '../common/sds-parser';
import { logger } from '@/renderer/service/logger';
import textParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { getConnectorEndpoint, httpReqConfig } from '@/renderer/modules/connector/services';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

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
  try {
    if (endpoints.size == 0 || productTypeVersion === '') {
      const url = getConnectorEndpoint();
      const { data: sds } = await window.api.httpGet(url, { ...httpReqConfig() });
      extractEndpoints(sds);
      extractPtv(sds);
    } else {
      logger.debug(`reuse endpoints: ${endpoints.size} xEndpoints`);
    }
    return getEndpoint(serviceName);
  } catch (e) {
    logger.error('Could not get service endpoint: ', e.message);
    throw new UserfacingError('Could not get service endpoint', e.message, ERROR_CODES.AUTHCL_1000);
  }
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
