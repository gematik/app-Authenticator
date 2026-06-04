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

export type SemverTuple = [number, number, number];

const SEMVER_RE = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?/;

export function parseSemver(version: string | undefined | null): SemverTuple {
  if (typeof version !== 'string' || !version) return [0, 0, 0];
  const match = SEMVER_RE.exec(version.trim());
  if (!match) return [0, 0, 0];
  return [Number(match[1]) || 0, Number(match[2]) || 0, Number(match[3]) || 0];
}

export function compareSemver(a: string, b: string): number {
  const [ma, mia, pa] = parseSemver(a);
  const [mb, mib, pb] = parseSemver(b);
  if (ma !== mb) return ma - mb;
  if (mia !== mib) return mia - mib;
  return pa - pb;
}
