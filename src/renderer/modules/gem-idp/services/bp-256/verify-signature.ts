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
import { createHash } from 'crypto';

type TPointParams = { x: bigint; y: bigint; z: bigint };
function verifyBP256Signature(public_key: TPointParams, message: Uint8Array, signature: { r: bigint; s: bigint }) {
  const z = hash_message(message);

  const Basis_Punkt = { x: curve.gx, y: curve.gy, z: 0n };

  const w = inverseMod(signature.s, curve.n);
  const u1 = real_mod(z * w, curve.n);
  const u2 = real_mod(signature.r * w, curve.n);

  const tmp_point = point_add(scalar_mult(u1, Basis_Punkt), scalar_mult(u2, public_key));

  return real_mod(signature.r, curve.n) == real_mod(tmp_point.x, curve.n);
}

const curve = {
  // RFC-5639, BrainpoolP256r1
  name: 'brainpoolP256r1',
  // Field characteristic.
  p: 0xa9fb57dba1eea9bc3e660a909d838d726e3bf623d52620282013481d1f6e5377n,
  // Curve coefficients.
  a: 0x7d5a0975fc2c3057eef67530417affe7fb8055c126dc5c6ce94a4b44f330b5d9n,
  b: 0x26dc5c6ce94a4b44f330b5d9bbd77cbf958416295cf7e1ce6bccdc18ff8c07b6n,
  // Base point.
  gx: 0x8bd2aeb9cb7e57cb2c4b482ffc81b7afb9de27e1e3bd23c23a4453bd9ace3262n,
  gy: 0x547ef835c3dac4fd97f8461a14611dc9c27745132ded8e545c1d54c72f046997n,
  // Subgroup order.
  n: 0xa9fb57dba1eea9bc3e660a909d838d718c397aa3b561a6f7901e0e82974856a7n,
  // Subgroup cofactor.
  h: 1n,
};

function real_mod(k: bigint, p: bigint) {
  let tmp = k % p;
  while (tmp < 0) tmp = p + tmp;

  return tmp;
}

function inverseMod(k: bigint, p: bigint): bigint {
  if (k == 0n) {
    throw new Error('Invalid dividend / division by zero ');
  }

  if (k < 0n) {
    return p - inverseMod(-k, p);
  }

  // Extended Euclidean algorithm.
  let s = 0n;
  let old_s = 1n;
  let t = 1n;
  let old_t = 0n;
  let r = p;
  let old_r = k;

  while (r != 0n) {
    const quotient = old_r / r;

    [r, old_r] = [old_r - quotient * r, r];
    [s, old_s] = [old_s - quotient * s, s];
    [t, old_t] = [old_t - quotient * t, t];
  }

  const gcd = old_r;
  const x = old_s;

  if (gcd != 1n) {
    throw new Error('Assertion failed');
  }
  if (real_mod(k * x, p) != 1n) {
    throw new Error('Assertion failed');
  }

  // return x % p
  return real_mod(x, p);
}

function is_on_curve(P: TPointParams) {
  if (P.x == 0n && P.y == 0n && P.z == 1n) {
    return true;
  }

  return (P.y * P.y - P.x * P.x * P.x - curve.a * P.x - curve.b) % curve.p == 0n;
}

function point_neg(point: TPointParams) {
  // Returns -point.

  if (!is_on_curve(point)) {
    throw new Error('Assertion failed');
  }

  if (point.x == 0n && point.y == 0n && point.z == 1n) {
    return point;
  }

  const result = { x: point.x, y: real_mod(-1n * point.y, curve.p), z: 0n };

  if (!is_on_curve(result)) {
    throw new Error('Assertion failed');
  }

  return result;
}

function point_add(point1: TPointParams, point2: TPointParams) {
  if (!is_on_curve(point1)) {
    throw new Error('Assertion failed');
  }
  if (!is_on_curve(point2)) {
    throw new Error('Assertion failed');
  }

  if (point1.x == 0n && point1.y == 0n && point1.z == 1n) {
    return point2;
  }

  if (point2.x == 0n && point2.y == 0n && point2.z == 1n) {
    return point1;
  }

  const x1 = point1.x;
  const y1 = point1.y;
  const x2 = point2.x;
  const y2 = point2.y;

  if (x1 == x2 && y1 != y2) {
    return { x: 0n, y: 0n, z: 1n };
  }
  let m;
  if (x1 == x2) {
    m = (3n * x1 * x1 + curve.a) * inverseMod(2n * y1, curve.p);
  } else {
    m = (y1 - y2) * inverseMod(x1 - x2, curve.p);
  }

  const x3 = m * m - x1 - x2;
  const y3 = y1 + m * (x3 - x1);
  const result = { x: real_mod(x3, curve.p), y: real_mod(-1n * y3, curve.p), z: 0n };

  if (!is_on_curve(result)) {
    throw new Error('Assertion failed');
  }

  return result;
}

function scalar_mult(k: bigint, point: TPointParams) {
  if (!is_on_curve(point)) {
    throw new Error('Assertion failed');
  }

  if (k % curve.n == 0n || (point.x == 0n && point.y == 0n && point.z == 1n)) {
    return { x: 0n, y: 0n, z: 1n };
  }

  if (k < 0n) {
    return scalar_mult(-k, point_neg(point));
  }

  let result = { x: 0n, y: 0n, z: 1n };
  let addend = point;

  while (k != 0n) {
    let j = k;
    j = j & 1n;
    if (j != 0n) {
      result = point_add(result, addend);
    }

    addend = point_add(addend, addend);

    k = k >> 1n;
  }

  if (!is_on_curve(result)) {
    throw new Error('Assertion failed');
  }

  return result;
}

function bit_length(x: bigint) {
  return BigInt(x.toString(2).length);
}

function hash_message(message: Uint8Array) {
  const message_hash_hex = createHash('sha256').update(message).digest('hex');
  const plus_prefix = '0x' + message_hash_hex;
  const e = BigInt(plus_prefix);

  const len_e = bit_length(e);
  const len_n = bit_length(curve.n);

  let z;
  if (len_e > len_n) {
    z = e >> (bit_length(e) - bit_length(curve.n));
  } else {
    z = e;
  }

  if (!(bit_length(z) <= bit_length(curve.n))) {
    throw new Error('Assertion failed');
  }

  return z;
}

export { verifyBP256Signature };
