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

import * as certificateReader from './certificate-reader';
import * as sdsRequest from './sds-request';
import ConnectorConfig from './connector-config';

import { logger } from '@/renderer/service/logger';
import cardHandleParser from '../common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';

const readCertificate = async (endpoint: string, cardHandle: string) => {
  logger.info(`Sending SOAP request to ${endpoint} to get certificate from connector.`);
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);

  const res = await certificateReader.runSoapRequest(
    ConnectorConfig.contextParameters,
    endpointMapped,
    cardHandle,
    ConnectorConfig.certReaderParameter,
  );

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
