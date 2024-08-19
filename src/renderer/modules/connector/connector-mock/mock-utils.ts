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

// #!if MOCK_MODE === 'ENABLED'
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { getConfig } from '@/renderer/utils/get-configs';
import { logger } from '@/renderer/service/logger';

// create type definition from object
type TMockCertificatesValues = (typeof MOCK_CONNECTOR_CERTS_CONFIG)[keyof typeof MOCK_CONNECTOR_CERTS_CONFIG];

export const readMockCertificate = (configKey: TMockCertificatesValues, cleanCert = false): string => {
  const filePath = getConfig(configKey).value;

  if (!filePath || typeof filePath !== 'string') {
    logger.error('Please select mock certificate for: ' + configKey);
    throw new Error('Missing certificate path for ' + configKey);
  }

  try {
    const file = window.api.readFileSync(filePath, 'utf8');

    if (!cleanCert) {
      return file;
    }

    return file?.replace(/[\n\r]|-(.*?)-/g, '');
  } catch (e) {
    logger.error('Missing certificate for: ' + configKey);
    throw e;
  }
};

// #!endif
