/*
 * Copyright 2026, gematik GmbH
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

import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { PathProvider } from '@/renderer/service/path-provider';
import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';
import i18n from '@/renderer/i18n';
import { httpsReqConfig } from '@/renderer/modules/gem-idp/services/get-idp-http-config';
import { userAgent } from '@/renderer/utils/utils';
import { findSolutionLinkByError } from '@/error-solution-links';

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
        solutionLink: findSolutionLinkByError(translate('missing_idp_test_case_config_file'), 'IDP'),
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
        solutionLink: findSolutionLinkByError(statusCode.toString(), 'IDP'),
      });
    } catch (err) {
      logger.debug(err.message);
      results.push({
        title: translate('function_test_idp_reachability'),
        name: translate('accessibility_of_the_idp', { name: idpName }),
        status: TestStatus.failure,
        details: translate('accessibility_of_the_idp_error', { message: err.message, url: url }),
        solutionLink: findSolutionLinkByError(err.message, 'IDP'),
      });
    }
  }

  return results;
}

async function callIdp(url: string): Promise<number> {
  const { status } = await window.api.httpGet(url, {
    ...httpsReqConfig(),
    headers: {
      'User-Agent': userAgent,
    },
    timeout: 10000,
  });
  return status;
}

function loadAndParseConnectionTestConfig(): any {
  const filePath = PathProvider.getTestCasesPath();
  logger.info('Config file found, filepath:' + filePath);
  const buffer = window.api.readFileSync(filePath);
  const decoder = new TextDecoder('utf-8');
  return JSON.parse(decoder.decode(buffer));
}
