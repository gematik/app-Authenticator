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

const appConfigFactory = require('./app-config');
const FORCE_SIGNING = false;
const appConfig = appConfigFactory();
const year = new Date().getFullYear();
const artifactName = (productName, version, ext) => {
  return process.env.MOCK_MODE === 'ENABLED'
    ? `${productName} - Mock Version ${version}.${ext}`
    : `${productName} ${version}.${ext}`;
};
/**
 *
 * This is necessary for Signing-Validation feature of electron-auto-updater
 * Always be sure that the signed exe contains this string as CN.
 */
const PUBLISHER_NAME = 'gematik GmbH';

/**
 * @type {import("electron-builder").Configuration}
 */
module.exports = {
  appId: appConfig.appId,
  productName: appConfig.title,
  copyright: 'Copyright © ' + year + ' ${author}',
  win: {
    target: ['nsis'],
    publisherName: PUBLISHER_NAME,
  },
  files: ['!*', 'dist_electron/*'],
  forceCodeSigning: FORCE_SIGNING,
  nsis: {
    unicode: true,
    artifactName: artifactName('${productName} Setup', '${version}', '${ext}'),
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: false,
    license: 'LICENSE.txt',
    include: 'build/installer.nsh',
    installerLanguages: ['de_DE'],
    publish: {
      provider: 'github',
    },
  },
  dmg: {
    publish: {
      provider: 'github',
    },
  },
  mac: {
    target: ['dmg', 'zip'], // zip will be used for auto-update
    category: 'public.app-category.utilities',
    artifactName: artifactName('${productName}', '${version}', '${ext}'),
    icon: './src/assets/logo.png',
    appId: 'de.gematik.authenticator',
  },
  directories: {
    buildResources: 'src/assets',
    output: 'release',
  },
  protocols: [
    {
      name: appConfig.title,
      schemes: ['authenticator'],
    },
  ],
};
