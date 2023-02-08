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
