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

import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from './connector-config';
import { runSoapRequest } from '@/renderer/modules/connector/connector_impl/get-pin-status';
import { getServiceEndpointTls } from './sds-request';
import { logger } from '@/renderer/service/logger';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

/**
 * @param endpoint
 * @param cardHandle
 * @param pinType
 * @returns {Promise<void>}
 */
export const pinStatus = async (endpoint: string, cardHandle: string, pinType: string): Promise<string> => {
  return runSoapRequest(ConnectorConfig.contextParameters, endpoint, cardHandle, pinType);
};

export const launch = async (cardType: ECardTypes, cardHandle: string): Promise<string> => {
  try {
    const cardServiceEndpoint = await getServiceEndpointTls(XML_TAG_NAMES.TAG_CARD_SERVICE);
    logger.debug(`Using service endpoint ${cardServiceEndpoint} to send SDS requests to connector.`);
    return await pinStatus(cardServiceEndpoint, cardHandle, ConnectorConfig.cardsParametersByType(cardType).pinType);
  } catch (err) {
    logger.error('Error getting PIN Status from connector:', err.message);
    throw checkSoapError(err.response?.body) || err;
  }
};
