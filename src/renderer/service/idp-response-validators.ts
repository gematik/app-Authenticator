/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { COMMON_USED_REGEXES } from '@/constants';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

export function validateAuthResponseData(args: { sid: string; challenge: string; challenge_endpoint: string }): void {
  const error = 'Invalid auth response data received';
  if (!args.challenge_endpoint || !COMMON_USED_REGEXES.ANYTHING.test(args.challenge_endpoint)) {
    throw new UserfacingError(error, 'Invalid challenge_endpoint', ERROR_CODES.AUTHCL_0005);
  }
  if (!args.challenge || !COMMON_USED_REGEXES.CODE.test(args.challenge)) {
    throw new UserfacingError(error, 'Invalid challenge', ERROR_CODES.AUTHCL_0005);
  }
  if (!args.sid || !COMMON_USED_REGEXES.ANYTHING.test(args.sid)) {
    throw new UserfacingError(error, 'Invalid  sid', ERROR_CODES.AUTHCL_0005);
  }
}
