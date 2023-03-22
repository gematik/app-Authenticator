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

/*
 * In this file, multiple test result processors can be defined, e.g. sonar specific reporting
 * or jest-junit for a better test result overview in Jenkins.
 */

module.exports = function () {
  require('./node_modules/jest-sonar-reporter').apply(this, arguments);
  return require('./node_modules/jest-junit').apply(this, arguments);
  // add any other processor you need
};
