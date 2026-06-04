/*
 * Copyright 2026, gematik GmbH
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

import sdsParser, { pickHighestSupportedVersion } from '../common/sds-parser';
import { logger } from '@/renderer/service/logger';
import textParser from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { CONNECTOR_SDS_PATH, WSDL_VERSION_CAPS, XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { httpReqConfig } from '@/renderer/modules/connector/services';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { TSdsServiceMap } from '@/renderer/modules/connector/type-definitions';
import { mapToPtvVersion, PtvVersion } from '@/renderer/modules/connector/ptv';

type SdsCache = {
  services: TSdsServiceMap;
  productTypeVersion: string;
  loaded: boolean;
};

const emptyCache = (): SdsCache => ({ services: new Map(), productTypeVersion: '', loaded: false });

let cache: SdsCache = emptyCache();

export const getServiceEndpointTls = async (serviceName: string): Promise<string> => {
  try {
    if (!cache.loaded) {
      const { data: sds } = await window.api.httpGet(ConnectorConfig.tlsEntryOptions.hostname + CONNECTOR_SDS_PATH, {
        ...httpReqConfig(),
      });
      // Build the next cache locally and assign once — if a parser throws, `cache` keeps its previous
      // value. `loaded` gates on services.size, so a 200-with-garbage response self-heals on the next
      // call instead of locking the cache empty.
      const services = sdsParser(sds);
      const productTypeVersion = textParser(sds, XML_TAG_NAMES.TAG_PRODUCT_TYPE_VERSION);
      cache = { services, productTypeVersion, loaded: services.size > 0 };
      logger.debug(`SDS cache filled: ${services.size} services, PTV=${productTypeVersion}`);
    } else {
      logger.debug(`reuse SDS cache: ${cache.services.size} services`);
    }
    return getEndpoint(serviceName);
  } catch (e) {
    const message = e?.message ?? String(e);
    logger.error('Could not get service endpoint: ', message);
    // Pass the original error through `data` so the stack survives in logs.
    throw new UserfacingError('Could not get service endpoint', message, ERROR_CODES.AUTHCL_1000, e);
  }
};

export function getEndpoint(serviceName: string): string {
  const chosen = pickHighestSupportedVersion(cache.services.get(serviceName), WSDL_VERSION_CAPS[serviceName]);
  if (!chosen?.endpointTls) {
    throw new Error(`No usable TLS endpoint for service "${serviceName}" in SDS`);
  }
  return chosen.endpointTls;
}

export function getProductTypeVersion(): string {
  return cache.productTypeVersion;
}

export function getPtvVersion(): PtvVersion {
  return mapToPtvVersion(cache.productTypeVersion);
}

export function clearSdsCache() {
  cache = emptyCache();
  logger.debug('SDS cache cleared');
}
