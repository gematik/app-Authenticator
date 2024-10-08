import { execSync } from 'child_process';
import { platform } from 'os';
import { logger } from '@/main/services/logging';

import path from 'path';
import { IS_DEV } from '@/constants';

// Function to retrieve certificates from specific Windows certificate stores
export function getWindowsCertificates(): Array<string> {
  const edge = require('electron-edge-js');
  const allCerts: Array<string> = [];

  let assemblyFile: string = 'resources/WinCertStoreLib.dll';
  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    assemblyFile = path.join(__dirname, 'WinCertStoreLib.dll');
  }
  // #!endif

  const getCertsFromWinTrustStore = edge.func({
    assemblyFile,
    typeName: 'WinCertStoreLib.Methods',
    methodName: 'GetCertificates',
  });
  getCertsFromWinTrustStore('JavaScript', function (error: Error, result: unknown) {
    if (error) {
      logger.error('Error retrieving certificates from Windows Trust Store:', error);
      return [];
    }
    // split result string into array of certificates
    allCerts.push(...parseCertificatesString(result as string));
    logger.info('Successfully retrieved certificates from Windows Trust Store');
  });
  return allCerts;
}

// Function to parse PEM certificates into an array of certificate contents
export function parseCertificatesString(rawData: string): Array<string> {
  const certificates = rawData
    .split(/(?=-----BEGIN CERTIFICATE-----|-----BEGIN EC PRIVATE KEY-----|-----BEGIN RSA PRIVATE KEY-----)/)
    .filter(
      (cert) =>
        cert.includes('-----BEGIN CERTIFICATE-----') ||
        cert.includes('-----BEGIN EC PRIVATE KEY-----') ||
        cert.includes('-----BEGIN RSA PRIVATE KEY-----'),
    )
    .map((cert) => cert.trim());
  return certificates.length ? certificates : [];
}

// Function to retrieve certificates on macOS
export function getMacOSCertificates(): Array<string> {
  try {
    const keychains = execSync('security list-keychains')
      .toString()
      .split('\n')
      .map((kc) => kc.trim().replace(/"/g, ''));
    let allCerts: Array<string> = [];

    keychains.forEach((keychain) => {
      try {
        const rawCerts = execSync(`security find-certificate -a -p ${keychain}`).toString();
        const parsedCerts = parseCertificatesString(rawCerts);
        allCerts = allCerts.concat(parsedCerts); // Add only the certificate content
      } catch (error) {
        logger.error(`Error reading certificates from ${keychain}:`, error.message);
      }
    });

    return allCerts;
  } catch (error) {
    logger.error('Error retrieving macOS certificates:', error);
    return [];
  }
}

// Function to retrieve certificates based on the platform
export function getCertificates(): Array<string> {
  const osType = platform();

  if (osType === 'darwin') {
    // macOS
    return getMacOSCertificates();
  } else if (osType === 'win32') {
    // Windows
    return getWindowsCertificates();
  } else {
    return [];
  }
}
