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
import { launch as getCardTerminals } from '@/renderer/modules/connector/connector_impl/get-card-terminals-launcher';
import { logger } from '@/renderer/service/logger';
import i18n from '@/renderer/i18n';

const translate = i18n.global.t;

export async function connectorReachabilityTest(): Promise<TestResult> {
  try {
    const cardTerminals = await getCardTerminals();
    logger.debug(`Card terminal informationen: ${JSON.stringify(cardTerminals)}`);
    return {
      title: translate('function_test_general'),
      name: translate('accessibility_of_the_connector'),
      status: TestStatus.success,
      details: translate('accessibility_of_the_connector_successful'),
    };
  } catch (err) {
    logger.debug(err.message);
    return {
      title: translate('function_test_general'),
      name: translate('accessibility_of_the_connector'),
      status: TestStatus.failure,
      details: translate('error_info') + `${err.message}`,
    };
  }
}
