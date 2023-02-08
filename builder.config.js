/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
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
    license: 'LICENSE.txt',
    include: 'build/installer.nsh',
    installerLanguages: ['de_DE'],
    publish: {
      provider: 'github',
    },
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
