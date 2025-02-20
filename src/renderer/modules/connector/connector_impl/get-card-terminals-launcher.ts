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

import ConnectorConfig from './connector-config';
import * as getCardTerminals from './get-card-terminals';
import * as sdsRequestObj from './sds-request';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { findAvailableCardTerminals } from '@/renderer/modules/connector/connector_impl/lookup-card-terminals';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

const executeServiceGc = async (endpoint: string) => {
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);
  return getCardTerminals.runSoapRequest(ConnectorConfig.contextParameters, endpointMapped);
};

export const launch = async (): Promise<{ [name: string]: any }> => {
  try {
    const endpoint = await sdsRequestObj.getServiceEndpointTls(XML_TAG_NAMES.TAG_EVENT_SERVICE);
    logger.debug(`getCardsTerminal.endpoint: ${endpoint}`);

    const xmlSoapResponse = await executeServiceGc(endpoint);
    logger.debug('xmlSoapResponse: ' + xmlSoapResponse);
    return await findAvailableCardTerminals(xmlSoapResponse);
  } catch (err) {
    logger.error('Could not get card terminals: ', err.message);
    throw checkSoapError(err.response?.body) || err;
  }
};
