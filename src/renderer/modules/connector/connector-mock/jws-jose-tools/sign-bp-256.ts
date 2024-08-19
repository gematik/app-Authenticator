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
import { createHash, randomBytes } from 'crypto';

// Curve definition based on RFC-5639, BrainpoolP256r1
export const BP256Curve = {
  name: 'brainpoolP256r1',
  p: 0xa9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377n,
  a: 0x7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9n,
  b: 0x26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6n,
  gx: 0x8bd2aeb9cb7e57cb2c4b482ffc81b7afb9de27e1e3bd23c23a4453bd9ace3262n,
  gy: 0x547ef835c3dac4fd97f8461a14611dc9c27745132ded8e545c1d54c72f046997n,
  n: 0xa9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7n,
  h: 1n,
};

/**
 * Calculate the real modulo of a number
 * @param k
 * @param p
 */
function realMod(k: bigint, p: bigint): bigint {
  let tmp = k % p;
  while (tmp < 0) tmp = p + tmp;
  return tmp;
}

/**
 * Calculate the modular inverse of a number
 * @param k
 * @param p
 */
function inverseMod(k: bigint, p: bigint): bigint {
  if (k == 0n) {
    throw new Error('Invalid dividend / division by zero');
  }
  if (k < 0n) {
    return p - inverseMod(-k, p);
  }

  let [s, old_s] = [0n, 1n];
  let [t, old_t] = [1n, 0n];
  let [r, old_r] = [p, k];

  while (r != 0n) {
    const quotient = old_r / r;
    [r, old_r] = [old_r - quotient * r, r];
    [s, old_s] = [old_s - quotient * s, s];
    [t, old_t] = [old_t - quotient * t, t];
  }

  if (old_r != 1n) {
    throw new Error('Assertion failed');
  }

  return realMod(old_s, p);
}

/**
 * Check if a point is on the curve
 * @param P
 */
function isOnCurve(P: { x: bigint; y: bigint; z: bigint }): boolean {
  if (P.x == 0n && P.y == 0n && P.z == 1n) {
    return true;
  }
  return (P.y * P.y - P.x * P.x * P.x - BP256Curve.a * P.x - BP256Curve.b) % BP256Curve.p == 0n;
}

/**
 * Negate a point
 * @param point
 */
function point_neg(point: { x: bigint; y: bigint; z: bigint }): { x: bigint; y: bigint; z: bigint } {
  if (!isOnCurve(point)) {
    throw new Error('Assertion failed');
  }
  if (point.x == 0n && point.y == 0n && point.z == 1n) {
    return point;
  }
  return { x: point.x, y: realMod(-1n * point.y, BP256Curve.p), z: 0n };
}

/**
 * Add two points
 * @param point1
 * @param point2
 */
function pointAdd(
  point1: { x: bigint; y: bigint; z: bigint },
  point2: { x: bigint; y: bigint; z: bigint },
): { x: bigint; y: bigint; z: bigint } {
  if (!isOnCurve(point1) || !isOnCurve(point2)) {
    throw new Error('Assertion failed');
  }

  if (point1.x == 0n && point1.y == 0n && point1.z == 1n) {
    return point2;
  }
  if (point2.x == 0n && point2.y == 0n && point2.z == 1n) {
    return point1;
  }

  if (point1.x == point2.x && point1.y != point2.y) {
    return { x: 0n, y: 0n, z: 1n };
  }

  let m: bigint;
  if (point1.x == point2.x) {
    m = (3n * point1.x * point1.x + BP256Curve.a) * inverseMod(2n * point1.y, BP256Curve.p);
  } else {
    m = (point1.y - point2.y) * inverseMod(point1.x - point2.x, BP256Curve.p);
  }

  const x3 = m * m - point1.x - point2.x;
  const y3 = point1.y + m * (x3 - point1.x);
  return { x: realMod(x3, BP256Curve.p), y: realMod(-1n * y3, BP256Curve.p), z: 0n };
}

/**
 * Multiplies a point with a scalar
 * @param k
 * @param point
 */
export function scalarMult(k: bigint, point: { x: bigint; y: bigint; z: bigint }): { x: bigint; y: bigint; z: bigint } {
  if (!isOnCurve(point)) {
    throw new Error('Assertion failed');
  }

  if (k % BP256Curve.n == 0n || (point.x == 0n && point.y == 0n && point.z == 1n)) {
    return { x: 0n, y: 0n, z: 1n };
  }

  if (k < 0) {
    return scalarMult(-k, point_neg(point));
  }

  let result = { x: 0n, y: 0n, z: 1n };
  let addend = point;

  while (k != 0n) {
    if (k & 1n) {
      result = pointAdd(result, addend);
    }
    addend = pointAdd(addend, addend);
    k >>= 1n;
  }

  return result;
}

function bitLength(x: bigint): bigint {
  return BigInt(x.toString(2).length);
}

/**
 * Hash a message
 * @param message
 */
function hashMessage(message: string): bigint {
  const message_hash_hex = createHash('sha256').update(message).digest('hex');
  const e = BigInt('0x' + message_hash_hex);
  const len_e = bitLength(e);
  const len_n = bitLength(BP256Curve.n);

  if (len_e > len_n) {
    return e >> (len_e - len_n);
  } else {
    return e;
  }
}

/**
 * Generate a random number
 * @param byteCount
 */
function genRandomNumber(byteCount: number): bigint {
  return BigInt('0x' + randomBytes(byteCount).toString('hex'));
}

/**
 * Sign a message
 * @param private_key
 * @param message
 */
export function signMessage(private_key: bigint, message: string): { r: bigint; s: bigint } {
  const z = hashMessage(message);
  const Basis_Punkt = { x: BP256Curve.gx, y: BP256Curve.gy, z: 0n };

  let r = 0n;
  let s = 0n;

  while (r == 0n || s == 0n) {
    let k = BP256Curve.n;
    while (k >= BP256Curve.n) {
      k = genRandomNumber(Number(bitLength(BP256Curve.n)) >> 3);
    }

    const my_point = scalarMult(k, Basis_Punkt);
    r = realMod(my_point.x, BP256Curve.n);
    s = realMod((z + r * private_key) * inverseMod(k, BP256Curve.n), BP256Curve.n);
  }

  return { r, s };
}

/**
 * Verify a signature
 * @param public_key
 * @param message
 * @param signature
 */
export function verifySignature(
  public_key: { x: bigint; y: bigint; z: bigint },
  message: string,
  signature: { r: bigint; s: bigint },
): boolean {
  const z = hashMessage(message);
  const Basis_Punkt = { x: BP256Curve.gx, y: BP256Curve.gy, z: 0n };

  const w = inverseMod(signature.s, BP256Curve.n);
  const u1 = realMod(z * w, BP256Curve.n);
  const u2 = realMod(signature.r * w, BP256Curve.n);

  const tmp_point = pointAdd(scalarMult(u1, Basis_Punkt), scalarMult(u2, public_key));

  return realMod(signature.r, BP256Curve.n) == realMod(tmp_point.x, BP256Curve.n);
}

/**
 * Convert a hex string to a byte array
 * @param hex
 */
function hexToBytes(hex: any) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

export function base64UrlEncode(str: any): string {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Parse an EC private key
 * @param buffer
 */
function parseECPrivateKey(buffer: Buffer) {
  return buffer.slice(7, 7 + 32);
}

/**
 * Read an EC private key from a PEM string
 * @param pem
 */
export function readECPrivateKey(pem: string): bigint {
  const base64Key = pem
    .replace('-----BEGIN EC PRIVATE KEY-----', '')
    .replace('-----END EC PRIVATE KEY-----', '')
    .replace(/\n/g, '');

  const keyBuffer = Buffer.from(base64Key, 'base64');

  const privateKeyBuffer = parseECPrivateKey(keyBuffer);
  const privateKeyHex = privateKeyBuffer.toString('hex');
  return BigInt(`0x${privateKeyHex}`);
}

/**
 * Create a JWS signature and return the compact serialization
 * @param header
 * @param payload
 * @param pemKey
 */
export function createEccJWS(header: string, payload: string, pemKey: string): string {
  const headerBase64 = base64UrlEncode(header);
  const payloadBase64 = base64UrlEncode(payload);
  const signingInput = `${headerBase64}.${payloadBase64}`;

  const privKeyBigInt = readECPrivateKey(pemKey);
  const signature = signMessage(privKeyBigInt, signingInput);

  // Ensure r and s are properly padded and concatenated
  const rHex = signature.r.toString(16).padStart(64, '0');
  const sHex = signature.s.toString(16).padStart(64, '0');
  const mySigHex = rHex + sHex;

  // Check the lengths
  if (rHex.length !== 64 || sHex.length !== 64) {
    throw new Error('Invalid signature component length');
  }

  const mySigBytes = hexToBytes(mySigHex);

  return `${signingInput}.${base64UrlEncode(mySigBytes)}`;
}
// #!endif
