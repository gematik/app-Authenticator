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
