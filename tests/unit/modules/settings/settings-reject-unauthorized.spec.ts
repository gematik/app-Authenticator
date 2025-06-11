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
import { INITIAL_STATE } from '@/renderer/modules/settings/repository';
import { ENTRY_OPTIONS_CONFIG_GROUP } from '@/config';

jest.mock('@/constants', () => ({
  IPC_READ_CERTIFICATES: 'IPC_READ_CERTIFICATES',
  IS_TEST: true,
  PROCESS_ENVS: { MOCK_ENV: 'mock_value' },
}));

jest.mock('@/main/services/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('test implications of TLS_REJECT_UNAUTHORIZED setting on/off', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should receive TLS_REJECT_UNAUTHORIZED setting as true (default)', async () => {
    expect(INITIAL_STATE[ENTRY_OPTIONS_CONFIG_GROUP.TLS_REJECT_UNAUTHORIZED]).toBeTruthy();
  });
});
