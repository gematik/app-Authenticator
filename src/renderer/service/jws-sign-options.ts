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

const base64url = require('base64url');

export class FinalConstants {
  // RSASSA-PSS using SHA-256 and MGF1 with SHA-256
  public static readonly RSASSA_PSS_USING_SHA256 = 'PS256';
  // RSASSA-PKCS1-v1_5 using SHA-256
  public static readonly RSASSA_PKCS1_USING_SHA256 = 'RS256';
  public static readonly ENCRYPT_ALG_SHA256 = 'SHA-256';
  public static readonly ENCODING_BASE64 = 'base64';
}

export type TJwsSignOptions = { protectedHeader: string; payload: string };

/**
 *
 * @param challenge
 * @param certificate
 */

abstract class JwsHeaderPayloadOptions {
  get header(): string | undefined {
    return this._header;
  }

  get payload(): string | undefined {
    return this._payload;
  }

  get hashedChallenge(): Promise<string> | undefined {
    return this._hashedChallenge;
  }

  private _hashedChallenge: Promise<string> | undefined;
  private _header: string | undefined;
  private _payload: string | undefined;

  protected readonly _challenge: string;
  protected readonly _cert: string;
  protected readonly _cardType: ECardTypes;

  protected constructor(challenge: string, cert: string, cardType: ECardTypes) {
    this._cert = cert;
    this._challenge = challenge;
    this._cardType = cardType;
  }

  get challenge(): string {
    return this._challenge;
  }

  get cert(): string {
    return this._cert;
  }

  get cardType(): ECardTypes {
    return this._cardType;
  }

  protected abstract createJwsOptions(sid?: string): TJwsSignOptions;

  async createSigningInputString(encodedHeader: string, encodedPayload: string): Promise<string> {
    const signingInputString = this.getComposeSigningInput(encodedHeader, encodedPayload);
    return this.sha256Encode(signingInputString);
  }

  public initializeJwsOptions(sid?: string) {
    const tJwsSignOptions = this.createJwsOptions(sid);
    this._header = tJwsSignOptions.protectedHeader;
    this._payload = tJwsSignOptions.payload;
    this._hashedChallenge = this.createSigningInputString(
      tJwsSignOptions.protectedHeader,
      tJwsSignOptions.payload,
    ).then((result) => {
      return result;
    });
    return this;
  }

  async sha256Encode(input: string): Promise<string> {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(input);
    // hash the message
    const hashBuffer = await crypto.subtle.digest(FinalConstants.ENCRYPT_ALG_SHA256, msgBuffer);
    return Buffer.from(new Uint8Array(hashBuffer)).toString(FinalConstants.ENCODING_BASE64);
  }

  /**
   * Composes the signing input for the specified JWS object parts.
   Format:
   [header-base64url].[payload-base64url]

   Params:
   firstPart – The first part, corresponding to the JWS header. Must not be null.
   secondPart – The second part, corresponding to the payload. Must not be null.
   Returns:
   The signing input string.
   * @param headerBase64Url
   * @param payloadBase64Url
   */
  private getComposeSigningInput(headerBase64Url: string, payloadBase64Url: string): string {
    return headerBase64Url.toString() + '.' + payloadBase64Url.toString();
  }

  protected base2urlEncode(inputText: any) {
    return base64url.encode(JSON.stringify(inputText), 'utf8');
  }
}

export { JwsHeaderPayloadOptions as JwsSignOptions };
