/*
 * Copyright 2026, gematik GmbH
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

const appConfigFactory = require('./app-config');
const FORCE_SIGNING = false;
const appConfig = appConfigFactory();
const year = new Date().getFullYear();
const IS_MOCK = process.env.MOCK_MODE === 'ENABLED';
const BUILD_TARGET = process.env.BUILD_TARGET; // 'mas', 'dmg', or undefined (both)

const getMacTargets = () => {
  if (IS_MOCK) return [{ target: 'dmg', arch: 'universal' }];
  if (BUILD_TARGET === 'mas') return [{ target: 'mas', arch: 'universal' }];
  if (BUILD_TARGET === 'dmg') return [{ target: 'dmg', arch: 'universal' }];
  return [
    { target: 'mas', arch: 'universal' },
    { target: 'dmg', arch: 'universal' },
  ];
};

const artifactName = (productName, version, ext) => {
  return IS_MOCK ? `${productName} - Mock Version ${version}.${ext}` : `${productName} ${version}.${ext}`;
};
/**
 *
 * This is necessary for Signing-Validation feature of electron-auto-updater
 * Always be sure that the signed exe contains this string as CN.
 */
const TEST_CASES_JSON_FILE_NAME = 'test-cases-config.json';
const THIRD_PARTY_LICENSES_FILE_NAME = 'third-party-licenses.html';

/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: appConfig.appId,
  productName: appConfig.title,
  buildVersion: require('./package.json').version,
  buildDependenciesFromSource: true,
  copyright: 'Copyright ' + year + ' ${author}',
  extraResources: [
    {
      from: './LICENSE.txt',
      to: 'LICENSE.txt',
    },
    {
      from: './src/assets/' + THIRD_PARTY_LICENSES_FILE_NAME,
      to: THIRD_PARTY_LICENSES_FILE_NAME,
    },
  ],
  win: {
    target: ['nsis'],
    extraResources: [
      {
        from: 'dist_electron/WinAPILib.dll',
        to: 'WinAPILib.dll',
      },
      {
        from: './resources/node-bin/win32-x64/node.exe',
        to: 'node-bin/node.exe',
      },
      {
        from: './dist_electron/node-https-helper.js',
        to: 'node-bin/node-https-helper.js',
      },
    ],
  },
  files: ['!*', 'dist_electron/*', '!**/node_gyp_bins'],
  forceCodeSigning: FORCE_SIGNING,
  nsis: {
    unicode: true,
    artifactName: artifactName('${productName} Setup', '${version}', '${ext}'),
    oneClick: false,
    perMachine: true,
    allowToChangeInstallationDirectory: false,
    createDesktopShortcut: false,
    license: 'LICENSE.txt',
    include: 'installer.nsh',
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
  mas: {
    mergeASARs: false,
    entitlements: './build/entitlements/entitlements.mac.plist',
    entitlementsInherit: './build/entitlements/entitlements.mas.inherit.plist',
    provisioningProfile: process.env['sigh_de.gematik.authenticator_appstore_macos_profile-path'],
    type: 'distribution',
    icon: './src/assets/icon.icns',
    notarize: false,
    category: 'public.app-category.utilities',

    hardenedRuntime: false,
    gatekeeperAssess: false,
  },
  mac: {
    asarUnpack: ['**/*.node'],
    target: getMacTargets(),
    hardenedRuntime: true,
    entitlements: './build/entitlements/entitlements.dmg.plist',
    entitlementsInherit: './build/entitlements/entitlements.dmg.plist',
    forceCodeSigning: true,
    category: 'public.app-category.utilities',
    bundleVersion: '15',
    extendInfo: IS_MOCK
      ? {}
      : {
          ElectronTeamID: 'A9FL89PFFL',
          CFBundleURLTypes: [
            {
              CFBundleURLSchemes: ['authenticator'],
            },
          ],
        },

    artifactName: artifactName('${productName}', '${version}', '${ext}'),
    icon: './src/assets/icon.icns',
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
      {
        from: './resources/node-bin/darwin-${arch}/bin/node',
        to: 'node-bin/node',
      },
      {
        from: './dist_electron/node-https-helper.js',
        to: 'node-bin/node-https-helper.js',
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
