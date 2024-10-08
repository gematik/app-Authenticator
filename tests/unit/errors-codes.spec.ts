/*
 * Copyright 2024 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
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
