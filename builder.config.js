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
const TEST_CASES_JSON_FILE_NAME = 'test-cases-config.json';

/**
 * @type {import("electron-builder").Configuration}
 */
module.exports = {
  appId: appConfig.appId,
  productName: appConfig.title,
  copyright: 'Copyright © ' + year + ' ${author}',
  extraResources: [
    {
      from: './LICENSE.txt',
      to: 'LICENSE.txt',
    },
  ],
  win: {
    target: ['nsis'],
    publisherName: PUBLISHER_NAME,
    // extraResources: [
    //   {
    //     from: 'dist_electron/WinCertStoreLib.dll',
    //     to: 'WinCertStoreLib.dll',
    //   },
    // ],
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
    target: [
      {
        target: 'dmg',
        arch: 'universal',
      },
      {
        target: 'zip',
        arch: 'universal',
      },
    ],
    forceCodeSigning: true,
    category: 'public.app-category.utilities',
    artifactName: artifactName('${productName}', '${version}', '${ext}'),
    icon: './src/assets/logo.png',
    appId: 'de.gematik.authenticator',
    extraResources: [
      {
        from: './src/assets/certs-idp',
        to: 'certs-idp',
      },
      {
        from: './src/assets/certs-konnektor/pu',
        to: 'certs-konnektor',
      },
      {
        from: './src/assets/certs-konnektor/ru',
        to: 'certs-konnektor',
      },
      {
        from: './src/assets/' + TEST_CASES_JSON_FILE_NAME,
        to: './',
      },
    ],
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
