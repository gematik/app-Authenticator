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
// This script is used to delete the 'binding.gyp' file from the 'electron-edge-js' package
// in the 'node_modules' directory of the project.
// It is necessary to run this script before building the project to avoid issues with the build process
// by deleting the 'binding.gyp' gyp will not try to build the native module
// electron-edge-js ships already with prebuilt binaries

// Check if the folder exists
const fs = require('fs');
const path = require('path');
const folderPath = path.join(__dirname, '..', 'node_modules', 'electron-edge-js');

if (process.platform !== 'win32') {
  // eslint-disable-next-line no-console
  console.error('This script is only for Windows platform');
  process.exit(0);
}

if (fs.existsSync(folderPath)) {
  // delete the file 'binding.gyp'
  const filePath = path.join(folderPath, 'binding.gyp');
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    // eslint-disable-next-line no-console
    console.log('binding.gyp of electron-edge-js deleted successfully');
    process.exit(0);
  }
} else {
  // eslint-disable-next-line no-console
  console.error('electron-edge-js folder does not exist');
  process.exit(1);
}
