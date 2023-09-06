/*
 * Copyright 2023 gematik GmbH
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

import { createLogZip, getUniqueDateString } from '@/main/services/logging';
import path from 'path';

describe('test zip-a-folder', () => {
  it(' creates Zip files properly', async function () {
    const dirPath = 'reports';
    await createLogZip(dirPath);
    const zipLogFileExists = path.join(dirPath, 'authenticator-logData_' + getUniqueDateString() + '.zip');
    expect(zipLogFileExists).toBeTruthy();
  });
});
