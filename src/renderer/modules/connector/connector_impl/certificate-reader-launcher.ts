/*
 * Copyright 2024 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
 */

import * as certificateReader from './certificate-reader';
import * as sdsRequest from './sds-request';
import ConnectorConfig from './connector-config';

import { logger } from '@/renderer/service/logger';
import cardHandleParser from '../common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';

const readCertificate = async (endpoint: string, cardHandle: string) => {
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
