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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { app, Menu, shell } from 'electron';
import { MainPathProvider } from '@/main/services/main-path-provider';
import path from 'path';

// Windows Taskbar Shortcuts
export const setWindowsTaskbarShortcuts = () => {
  // If AUTHCONFIGPATH is set, we do not show the shortcut
  const getConfigShortcut = () => {
    return process.env.AUTHCONFIGPATH
      ? []
      : [
          {
            program: 'explorer.exe',
            arguments: MainPathProvider.configDirectoryPath(),
            iconPath: path.join(__dirname, 'icons', 'dummy-icon.ico'),
            iconIndex: 0,
            title: 'Öffne Config Ordner',
            description: 'Öffnet den Config-Ordner im Explorer',
          },
        ];
  };

  app.setUserTasks([
    {
      program: 'explorer.exe',
      arguments: MainPathProvider.genLogDirectoryPath(),
      iconPath: path.join(__dirname, 'icons', 'dummy-icon.ico'),
      iconIndex: 0,
      title: 'Öffne Log Ordner',
      description: 'Öffnet den Log-Ordner im Explorer',
    },
    ...getConfigShortcut(),
    {
      program: 'explorer.exe',
      arguments: path.join(MainPathProvider.getResourcesPath(), 'certs-konnektor'),
      iconPath: path.join(__dirname, 'icons', 'dummy-icon.ico'),
      iconIndex: 0,
      title: 'Öffne Konnektor Zertifikats-Ordner',
      description: 'Öffnet den Konnektor Zertifikats-Ordner im Explorer',
    },
    {
      program: 'explorer.exe',
      arguments: path.join(MainPathProvider.getResourcesPath(), 'certs-idp'),
      iconPath: path.join(__dirname, 'icons', 'dummy-icon.ico'),
      iconIndex: 0,
      title: 'Öffne IDP Zertifikats-Ordner',
      description: 'Öffnet den IDP Zertifikats-Ordner im Explorer',
    },
  ]);
};

// macOS Dock Shortcuts
export const setMacOSDockShortcuts = async () => {
  const getConfigEntry = () => {
    return process.env.AUTHCONFIGPATH
      ? []
      : [
          {
            label: 'Öffne Config Ordner',
            click() {
              shell.openPath(MainPathProvider.configDirectoryPath());
            },
          },
        ];
  };

  const dockMenu = Menu.buildFromTemplate([
    {
      label: 'Öffne Log Ordner',
      click() {
        shell.openPath(MainPathProvider.genLogDirectoryPath());
      },
    },
    ...getConfigEntry(), // Include sensitive entries conditionally
    {
      label: 'Öffne Konnektor Zertifikats-Ordner',
      click() {
        shell.openPath(path.join(MainPathProvider.getResourcesPath(), 'certs-konnektor'));
      },
    },
    {
      label: 'Öffne IDP Zertifikats-Ordner',
      click() {
        shell.openPath(path.join(MainPathProvider.getResourcesPath(), 'certs-idp'));
      },
    },
  ]);

  app.dock.setMenu(dockMenu);
};
