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
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';
import { getCaCertsWithFilenames } from '@/renderer/utils/read-tls-certificates';
import { checkPemFileFormatSilent, PEM_TYPES } from '@/renderer/utils/pem-file-validator';
import { MACOS_DS_STORE_FILE_NAME } from '@/constants';

const translate = i18n.global.t;

export async function certsValidityTest(): Promise<TestResult> {
  try {
    const certs = [...getCaCertsWithFilenames(true), ...getCaCertsWithFilenames(false)];

    let totalCerts = 0;
    let notValidCerts = 0;
    const cleanCerts = certs.filter(({ name }) => name !== MACOS_DS_STORE_FILE_NAME);

    await Promise.all(
      cleanCerts.map(async ({ name, cert }) => {
        if (!(await checkPemFileFormatSilent(cert, PEM_TYPES.CERT))) {
          logger.info(notValidCerts, name, 'is not valid');
          notValidCerts++;
        }
        totalCerts++;
      }),
    );

    logger.info('total certs:', totalCerts);
    logger.info('invalid certs:', notValidCerts);

    if (notValidCerts > 0) {
      return {
        title: translate('function_test_general'),
        name: translate('certs_validity'),
        status: TestStatus.failure,
        details: translate('certs_validity_failure', { totalCerts: totalCerts, notValidCerts: notValidCerts }),
      };
    } else
      return {
        title: translate('function_test_general'),
        name: translate('certs_validity'),
        status: TestStatus.success,
        details: translate('certs_validity_successful', { totalCerts: totalCerts }),
      };
  } catch (err) {
    logger.debug(err);
    return {
      title: translate('function_test_general'),
      name: translate('certs_validity'),
      status: TestStatus.failure,
      details: translate('error_info') + `${err.message}`,
    };
  }
}
