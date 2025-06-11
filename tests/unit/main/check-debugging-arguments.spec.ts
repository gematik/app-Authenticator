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
