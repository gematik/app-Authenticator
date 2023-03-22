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

import parse from '@/renderer/modules/connector/common/soap-response-xml-parser';
import { XML_ERROR_TAG_NAMES } from '@/renderer/modules/connector/constants';
import { logger } from '@/renderer/service/logger';
import { readCaCerts } from '@/renderer/utils/read-tls-certificates';
import { ConnectorError, UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

export function checkSoapError(responseBody: string): ConnectorError | UserfacingError | false {
  // if there is no response body return
  if (!responseBody) {
    return false;
  }

  try {
    logger.warn(
      'Technical issue from connector. Please be sure that cards, card terminals and connector are available',
      responseBody,
    );
    if (
      responseBody.toString().includes(XML_ERROR_TAG_NAMES.TAG_ERROR_FAULT) ||
      responseBody.toString().includes(XML_ERROR_TAG_NAMES.TAG_ERROR_SEVERITY)
    ) {
      const code = parse(responseBody, XML_ERROR_TAG_NAMES.TAG_ERROR_CODE);
      const errorMessage = parse(responseBody, XML_ERROR_TAG_NAMES.TAG_ERROR_MESSAGE);
      // error = technical error
      return new ConnectorError(code, 'Technischer Fehler', errorMessage);
    }

    return new UserfacingError('Unknown Connector Error', '', ERROR_CODES.AUTHCL_1116);
  } catch (err) {
    return new UserfacingError('XML response parse error', err.message, ERROR_CODES.AUTHCL_1110);
  }
}

export function getHomedir(): string {
  return window.api.getTmpDir();
}

let CA_CHAINS_CONNECTOR: undefined | string[];

/**
 * return CA-Chain for Connector
 */
export const buildCaChainsConnector = (): undefined | string[] => {
  if (CA_CHAINS_CONNECTOR) {
    logger.debug('reuse CA_CHAINS_CONNECTOR!');
    return CA_CHAINS_CONNECTOR;
  }
  CA_CHAINS_CONNECTOR = readCaCerts(true);

  return CA_CHAINS_CONNECTOR;
};
