/*
 * Copyright 2026, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */
import { verifyBP256Signature } from './verify-signature';
import { logger } from '@/renderer/service/logger';
import { PublicKey } from '@peculiar/x509';

function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64;
}

export async function verifyJwtSignature(jwt: string, publicKey: PublicKey): Promise<boolean> {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const message = parts[0] + '.' + parts[1];

    const signatureB64 = base64UrlToBase64(parts[2]);
    const signatureBuffer = Buffer.from(signatureB64, 'base64');
    const signature = decodeEcdsaSignature(signatureBuffer);

    const publicKeyBuffer = Buffer.from(publicKey.rawData);
    const publicKeyPoint = await convertPublicKeyToPoint(publicKeyBuffer);

    return verifyBP256Signature(publicKeyPoint, Buffer.from(message, 'utf8'), signature);
  } catch (error) {
    logger.error('JWT verification error:', error);
    return false;
  }
}

async function convertPublicKeyToPoint(publicKeyBuffer: Buffer) {
  try {
    const keyBytes = new Uint8Array(publicKeyBuffer);
    if (!keyBytes) {
      throw new Error('Could not extract key bytes from PublicKey');
    }

    return extractCoordinatesFromBytes(keyBytes);
  } catch (error) {
    logger.error('Error converting public key:', error);
    throw error;
  }
}

function extractCoordinatesFromBytes(keyBytes: Uint8Array) {
  if (keyBytes.length > 65 && keyBytes[0] === 0x30) {
    return parseSpkiPublicKey(keyBytes);
  }

  if (keyBytes.length >= 65 && keyBytes[0] === 0x04) {
    return extractUncompressed(keyBytes, 0);
  }

  if (keyBytes.length >= 33 && (keyBytes[0] === 0x02 || keyBytes[0] === 0x03)) {
    return decompressPublicKey(keyBytes);
  }

  for (let i = 0; i < keyBytes.length - 65; i++) {
    if (keyBytes[i] === 0x04) {
      if (i + 65 <= keyBytes.length) {
        return extractUncompressed(keyBytes, i);
      }
    }
  }

  if (keyBytes.length === 64) {
    const x = BigInt('0x' + Buffer.from(keyBytes.subarray(0, 32)).toString('hex'));
    const y = BigInt('0x' + Buffer.from(keyBytes.subarray(32, 64)).toString('hex'));
    return { x, y, z: 0n };
  }

  throw new Error(
    `Unsupported public key format. Length: ${keyBytes.length}, first bytes: ${Array.from(keyBytes.subarray(0, 10))
      .map((b) => '0x' + b.toString(16).padStart(2, '0'))
      .join(' ')}`,
  );
}

function parseSpkiPublicKey(spkiBytes: Uint8Array): { x: bigint; y: bigint; z: bigint } {
  let offset = 0;

  if (spkiBytes[offset] !== 0x30) {
    throw new Error('Expected SEQUENCE tag');
  }
  offset += 1;

  offset += getLengthBytes(spkiBytes, offset);

  if (spkiBytes[offset] !== 0x30) {
    throw new Error('Expected AlgorithmIdentifier SEQUENCE');
  }
  offset += 1;

  const algIdLength = parseAsn1Length(spkiBytes, offset);
  offset += getLengthBytes(spkiBytes, offset);

  offset += algIdLength;

  if (spkiBytes[offset] !== 0x03) {
    throw new Error('Expected BIT STRING tag');
  }
  offset += 1;

  offset += getLengthBytes(spkiBytes, offset);

  offset += 1;

  const publicKeyPoint = spkiBytes.subarray(offset);

  if (publicKeyPoint[0] === 0x04) {
    return extractUncompressed(publicKeyPoint, 0);
  } else if (publicKeyPoint[0] === 0x02 || publicKeyPoint[0] === 0x03) {
    return decompressPublicKey(publicKeyPoint);
  }

  throw new Error('Unknown public key point format in SPKI');
}

function parseAsn1Length(bytes: Uint8Array, offset: number): number {
  const firstByte = bytes[offset];

  if (firstByte & 0x80) {
    const lengthBytes = firstByte & 0x7f;
    let length = 0;
    for (let i = 1; i <= lengthBytes; i++) {
      length = (length << 8) | bytes[offset + i];
    }
    return length;
  } else {
    return firstByte;
  }
}

function getLengthBytes(bytes: Uint8Array, offset: number): number {
  const firstByte = bytes[offset];
  if (firstByte & 0x80) {
    return 1 + (firstByte & 0x7f);
  } else {
    return 1;
  }
}

function extractUncompressed(keyBytes: Uint8Array, offset: number) {
  const coordinateLength = 32;
  const xBytes = keyBytes.subarray(offset + 1, offset + 1 + coordinateLength);
  const yBytes = keyBytes.subarray(offset + 1 + coordinateLength, offset + 1 + 2 * coordinateLength);

  const x = BigInt('0x' + Buffer.from(xBytes).toString('hex'));
  const y = BigInt('0x' + Buffer.from(yBytes).toString('hex'));

  return { x, y, z: 0n };
}

function decompressPublicKey(compressedBytes: Uint8Array): { x: bigint; y: bigint; z: bigint } {
  const isEven = compressedBytes[0] === 0x02;
  const xBytes = compressedBytes.subarray(1, 33);
  const x = BigInt('0x' + Buffer.from(xBytes).toString('hex'));

  const curve = {
    p: 0xa9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377n,
    a: 0x7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9n,
    b: 0x26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6n,
  };

  const rightSide = (x * x * x + curve.a * x + curve.b) % curve.p;
  const y = modularSquareRoot(rightSide, curve.p);

  const finalY = (y % 2n === 0n) === isEven ? y : curve.p - y;

  return { x, y: finalY, z: 0n };
}

function modularSquareRoot(a: bigint, p: bigint): bigint {
  if (p % 4n === 3n) {
    return modPow(a, (p + 1n) / 4n, p);
  }
  throw new Error('Complex square root calculation not implemented');
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (exponent % 2n === 1n) {
      result = (result * base) % modulus;
    }
    exponent = exponent >> 1n;
    base = (base * base) % modulus;
  }
  return result;
}

function decodeEcdsaSignature(signatureBuffer: Buffer) {
  const expectedLength = 64;

  if (signatureBuffer.length !== expectedLength) {
    if (signatureBuffer[0] === 0x30) {
      return decodeAsn1EcdsaSignature(signatureBuffer);
    }
    throw new Error(`Invalid ECDSA signature length. Expected ${expectedLength}, got ${signatureBuffer.length}`);
  }

  const rBytes = signatureBuffer.subarray(0, 32);
  const r = BigInt('0x' + rBytes.toString('hex'));

  const sBytes = signatureBuffer.subarray(32, 64);
  const s = BigInt('0x' + sBytes.toString('hex'));

  return { r, s };
}

function decodeAsn1EcdsaSignature(signatureBuffer: Buffer) {
  let offset = 0;

  if (signatureBuffer[offset] !== 0x30) {
    throw new Error('Invalid ECDSA signature format');
  }
  offset += 2;

  if (signatureBuffer[offset] !== 0x02) {
    throw new Error('Invalid r value in signature');
  }
  offset += 1;

  const rLength = signatureBuffer[offset];
  offset += 1;

  const rBytes = signatureBuffer.subarray(offset, offset + rLength);
  const r = BigInt('0x' + rBytes.toString('hex'));
  offset += rLength;

  if (signatureBuffer[offset] !== 0x02) {
    throw new Error('Invalid s value in signature');
  }
  offset += 1;

  const sLength = signatureBuffer[offset];
  offset += 1;

  const sBytes = signatureBuffer.subarray(offset, offset + sLength);
  const s = BigInt('0x' + sBytes.toString('hex'));

  return { r, s };
}
