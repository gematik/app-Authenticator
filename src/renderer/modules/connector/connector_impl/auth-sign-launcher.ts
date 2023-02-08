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

import ConnectorConfig from './connector-config';
import * as authSigner from './auth-signer';
import * as connectorSdsRequest from './sds-request';
import cardHandleParser from '../common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

const getAuthSignature = async (endpoint: string, cardHandle: string, flowType: string) => {
  logger.info(`Sending SOAP request to ${endpoint} to get authentication signature from connector.`);
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);
  const response = await authSigner.runSoapRequest(
    ConnectorConfig.contextParameters,
    endpointMapped,
    cardHandle,
    ConnectorConfig.authSignParameter,
    flowType,
  );
  return cardHandleParser(response.toString(), XML_TAG_NAMES.TAG_BASE64SIGNATURE);
};

export const launch = async (cardHandle: string, flowType: string): Promise<string> => {
  try {
    const authSignatureEndpoint = await connectorSdsRequest.getServiceEndpointTls(
      XML_TAG_NAMES.TAG_AUTH_SIGNATURE_SERVICE,
    );
    logger.debug(`Using signature service endpoint ${authSignatureEndpoint} to send SDS requests to connector.`);

    return await getAuthSignature(authSignatureEndpoint, cardHandle, flowType);
  } catch (err) {
    logger.error('Error getting signature from connector', err.message);
    throw checkSoapError(err?.response?.body) || err;
  }
};
