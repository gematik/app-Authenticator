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

import { COMMON_USED_REGEXES } from '@/constants';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

export function validateAuthResponseData(args: { sid: string; challenge: string; challenge_endpoint: string }): void {
  const error = 'Invalid auth response data received';
  if (!args.challenge_endpoint || !COMMON_USED_REGEXES.ANYTHING.test(args.challenge_endpoint)) {
    throw new UserfacingError(error, 'Invalid challenge_endpoint', ERROR_CODES.AUTHCL_0005);
  }
  if (!args.challenge || !COMMON_USED_REGEXES.CODE.test(args.challenge)) {
    throw new UserfacingError(error, 'Invalid challenge', ERROR_CODES.AUTHCL_0005);
  }
  if (!args.sid || !COMMON_USED_REGEXES.ANYTHING.test(args.sid)) {
    throw new UserfacingError(error, 'Invalid  sid', ERROR_CODES.AUTHCL_0005);
  }
}
