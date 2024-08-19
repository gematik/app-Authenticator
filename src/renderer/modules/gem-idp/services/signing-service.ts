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
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import base64url from 'base64url';
import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { ENCRYPTION_TYPES, SIGNATURE_TYPES } from '@/renderer/modules/connector/constants';

export async function createUnsignedJws(cardCertificate: string, challenge: string) {
  try {
    const header = createJwsHeader(cardCertificate);
    const payload = createJwsPayload(challenge);

    return {
      header,
      payload,
      hashedChallenge: await createSigningInputString(header, payload),
    };
  } catch (err) {
    logger.error(`Could not create signed input. Error: ${err.message}`);
    throw new UserfacingError('JWS hashing failed', err.message, ERROR_CODES.AUTHCL_0003);
  }
}

export function createJwsPayload(challenge: string) {
  return base64url.encode(JSON.stringify({ njwt: challenge }), 'utf8');
}

function createJwsHeader(cardCertificate: string) {
  const header = {
    alg:
      ConnectorConfig.authSignParameter.signatureType === SIGNATURE_TYPES.ECC
        ? ENCRYPTION_TYPES.ECC_ALG_SHA256
        : ENCRYPTION_TYPES.RSASSA_PSS_USING_SHA256,
    x5c: [cardCertificate],
    typ: 'JWT',
    cty: 'NJWT',
  };
  return base64url.encode(JSON.stringify(header), 'utf8');
}

async function createSigningInputString(encodedHeader: string, encodedPayload: string): Promise<string> {
  const signingInputString = encodedHeader.toString() + '.' + encodedPayload.toString();
  return sha256Encode(signingInputString);
}

async function sha256Encode(input: string): Promise<string> {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(input);
  // hash the message
  const hashBuffer = await crypto.subtle.digest(ENCRYPTION_TYPES.ENCRYPT_ALG_SHA256, msgBuffer);
  return Buffer.from(new Uint8Array(hashBuffer)).toString('base64');
}

export function convertDerToConcatenated(base64urlString: string, outputLength: number): string {
  const derEncodedBytes = base64url.toBuffer(base64urlString);

  if (derEncodedBytes.length < 8 || derEncodedBytes[0] !== 0x30) {
    throw new Error('Invalid format of ECDSA signature');
  }

  let offset: number;
  if (derEncodedBytes[1] > 0) {
    offset = 2;
  } else if (derEncodedBytes[1] === 0x81) {
    offset = 3;
  } else {
    throw new Error('Invalid format of ECDSA signature');
  }

  const rLength = derEncodedBytes[offset + 1];

  let i: number;
  for (i = rLength; i > 0 && derEncodedBytes[offset + 2 + rLength - i] === 0; i--);

  const sLength = derEncodedBytes[offset + 2 + rLength + 1];

  let j: number;
  for (j = sLength; j > 0 && derEncodedBytes[offset + 2 + rLength + 2 + sLength - j] === 0; j--);

  let rawLen = Math.max(i, j);
  rawLen = Math.max(rawLen, outputLength / 2);

  if (
    (derEncodedBytes[offset - 1] & 0xff) !== derEncodedBytes.length - offset ||
    (derEncodedBytes[offset - 1] & 0xff) !== 2 + rLength + 2 + sLength ||
    derEncodedBytes[offset] !== 0x02 ||
    derEncodedBytes[offset + 2 + rLength] !== 0x02
  ) {
    throw new Error('Invalid format of ECDSA signature');
  }

  const concatenatedSignatureBytes = new Uint8Array(2 * rawLen);

  concatenatedSignatureBytes.set(derEncodedBytes.subarray(offset + 2 + rLength - i, offset + 2 + rLength), rawLen - i);
  concatenatedSignatureBytes.set(
    derEncodedBytes.subarray(offset + 2 + rLength + 2 + sLength - j, offset + 2 + rLength + 2 + sLength),
    2 * rawLen - j,
  );

  // convert concatenatedSignatureBytes into Buffer
  const buffer = Buffer.from(concatenatedSignatureBytes);
  return base64url.encode(buffer);
}
