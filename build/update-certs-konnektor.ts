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

/* This script downloads ROOT-CA and SUB-CA certificates from specified URLs, */
/* - removes any existing certificates in that directory before downloading new ones. */
/* - check the SHA256 hash of the downloaded files */
/* - converts them from DER to PEM format, and saves them in the specified directory. */

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import crypto from 'crypto';

const PU_CERT_DIR = path.resolve(__dirname, '../src/assets/certs-konnektor/pu');
const PU_ROOT_CA_URL = 'https://download.tsl.ti-dienste.de/ROOT-CA/';
const PU_SUB_CA_URL = 'https://download.tsl.ti-dienste.de/SUB-CA/';

const RU_CERT_DIR = path.resolve(__dirname, '../src/assets/certs-konnektor/ru');
const RU_ROOT_CA_URL = 'https://download-test.tsl.ti-dienste.de/ROOT-CA/';

async function main() {
  /*eslint-disable no-console */
  console.log('######\nUpdating PU Konnektor certificates ...\n######');
  await updateCertificates(PU_CERT_DIR, [
    { url: PU_ROOT_CA_URL, pattern: /^GEM\.RCA.*\.der$/ },
    { url: PU_SUB_CA_URL, pattern: /^GEM\.KOMP-CA.*\.der$/ },
  ]);
  /*eslint-disable no-console */
  console.log('\n######\nUpdating RU Konnektor certificates ...\n######');
  await updateCertificates(RU_CERT_DIR, [{ url: RU_ROOT_CA_URL, pattern: /^GEM\.RCA.*\.der$/ }]);
}

main().catch((err) => {
  /*eslint-disable no-console */
  console.error('Error:', err);
  process.exit(1);
});

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

async function removeFilesInDir(dir: string, excludeExtensions: string[] = []) {
  try {
    await fsPromises.access(dir);
  } catch {
    return; // Directory doesn't exist, nothing to remove
  }

  const files = await fsPromises.readdir(dir);
  for (const file of files) {
    if (excludeExtensions.some((ext) => file.endsWith(ext))) {
      continue;
    }
    const filePath = path.join(dir, file);
    if (!filePath.startsWith(path.resolve(dir))) {
      /*eslint-disable no-console */
      console.warn(`Skipping file ${file} due to potential path traversal.`);
      continue;
    }
    await fsPromises.unlink(filePath);
  }
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          file.close();
          fs.unlink(dest, () => {}); // Ignore error if file doesn't exist
          reject(new Error(`Download failed: ${url}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {}); // Ignore error if file doesn't exist
        reject(err);
      });
  });
}

function derToPem(derPath: string, pemPath: string) {
  execSync(`openssl x509 -inform der -in "${derPath}" -out "${pemPath}"`);
}

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}`));
          return;
        }
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function extractCertLinks(html: string, pattern: RegExp): string[] {
  const links: string[] = [];
  const regex = /href=["']([^"'>]+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (pattern.test(match[1])) {
      links.push(match[1]);
    }
  }
  return links;
}

async function downloadAndVerifySha256(certUrl: string, dest: string): Promise<void> {
  const sha256Url = certUrl + '.sha256';
  const sha256Dest = dest + '.sha256';

  try {
    await downloadFile(certUrl, dest);
    await downloadFile(sha256Url, sha256Dest);

    const expectedSha = (await fsPromises.readFile(sha256Dest, 'utf8')).trim().split(' ')[0].toLowerCase();
    const fileBuffer = await fsPromises.readFile(dest);
    const actualSha = crypto.createHash('sha256').update(fileBuffer).digest('hex').toLowerCase();

    if (expectedSha !== actualSha) {
      throw new Error(`SHA256 mismatch for ${dest}: expected ${expectedSha}, got ${actualSha}`);
    }
  } finally {
    await fsPromises.unlink(sha256Dest).catch(() => {}); // Ignore error if file doesn't exist
  }
}

async function updateCertificates(certDir: string, urls: { url: string; pattern: RegExp }[]) {
  await fsPromises.mkdir(certDir, { recursive: true });
  /*eslint-disable no-console */
  console.log(`Deleting certificates in ${certDir} ...`);
  await removeFilesInDir(certDir, ['.crt']);

  const certs = [];
  for (const { url, pattern } of urls) {
    const html = await fetchHtml(url);
    const links = extractCertLinks(html, pattern);
    certs.push(
      ...links.map((filename) => ({
        url: url + filename,
        filename: sanitizeFilename(filename),
      })),
    );
  }

  for (const cert of certs) {
    const dest = path.join(certDir, cert.filename);
    if (!dest.startsWith(path.resolve(certDir))) {
      /*eslint-disable no-console */
      console.warn(`Skipping ${cert.filename} due to potential path traversal.`);
      continue;
    }
    /*eslint-disable no-console */
    console.log(`Downloading ${cert.url} and verifying SHA256 ...`);
    await downloadAndVerifySha256(cert.url, dest);
  }

  for (const cert of certs) {
    const derPath = path.join(certDir, cert.filename);
    const pemPath = derPath.replace(/\.der$/, '.pem');
    if (!derPath.startsWith(path.resolve(certDir)) || !pemPath.startsWith(path.resolve(certDir))) {
      /*eslint-disable no-console */
      console.warn(`Skipping ${cert.filename} conversion due to potential path traversal.`);
      continue;
    }
    /*eslint-disable no-console */
    console.log(`Converting ${cert.filename} to PEM ...`);
    derToPem(derPath, pemPath);
  }

  for (const cert of certs) {
    const derPath = path.join(certDir, cert.filename);
    if (!derPath.startsWith(path.resolve(certDir))) {
      /*eslint-disable no-console */
      console.warn(`Skipping ${cert.filename} deletion due to potential path traversal.`);
      continue;
    }
    try {
      await fsPromises.access(derPath);
      /*eslint-disable no-console */
      console.log(`Deleting ${cert.filename} ...`);
      await fsPromises.unlink(derPath);
    } catch {
      // File doesn't exist, no need to delete
    }
  }
  /*eslint-disable no-console */
  console.log('Certificates updated successfully.');
}
