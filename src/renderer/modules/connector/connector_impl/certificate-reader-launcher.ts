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

import * as certificateReader from './certificate-reader';
import * as sdsRequest from './sds-request';
import ConnectorConfig from './connector-config';

import { logger } from '@/renderer/service/logger';
import cardHandleParser from '../common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';
import { CONNECTOR_ERROR_CODES } from '@/error-codes';

const readCertificate = async (endpoint: string, cardHandle: string) => {
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);

  const res = await certificateReader.runSoapRequest(
    ConnectorConfig.contextParameters,
    endpointMapped,
    cardHandle,
    ConnectorConfig.certReaderParameter,
  );

  // Somehow above function doesn't throw an error if the response is an error
  // So we need to check it manually, this can be a rise specific error, but this exception will handle
  // all connector type errors
  const caughtError = checkSoapError(res);
  if (caughtError && caughtError.code === CONNECTOR_ERROR_CODES.E4018) {
    throw caughtError;
  }

  return cardHandleParser(res, XML_TAG_NAMES.TAG_X509_CERTIFICATE);
};

export const launch = async (cardHandle: string): Promise<string> => {
  try {
    const readCertificateEndpoint = await sdsRequest.getServiceEndpointTls(XML_TAG_NAMES.TAG_CERTIFICATE_SERVICE);
    logger.debug(`Using certificate service endpoint ${readCertificateEndpoint} to send SDS requests to connector.`);
    return await readCertificate(readCertificateEndpoint, cardHandle);
  } catch (error) {
    logger.error('Error getting certificate from connector', error.message);
    throw error;
  }
};
