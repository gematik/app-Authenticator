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
