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

/**
 * To get .well-known information from the IdP, we need to parse the challengePath
 * and get the host name of it
 */
export function removeLastPartOfChallengePath(challengePath: string) {
  const parsedChallengePath = new URL(challengePath || '');
  const path = removeLastPartOfPath(parsedChallengePath.pathname);
  let idpHost = parsedChallengePath.protocol + '//' + parsedChallengePath.host + '/' + path;
  if (idpHost.endsWith('/')) {
    idpHost = idpHost.slice(0, -1);
  }
  return idpHost;
}

/**
 * Removes the last part of an url path
 * @param path
 */

function removeLastPartOfPath(path: string) {
  const pathParts = path
    .trim()
    .split('/')
    .filter(function (pathPart) {
      return pathPart.length > 0;
    });
  if (pathParts.length > 0) {
    pathParts.pop();
  }
  return pathParts.join('/');
}

/**
 * Fallback function to removeLastPartOfChallengePath, for parsing the url to the .well-known of the IDP
 */
export function removePathFromChallenge(challengePath: string) {
  const parsedChallengePath = new URL(challengePath || '');
  return parsedChallengePath.protocol + '//' + parsedChallengePath.host;
}
