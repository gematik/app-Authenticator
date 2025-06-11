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

import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';
import { getCaCertsWithFilenames } from '@/renderer/utils/read-tls-certificates';
import { checkCertificates } from '@/renderer/utils/pem-file-validator';
import { CERTIFICATE_VALIDATION_STATUS } from '@/constants';

const translate = i18n.global.t;

export async function certsValidityTest(): Promise<TestResult> {
  try {
    const certs = [...getCaCertsWithFilenames(true), ...getCaCertsWithFilenames(false)];

    let totalCerts = 0;
    const invalidCertNames: string[] = [];

    await Promise.all(
      certs.map(async ({ name, cert }) => {
        if (checkCertificates(cert) !== CERTIFICATE_VALIDATION_STATUS.VALID) {
          logger.info(invalidCertNames, name, 'is not valid');
          invalidCertNames.push(name);
        }
        totalCerts++;
      }),
    );

    logger.info('total certs:', totalCerts);
    logger.info('invalid certs:', invalidCertNames);

    if (invalidCertNames.length > 0) {
      return {
        title: translate('function_test_general'),
        name: translate('certs_validity'),
        status: TestStatus.failure,
        details: translate('certs_validity_failure', {
          totalCerts: totalCerts,
          notValidCerts: invalidCertNames.length,
          // list each cert name one below the other
          certNames: '- ' + invalidCertNames.join('<br>- '),
        }),
      };
    }
    if (totalCerts > 0 && invalidCertNames.length === 0) {
      return {
        title: translate('function_test_general'),
        name: translate('certs_validity'),
        status: TestStatus.success,
        details: translate('certs_validity_successful', {
          totalCerts: totalCerts,
        }),
      };
    } else {
      return {
        title: translate('function_test_general'),
        name: translate('certs_validity'),
        status: TestStatus.warning,
        details: translate('certs_validity_not_found'),
      };
    }
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
