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

/**
 * List of deprecated/obsolete Konnektor certificates that should be removed
 * during app startup. Maintain this list in one place to avoid duplication.
 */
export const DEPRECATED_KONNEKTOR_CERTS = [
  // These got renamed so we can remove the old ones:
  'AUTH.GEM.KOMP-CA1.pem',
  'AUTH.GEM.KOMP-CA3.pem',
  'AUTH.GEM.KOMP-CA5.pem',
  'AUTH.GEM.KOMP-CA7.pem',
  // These are deprecated:
  'GEM.KOMP-CA3.pem',
  'GEM.RCA2-CROSS-GEM.RCA3.pem',
  'GEM.RCA2-CROSS-GEM.RCA6.pem',
  'GEM.RCA5-CROSS-GEM.RCA6.pem',
  'GEM.RCA6-CROSS-GEM.RCA2.pem',
  'GEM.RCA7-CROSS-GEM.RCA6.pem',
  'GEM.RCA8-CROSS-GEM.RCA6.pem',
  'GEM.RCA.RSA.BUNDLE.crt',
  'GEM.KOM.RSA.BUNDLE.crt',
  'GEM.RCA.NIST.BUNDLE.crt',
  'GEM.KOM.NIST.BUNDLE.crt',
  'GEM.KOMP-CA29_TEST-ONLY.pem',
];
