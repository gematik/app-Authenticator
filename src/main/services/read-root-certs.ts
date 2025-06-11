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

import { execSync } from 'child_process';
import { platform } from 'os';
import { logger } from '@/main/services/logging';
import { callEdgeMethod } from '@/main/services/edge-js-dll-service';

// Function to retrieve certificates from specific Windows certificate stores
export function getWindowsCertificates(): Array<string> {
  const allCerts: Array<string> = [];

  const getCertsFromWinTrustStore = callEdgeMethod('GetCertificates');
  getCertsFromWinTrustStore('no parameter', function (error: Error, result: unknown) {
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
