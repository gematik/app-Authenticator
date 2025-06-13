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
 * *******

For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */


const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

const packageJsonPath = path.resolve(__dirname, '..', 'package.json');
const licenseTxtPath = path.resolve(__dirname, '..', 'LICENSE.txt');
const markerText = 'Drittsoftwareanteile:';
const licenseFileEncoding = 'win1250';

try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  const dependencies = packageJson.dependencies || {};

  let newLicenseEntries = '';

  const depNames = Object.keys(dependencies);
  for (const depName of depNames) {
    const packageJSON = require('../node_modules/' + depName + '/package.json');
    const licenseType = packageJSON.license?.type || packageJSON.license;
    newLicenseEntries += `\n\n    Komponente: ${depName}\n    Lizenz: ${licenseType}`;
    // eslint-disable-next-line no-console
    console.log(`Added license entry for ${depName}: ${licenseType}`);
  }

  const licenseTxtBuffer = fs.readFileSync(licenseTxtPath);
  let licenseTxtContent = iconv.decode(licenseTxtBuffer, licenseFileEncoding);

  const markerIndex = licenseTxtContent.indexOf(markerText);
  const textBeforeAndIncludingMarker = licenseTxtContent.substring(0, markerIndex + markerText.length);
  licenseTxtContent = textBeforeAndIncludingMarker + newLicenseEntries + '\n';

  const outputBuffer = iconv.encode(licenseTxtContent, licenseFileEncoding);
  fs.writeFileSync(licenseTxtPath, outputBuffer);
  // eslint-disable-next-line no-console
  console.log('LICENSE.txt updated successfully.');
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('Error updating LICENSE.txt:', error);
  process.exit(1); // Exit with error code so npm knows something went wrong
}
