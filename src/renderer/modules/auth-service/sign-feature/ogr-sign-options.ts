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

import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { FinalConstants, JwsSignOptions, TJwsSignOptions } from '@/renderer/service/jws-sign-options';

export class OgrJwsOptions extends JwsSignOptions {
  constructor(challenge: string, cert: string, cardType: ECardTypes) {
    super(challenge, cert, cardType);
  }

  createJwsOptions(sid: string): TJwsSignOptions {
    const header = { alg: FinalConstants.RSASSA_PKCS1_USING_SHA256, x5c: [this.cert] };
    const jwsHeader = this.base2urlEncode(header);

    const payload = { challenge: this.challenge, sid: sid };
    const jwsPayload = this.base2urlEncode(payload);

    return { protectedHeader: jwsHeader, payload: jwsPayload };
  }
}
