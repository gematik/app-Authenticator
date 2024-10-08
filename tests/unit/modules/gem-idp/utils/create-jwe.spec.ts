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

import base64url from 'base64url';
import createJwe from '@/renderer/modules/gem-idp/sign-feature/create-jwe';
import { IIdpEncJwk } from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';

const encJwk: IIdpEncJwk = {
  use: 'use',
  kid: 'puk_idp_enc',
  kty: 'EC',
  crv: 'BP-256',
  x: 'pkU8LlTZsoGTloO7yjIkV626aGtwpelJ2Wrx7fZtOTo',
  y: 'VliGWQLNtyGuQFs9nXbWdE9O9PFtxb42miy4yaCkCi8',
};

describe('jwe sign-feature', () => {
  it('check header', async () => {
    const jwe = await createJwe('signatur', encJwk, 12345);
    const jsonHeader = JSON.parse(base64url.decode(jwe.substring(0, jwe.indexOf('.')), 'utf8'));
    expect(jsonHeader.exp).toEqual(12345);
    expect(jsonHeader.cty).toEqual('NJWT');
    expect(jsonHeader.enc).toEqual('A256GCM');
    expect(jsonHeader.alg).toEqual('ECDH-ES');
    expect(jsonHeader.kid).toEqual('puk_idp_enc');
    expect(jsonHeader.epk.kty).toEqual('EC');
    expect(jsonHeader.epk.crv).toEqual('BP-256');
  });
});
