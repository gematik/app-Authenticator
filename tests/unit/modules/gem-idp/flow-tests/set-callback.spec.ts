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
 */

import { TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import { ALLOWED_DEEPLINK_PROTOCOLS } from '@/constants';
import { getCallback } from '@/renderer/modules/gem-idp/services/arguments-parser';
import { AuthFlowError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { alertDefinedErrorWithDataOptional } from '@/renderer/utils/utils';

jest.mock('@/renderer/utils/utils', () => ({
  ...jest.requireActual('@/renderer/utils/utils'),
  alertDefinedErrorWithDataOptional: jest.fn(),
}));

describe('AuthFlow.vue', () => {
  it('sets callback to OPEN_TAB by default', async () => {
    expect(await getCallback(null)).toEqual({ callbackType: 'OPEN_TAB', deeplink: '' });
  });

  it('sets callback to DIRECT for DIRECT value', async () => {
    expect(await getCallback(TCallback.DIRECT)).toEqual({ callbackType: 'DIRECT', deeplink: '' });
  });

  it('sets callback and deeplink for valid deeplink', async () => {
    const validDeeplink = ALLOWED_DEEPLINK_PROTOCOLS[0];
    expect(await getCallback(validDeeplink)).toEqual({ callbackType: 'DEEPLINK', deeplink: 'tim' });
  });

  it('returns false for invalid value', async () => {
    const invalidValue = 'invalid-value';

    // here we will call getCallback(invalidValue) and  this should throw an error, the error type will be AuthFlowError
    await expect(getCallback(invalidValue)).rejects.toThrow(AuthFlowError);

    expect(alertDefinedErrorWithDataOptional).toHaveBeenCalledWith(ERROR_CODES.AUTHCL_0007);
  });
});
