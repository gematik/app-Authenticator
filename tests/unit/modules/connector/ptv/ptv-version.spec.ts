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

import { mapToPtvVersion, PtvVersion } from '@/renderer/modules/connector/ptv';

describe('mapToPtvVersion', () => {
  it('maps fixture values to the expected PTV branch', () => {
    expect(mapToPtvVersion('3.6.0')).toBe(PtvVersion.PTV3);
    expect(mapToPtvVersion('4.80.3')).toBe(PtvVersion.PTV4);
    expect(mapToPtvVersion('4.8.2')).toBe(PtvVersion.PTV4);
    expect(mapToPtvVersion('5.4.1')).toBe(PtvVersion.PTV5);
    expect(mapToPtvVersion('5.61.1')).toBe(PtvVersion.PTV5_PLUS);
    expect(mapToPtvVersion('6.0.3')).toBe(PtvVersion.PTV6);
  });

  it('uses minor >= 60 as the PTV5 / PTV5_PLUS boundary', () => {
    expect(mapToPtvVersion('5.59.99')).toBe(PtvVersion.PTV5);
    expect(mapToPtvVersion('5.60.0')).toBe(PtvVersion.PTV5_PLUS);
  });

  it('falls back to UNKNOWN for empty input', () => {
    expect(mapToPtvVersion('')).toBe(PtvVersion.UNKNOWN);
  });

  it('treats unknown future majors as PTV6 (forward-compat)', () => {
    expect(mapToPtvVersion('7.0.0')).toBe(PtvVersion.PTV6);
    expect(mapToPtvVersion('10.1.0')).toBe(PtvVersion.PTV6);
  });

  it('treats lower-than-PTV3 majors as UNKNOWN', () => {
    expect(mapToPtvVersion('2.0.0')).toBe(PtvVersion.UNKNOWN);
  });
});
