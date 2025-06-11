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

/**
 * @jest-environment jsdom
 */

import { ERROR_CODE_EXPLANATIONS, ERROR_CODES } from '@/error-codes';

describe('test codes', () => {
  it('checks error explanation codes are well written', function () {
    for (const errorCode in ERROR_CODES) {
      // Tests fail here? Go to @/renderer/errors/error-codes file and add meaningful explanation
      // for your error code under ERROR_CODE_EXPLANATIONS object
      expect(ERROR_CODE_EXPLANATIONS[errorCode]).toBeTruthy();
    }
  });
});
