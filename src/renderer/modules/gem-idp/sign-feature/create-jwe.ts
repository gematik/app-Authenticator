/* * Copyright 2023 gematik GmbH * * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App * Sourcecode must be in compliance with the EUPL. * * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl * * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific * language governing permissions and limitations under the License.ee the Licence for the specific language governing * permissions and limitations under the Licence. */import { IIdpEncJwk } from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';const createJwe = async (signature: string, encJson: IIdpEncJwk, expired: number) => {  const JWK = require('node-jose/lib/jwk');  const JWE = require('node-jose/lib/jwe');  const { fromBase64 } = require('base64url');  let inputPlain = signature;  if (signature.startsWith('ey')) {    inputPlain = fromBase64(      JSON.stringify({        njwt: signature,      }),    );  }  const key = {    kid: encJson.kid,    kty: encJson.kty,    crv: encJson.crv,    x: encJson.x,    y: encJson.y,  };  JWK.asKey(key);  const opts = {    fields: {      exp: expired,      epk: {        crv: key.crv,      },      cty: 'NJWT',    },  };  const jwe = JWE.createEncrypt(opts, key);  jwe.update(Buffer.from(inputPlain));  const finalJwe = await jwe.final();  return finalJwe.protected + '..' + finalJwe.iv + '.' + finalJwe.ciphertext + '.' + finalJwe.tag;};export default createJwe;