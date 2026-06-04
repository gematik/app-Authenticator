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

import { compareSemver, parseSemver } from '@/renderer/modules/connector/ptv/semver';

describe('semver helper', () => {
  it('parses well-formed versions', () => {
    expect(parseSemver('4.80.3')).toEqual([4, 80, 3]);
    expect(parseSemver('6.0.3')).toEqual([6, 0, 3]);
    expect(parseSemver('7.5.4')).toEqual([7, 5, 4]);
  });

  it('parses two-segment and one-segment versions', () => {
    expect(parseSemver('7.4')).toEqual([7, 4, 0]);
    expect(parseSemver('6')).toEqual([6, 0, 0]);
  });

  it('returns zero tuple for empty, nullish, and malformed input', () => {
    expect(parseSemver('')).toEqual([0, 0, 0]);
    expect(parseSemver('xyz')).toEqual([0, 0, 0]);
    expect(parseSemver(undefined)).toEqual([0, 0, 0]);
    expect(parseSemver(null)).toEqual([0, 0, 0]);
  });

  it('compares minors numerically — guards against lexical regression', () => {
    expect(compareSemver('4.10.0', '4.8.2')).toBeGreaterThan(0);
    expect(compareSemver('7.10.0', '7.9.0')).toBeGreaterThan(0);
    expect(compareSemver('7.5.4', '7.4.2')).toBeGreaterThan(0);
    expect(compareSemver('4.80.3', '4.8.2')).toBeGreaterThan(0);
  });

  it('reports equality and ordering', () => {
    expect(compareSemver('5.0.0', '5.0.0')).toBe(0);
    expect(compareSemver('5.0.1', '5.0.0')).toBeGreaterThan(0);
    expect(compareSemver('5.0.0', '5.0.1')).toBeLessThan(0);
  });
});
