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

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { IncomingHttpHeaders } from 'http';
import * as process from 'node:process';

import { logger } from '@/main/services/logging';
import { TClientRes } from '@/main/services/http-client-types';

export interface HelperRequest {
  url: string;
  method: string;
  headers: Record<string, string | string[]>;
  body?: string;
  timeout: number;
  pfxBase64?: string;
  pfxPassword?: string;
  keyPem?: string;
  certPem?: string;
  caCertificates: string[];
  ciphers?: string;
  rejectUnauthorized: boolean;
  followRedirect: boolean;
  proxyUrl?: string;
  proxyUsername?: string;
  proxyPassword?: string;
}

interface HelperResponse {
  error: boolean;
  statusCode?: number;
  headers?: IncomingHttpHeaders;
  body?: string;
  url?: string;
  code?: string;
  message?: string;
  response?: {
    url?: string;
    body?: string;
    headers?: IncomingHttpHeaders;
    statusCode?: number;
  };
}

function getNodeBinaryPath(): string {
  const isWindows = process.platform === 'win32';
  const nodeBinaryName = isWindows ? 'node.exe' : 'node';

  const bundledNodePath = path.join(process.resourcesPath || '', 'node-bin', nodeBinaryName);
  if (fs.existsSync(bundledNodePath)) {
    return bundledNodePath;
  }

  return isWindows ? 'node.exe' : 'node';
}

/**
 * Check production extraResources path FIRST.
 * In production, __dirname is inside app.asar. Electron's patched fs.existsSync returns true
 * for asar paths, but the spawned Node.js process (not Electron) cannot read files from asar.
 */
function getHelperScriptPath(): string {
  const prodPath = path.join(process.resourcesPath || '', 'node-bin', 'node-https-helper.js');
  if (process.resourcesPath && fs.existsSync(prodPath)) {
    return prodPath;
  }

  const devPath = path.join(__dirname, 'node-https-helper.js');
  if (fs.existsSync(devPath)) {
    return devPath;
  }
  return devPath;
}

export function executeHelperRequest(helperRequest: HelperRequest, originalUrl: string): Promise<TClientRes> {
  return new Promise((resolve, reject) => {
    const nodeBinary = getNodeBinaryPath();
    const helperPath = getHelperScriptPath();

    const nodeProcess = spawn(nodeBinary, ['--openssl-legacy-provider', helperPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    nodeProcess.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    nodeProcess.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    nodeProcess.on('close', (code) => {
      if (stderr) {
        logger.debug('Helper stderr: ' + stderr);
      }

      try {
        const response: HelperResponse = JSON.parse(stdout);

        if (response.error) {
          reject({
            message: response.message,
            response: {
              url: response.response?.url || originalUrl,
              body: response.response?.body,
              headers: response.response?.headers,
              statusCode: response.response?.statusCode,
            },
          });
          return;
        }

        // Throw on non-2xx status codes (matching got's default throwHttpErrors behavior)
        // This is critical for SOAP fault handling where downstream code (e.g. checkSoapError)
        // relies on err.response.body to parse connector error XML
        const statusCode = response.statusCode || 0;
        if (statusCode >= 400) {
          reject({
            message: `Response code ${statusCode}`,
            response: {
              url: response.url || originalUrl,
              body: response.body,
              headers: response.headers,
              statusCode: statusCode,
            },
          });
          return;
        }

        let data: unknown;
        try {
          data = JSON.parse(response.body || '');
        } catch {
          data = response.body;
        }

        resolve({
          data: data,
          status: statusCode,
          headers: response.headers,
        });
      } catch (parseError) {
        logger.debug('Helper raw stdout: ' + (stdout || '(empty)'));
        logger.debug('Helper raw stderr: ' + (stderr || '(empty)'));
        logger.debug('Helper exit code: ' + code);

        let message: string;
        if (!stdout.trim()) {
          message = `Could not connect to ${originalUrl} (helper process exited with code ${code})`;
        } else {
          message = `Could not connect to ${originalUrl} (unexpected helper response)`;
        }

        logger.error(message);
        reject({
          message,
          response: {
            url: originalUrl,
            body: stdout || undefined,
            headers: undefined,
            statusCode: undefined,
          },
        });
      }
    });

    nodeProcess.on('error', (error) => {
      logger.error('Failed to spawn helper process', error);
      reject({
        message: 'Failed to spawn helper process: ' + error.message,
        response: {
          url: originalUrl,
          body: undefined,
          headers: undefined,
          statusCode: undefined,
        },
      });
    });

    const payload = JSON.stringify(helperRequest);
    nodeProcess.stdin.write(payload, 'utf8', () => {
      nodeProcess.stdin.end();
    });
  });
}
