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

import { START_ARGUMENTS_TO_PREVENT } from '@/constants';

import { hasAppRemoteDebuggingFlags } from '@/main/services/utils';

describe('Remote Debugging Flags Check', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.MOCK_MODE = undefined;
  });

  it('should return false if MOCK_MODE is ENABLED', () => {
    process.env.MOCK_MODE = 'ENABLED';
    process.argv = ['node', 'app.js', '--remote-debugging-port=someValue'];

    expect(hasAppRemoteDebuggingFlags()).toBe(false);
  });

  it('should return false if no remote debugging flags are present', () => {
    process.env.NODE_ENV = 'production';
    process.argv = ['node', 'app.js'];
    expect(hasAppRemoteDebuggingFlags()).toBe(false);
  });

  it('should return true as flag is present', () => {
    process.env.NODE_ENV = 'production';

    START_ARGUMENTS_TO_PREVENT.forEach((flag) => {
      process.argv = ['node', 'app.js', `${flag}=someValue`];
      expect(hasAppRemoteDebuggingFlags()).toBe(true);
    });
  });
});
