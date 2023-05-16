/*
 * Copyright 2023 gematik GmbH
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

import ConnectorConfig from './connector-config';
import * as authSigner from './auth-signer';
import * as connectorSdsRequest from './sds-request';
import cardHandleParser from '../common/soap-response-xml-parser';
import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';

const getAuthSignature = async (endpoint: string, cardHandle: string) => {
  const endpointMapped = ConnectorConfig.mapEndpoint(endpoint);
  const response = await authSigner.runSoapRequest(
    ConnectorConfig.contextParameters,
    endpointMapped,
    cardHandle,
    ConnectorConfig.authSignParameter,
  );
  return cardHandleParser(response.toString(), XML_TAG_NAMES.TAG_BASE64SIGNATURE);
};

export const launch = async (cardHandle: string): Promise<string> => {
  try {
    const authSignatureEndpoint = await connectorSdsRequest.getServiceEndpointTls(
      XML_TAG_NAMES.TAG_AUTH_SIGNATURE_SERVICE,
    );
    logger.debug(`Using signature service endpoint ${authSignatureEndpoint} to send SDS requests to connector.`);

    return await getAuthSignature(authSignatureEndpoint, cardHandle);
  } catch (err) {
    logger.error('Error getting signature from connector', err.message);
    throw checkSoapError(err?.response?.body) || err;
  }
};
