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

import { logger } from '@/renderer/service/logger';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { UserfacingError } from '@/renderer/errors/errors';
import { findSpecificElementInResponseProperties } from '@/renderer/modules/connector/common/soap-response-json-parser';
import { ERROR_CODES } from '@/error-codes';

export async function findAvailableCardTerminals(xmlSoapResponse: string): Promise<{ [name: string]: any }> {
  const cardTerminals = await findSpecificElementInResponseProperties(xmlSoapResponse, XML_TAG_NAMES.TAG_CARD_TERMINAL);
  if (cardTerminals == null) {
    logger.error('No Card terminals found, response from connector', xmlSoapResponse);
    throw new UserfacingError('Technical error', 'No Card-Terminals found', ERROR_CODES.AUTHCL_1113);
  }
  return cardTerminals;
}
