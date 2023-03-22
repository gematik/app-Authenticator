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

/**
 * @returns AppConfig
 */
module.exports = function appConfigFactory() {
  const WIDTH = 1000;
  const HEIGHT = 800;
  if (process.env.NODE_ENV === 'development') {
    return {
      resizable: true,
      allowRunningInsecureContent: true,
      webSecurity: false,
      openDevTools: true,
      installDevTools: true,
      title: 'gematik Authenticator',
      icon: './src/assets/icon.ico',
      width: WIDTH,
      height: HEIGHT,
      minHeight: HEIGHT,
      minWidth: WIDTH,
      appId: 'de.gematik.authenticator',
    };
  }

  return {
    resizable: false,
    allowRunningInsecureContent: false, // we always keep this FALSE as it is secure
    webSecurity: true, // we always keep this TRUE as it is secure
    openDevTools: false,
    installDevTools: false,
    title: 'gematik Authenticator',
    icon: './src/assets/icon.ico',
    width: WIDTH,
    height: HEIGHT,
    minHeight: HEIGHT,
    minWidth: WIDTH,
    appId: 'de.gematik.authenticator',
  };
};
