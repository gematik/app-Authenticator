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

import { getConfig } from '@/renderer/utils/get-configs';
import { DEVELOPER_OPTIONS } from '@/renderer/modules/connector/connector-mock/mock-config';
import getIdpTlsCertificates from '@/renderer/utils/get-idp-tls-certificates';

type ReqConfigType = { https: { certificateAuthority: undefined | string[]; rejectUnauthorized: boolean } };

export const httpsReqConfig = (): ReqConfigType => {
  let rejectUnauthorized = true;

  // #!if MOCK_MODE === 'ENABLED'
  rejectUnauthorized = !!getConfig(DEVELOPER_OPTIONS.IDP_CERTIFICATE_CHECK, true).value;
  // #!endif

  return {
    https: {
      certificateAuthority: getIdpTlsCertificates(),
      rejectUnauthorized: rejectUnauthorized,
    },
  };
};
