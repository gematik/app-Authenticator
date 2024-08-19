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

import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { PathProvider } from '@/renderer/service/path-provider';
import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';
import i18n from '@/renderer/i18n';
import { httpsReqConfig } from '@/renderer/modules/gem-idp/services/get-idp-http-config';
import { IS_DEV, TEST_CASES_JSON_FILE_NAME } from '@/constants';

export async function idpReachabilityTest(): Promise<TestResult[]> {
  const translate = i18n.global.t;
  const results: TestResult[] = [];
  let idpList: Record<string, string> = {};

  try {
    idpList = loadAndParseConnectionTestConfig() as Record<string, string>;
  } catch (e: unknown) {
    if (e instanceof UserfacingError) {
      results.push({
        title: translate('function_test_idp_reachability'),
        name: translate('missing_idp_test_case_config_file'),
        status: TestStatus.failure,
        details: translate('please_put_the_config_file_to', { filePath: e.data.filePath }),
      });
    }

    return results;
  }

  for (const idpName in idpList) {
    const url = idpList[idpName];

    try {
      logger.info(`IDP AuthUrl from config file -( ${url} )`);
      const statusCode = await callIdp(url);
      logger.info(`IDP status code ' + ${statusCode}`);
      results.push({
        title: translate('function_test_idp_reachability'),
        name: translate('accessibility_of_the_idp', { name: idpName }),
        status: statusCode === 200 ? TestStatus.success : TestStatus.failure,
        details: translate('accessibility_of_the_idp_result', { url: url, statusCode: statusCode }),
      });
    } catch (err) {
      logger.debug(err.message);
      results.push({
        title: translate('function_test_idp_reachability'),
        name: translate('accessibility_of_the_idp', { name: idpName }),
        status: TestStatus.failure,
        details: translate('accessibility_of_the_idp_error', { message: err.message, url: url }),
      });
    }
  }

  return results;
}

async function callIdp(url: string): Promise<number> {
  const { status } = await window.api.httpGet(url, {
    ...httpsReqConfig(),
    timeout: {
      lookup: 250,
      connect: 500,
      secureConnect: 1000,
      socket: 2000,
      send: 10000,
      response: 1000,
    },
    retry: 0,
  });
  return status;
}

function loadAndParseConnectionTestConfig(): any {
  let filePath = '';

  if (window.api.isMacOS()) {
    filePath = window.api.pathJoin(PathProvider.getMacOsUserAppPath(), TEST_CASES_JSON_FILE_NAME);

    // #!if MOCK_MODE === 'ENABLED'
    if (IS_DEV) {
      filePath = window.api.pathJoin(PathProvider.getAppPath(), 'src/assets/', TEST_CASES_JSON_FILE_NAME);
    }
    // #!endif
  } else {
    // TODO: This config file must be stored on a proper location and not in the dist folder
    // C:\Program Files\gematik Authenticator\resources
    filePath = window.api.pathJoin(PathProvider.getAppPath().replace(/app.asar/i, ''), TEST_CASES_JSON_FILE_NAME);
  }

  if (!window.api.existsSync(filePath)) {
    logger.error('Config file not found: ' + filePath + '-App-path: ' + PathProvider.getAppPath());
    throw new UserfacingError('Read Config File', 'file ' + filePath + ' not found', undefined, {
      filePath,
    });
  }

  logger.info('Config file found, filepath:' + filePath);
  const buffer = window.api.readFileSync(filePath);
  const decoder = new TextDecoder('utf-8');
  return JSON.parse(decoder.decode(buffer));
}
