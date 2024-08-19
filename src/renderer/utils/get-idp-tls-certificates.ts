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

import { logger } from '@/renderer/service/logger';
import { readCaCerts } from '@/renderer/utils/read-tls-certificates';

let CA_CHAINS_IDP: undefined | string[];

/**
 * return CA-Chain for Idp
 */
const getIdpTlsCertificates = (): undefined | string[] => {
  if (CA_CHAINS_IDP) {
    logger.debug('Reuse CA_CHAINS_IDP');
    return CA_CHAINS_IDP;
  }
  CA_CHAINS_IDP = readCaCerts(false);
  window.api.setCaChainIdpInPreload(CA_CHAINS_IDP);
  return CA_CHAINS_IDP;
};

export default getIdpTlsCertificates;
