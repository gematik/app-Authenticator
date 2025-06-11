/*
 * Copyright 2025, gematik GmbH
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

import { COMMON_USED_REGEXES } from '@/constants';

/**
 * @param signedChallenge the signed challenge as string
 * @param minLength of the challenge string
 * @param maxLength of the challenge string
 */
export function validateSignedChallenge(signedChallenge: string, minLength = 1, maxLength = 4096): boolean {
  if (signedChallenge.length < minLength || signedChallenge.length > maxLength) {
    return false; // Length check failed
  }
  return COMMON_USED_REGEXES.JWT.test(signedChallenge);
}

/**
 * todo implement a proper validation with peculiar
 * @param cardCertificate
 * @param minLength of the certificate string
 * @param maxLength of the certificate string
 */
export function validateCardCertificate(cardCertificate: string, minLength = 100, maxLength = 8000): boolean {
  if (cardCertificate.length < minLength || cardCertificate.length > maxLength) {
    return false; // Length check failed
  }
  return COMMON_USED_REGEXES.BASE64.test(cardCertificate);
}
