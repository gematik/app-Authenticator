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

import { parseSemver } from './semver';

export enum PtvVersion {
  UNKNOWN = 'UNKNOWN',
  PTV3 = 'PTV3',
  PTV4 = 'PTV4',
  PTV5 = 'PTV5',
  PTV5_PLUS = 'PTV5_PLUS',
  PTV6 = 'PTV6',
}

// gematik PTV5+ ships as 5.6X.X (head series stays 5.0–5.5); minor >= 60 is the boundary.
const PTV5_PLUS_MINOR_THRESHOLD = 60;

export function mapToPtvVersion(productTypeVersion: string): PtvVersion {
  if (!productTypeVersion) return PtvVersion.UNKNOWN;
  const [major, minor] = parseSemver(productTypeVersion);
  switch (major) {
    case 3:
      return PtvVersion.PTV3;
    case 4:
      return PtvVersion.PTV4;
    case 5:
      return minor >= PTV5_PLUS_MINOR_THRESHOLD ? PtvVersion.PTV5_PLUS : PtvVersion.PTV5;
    case 6:
      return PtvVersion.PTV6;
    default:
      return major > 6 ? PtvVersion.PTV6 : PtvVersion.UNKNOWN;
  }
}
