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

declare interface AppConfig {
  /**
   * Whether the window can be manually resized by the user.
   */
  resizable: boolean;
  /**
   * Allow a https page to run JavaScript, CSS or plugins from http URLs.
   */
  allowRunningInsecureContent: boolean;
  /**
   * In production always true, we use this to bypass CORS on dev mode
   */
  webSecurity: boolean;
  /**
   * When 'true', it will install the dev tools
   */
  installDevTools: boolean;
  /**
   * Open development tools on App start
   */
  openDevTools: boolean;
  /**
   * Default window title. Default is `"Electron"`. If the HTML tag `<title>` is
   * defined in the HTML file loaded by `loadURL()`, this property will be ignored.
   */
  title: string;
  /**
   * The window icon. On Windows it is recommended to use `ICO` icons to get the best
   * visual effects, you can also leave it undefined so the executable's icon will be
   * used.
   */
  icon: string;
  /**
   * Window's width in pixels. Default is `800`.
   */
  width: number;
  /**
   * Window's height in pixels. Default is `600`.
   */
  height: number;
  /**
   * Window's minimum width. Default is `0`.
   */
  minWidth: number;
  /**
   * Window's minimum height. Default is `0`.
   */
  minHeight: number;
  /**
   * The bundle app id.
   */
  appId: string;
}

declare module 'appConfig' {
  function appConfigFactory(): AppConfig;

  export = appConfigFactory;
}
