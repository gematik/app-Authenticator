/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
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
  logger.info(`endpoints.size: ${endpoints.size}`);
}

/**
 * @deprecated The method is not in use! Remove in next version!
 */
export const getConnectorSdsTls = async (): Promise<string> => {
  const url = getConnectorEndpoint();
  const { data: connectorSdsResponse } = await window.api.httpGet(url, false, httpReqConfig());

  extractEndpoints(connectorSdsResponse);
  return connectorSdsResponse;
};

export const getServiceEndpointTls = async (serviceName: string): Promise<string> => {
  if (endpoints.size == 0 || productTypeVersion === '') {
    const url = getConnectorEndpoint();
    const { data: sds } = await window.api.httpGet(url, false, httpReqConfig());
    extractEndpoints(sds);
    extractPtv(sds);
  } else {
    logger.info(`reuse endpoints: ${endpoints.size} xEndpoints`);
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
  logger.info(`endpoints cleared: ${endpoints.size} xEndpoints`);
}

function extractPtv(sds: string) {
  productTypeVersion = textParser(sds, XML_TAG_NAMES.TAG_PRODUCT_TYPE_VERSION);
  logger.info('productVersionPTV: ' + productTypeVersion);
}
