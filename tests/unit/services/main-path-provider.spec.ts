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

import { MainPathProvider } from '@/main/services/main-path-provider';
import { isMacOS } from '@tests/utils';
import * as logging from '@/main/services/logging';

describe('MainPathProvider', () => {
  it('MainPathProvide -> genLogDirectoryPath', async function () {
    if (isMacOS()) {
      expect(MainPathProvider.logDirectoryPath).toMatch(/^\/Users\/[^/]+\/Library\/Logs\/authenticator-logging$/);
    } else {
      expect(MainPathProvider.logDirectoryPath).toMatch(
        /^C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\authenticator-logging$/,
      );
    }
  });

  it('MainPathProvide -> genZipLogDirectoryPath', async function () {
    // mock getUniqueDateString and return always the same string
    jest.spyOn(logging, 'getUniqueDateString').mockReturnValue('2024-12-31_23-59-59');

    if (isMacOS()) {
      expect(MainPathProvider.genZipLogDirectoryPath(MainPathProvider.logDirectoryPath)).toMatch(
        /^\/Users\/[^/]+\/Library\/Logs\/authenticator-logging\/authenticator-logData_2024-12-31_23-59-59.zip$/,
      );
    } else {
      expect(MainPathProvider.genZipLogDirectoryPath(MainPathProvider.logDirectoryPath)).toMatch(
        /^C:\\Users\\[^\\]+\\AppData\\Local\\Temp\\authenticator-logging\\authenticator-logData_2024-12-31_23-59-59.zip$/,
      );
    }
  });
});
