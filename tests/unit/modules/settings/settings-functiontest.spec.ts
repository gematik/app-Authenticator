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

import dot from 'dot-object';

import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import * as pathProvider from '@/renderer/service/path-provider';
import { getHomedir } from '@/renderer/modules/connector/common/utils';
import { SAMPLE_CONFIG_DATA } from '@tests/utils/config-sample-data';
import { CONTEXT_PARAMETERS_CONFIG_GROUP, ENTRY_OPTIONS_CONFIG_GROUP, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { getConfig } from '@/renderer/utils/get-configs';

jest.spyOn(FileStorageRepository as any, 'saveToCm').mockReturnValue(true);

describe('settings function test', () => {
  pathProvider.PathProvider.setSystemUserTempPath(getHomedir());

  it('test FileStorageRepository', async () => {
    const fsr = new FileStorageRepository();

    fsr.clear();
    expect(fsr.exist()).toBeFalsy();

    fsr.save(SAMPLE_CONFIG_DATA);
    expect(fsr.exist()).toBeTruthy();

    expect(fsr.load()).toStrictEqual(dot.dot(SAMPLE_CONFIG_DATA));

    // clear it after tests
    fsr.clear();
  });

  it('settings.vue saveConfigValues', async () => {
    const fsr = new FileStorageRepository();
    fsr.save(SAMPLE_CONFIG_DATA);

    expect(fsr.load()).toStrictEqual(dot.dot(SAMPLE_CONFIG_DATA));

    fsr.clear();
    fsr.save(SAMPLE_CONFIG_DATA);

    expect(getConfig(CONTEXT_PARAMETERS_CONFIG_GROUP.MANDANT_ID).value).toBe('Mandant-y');
    expect(getConfig(ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME).value).toBe('127.1.1.1');
    expect(getConfig(TLS_AUTH_TYPE_CONFIG).value).toBe('ServerCertAuth');
  });
});
