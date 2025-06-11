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

import ConnectorConfig from './connector-config';
import { runSoapRequest } from './auth-signer';
import { getServiceEndpointTls } from './sds-request';
import cardHandleParser from '../common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

const getAuthSignature = async (endpoint: string, cardHandle: string) => {
  const response = await runSoapRequest(
    ConnectorConfig.contextParameters,
    endpoint,
    cardHandle,
    ConnectorConfig.authSignParameter,
  );
  return cardHandleParser(response.toString(), XML_TAG_NAMES.TAG_BASE64SIGNATURE);
};

export const launch = async (cardHandle: string): Promise<string> => {
  try {
    const authSignatureEndpoint = await getServiceEndpointTls(XML_TAG_NAMES.TAG_AUTH_SIGNATURE_SERVICE);
    logger.debug(`Using signature service endpoint ${authSignatureEndpoint} to send SDS requests to connector.`);

    return await getAuthSignature(authSignatureEndpoint, cardHandle);
  } catch (err) {
    logger.error('Error getting signature from connector', err.message);
    throw checkSoapError(err?.response?.body) || err;
  }
};
