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
