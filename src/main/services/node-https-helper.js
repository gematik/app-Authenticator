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

/**
 * Node.js HTTP/HTTPS Helper with Brainpool ECC mTLS support
 * This script must be run with: node --openssl-legacy-provider node-https-helper.js
 *
 * It receives JSON request via stdin and outputs JSON response to stdout.
 * Replaces 'got' library to use OpenSSL instead of BoringSSL for Brainpool support.
 */

const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');

// Read input from stdin
let inputData = '';

process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  let request;
  try {
    request = JSON.parse(inputData);
  } catch (error) {
    return outputError('PARSE_ERROR', 'Failed to parse input JSON: ' + error.message);
  }

  try {
    performRequest(request);
  } catch (error) {
    outputError('REQUEST_ERROR', 'Request failed: ' + error.message);
  }
});

function outputResponse(response) {
  const data = JSON.stringify(response);
  process.stdout.write(data, () => {
    process.exit(0);
  });
}

function outputError(code, message, response = null) {
  const data = JSON.stringify({
    error: true,
    code: code,
    message: message,
    response: response,
  });
  process.stdout.write(data, () => {
    process.exit(1);
  });
}

// Returns the appropriate http module for connecting to the proxy (http or https)
function getProxyHttpModule(proxyObj) {
  return proxyObj.protocol === 'https:' ? https : http;
}

// Returns proxy auth headers if credentials are provided, empty object otherwise
function getProxyAuthHeaders(proxyObj) {
  if (proxyObj.username && proxyObj.password) {
    const auth = Buffer.from(`${proxyObj.username}:${proxyObj.password}`).toString('base64');
    return { 'Proxy-Authorization': `Basic ${auth}` };
  }
  return {};
}

function performRequest(request) {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    pfxPassword,
    pfxBase64,
    keyPem,
    certPem,
    caCertificates = [],
    ciphers,
    rejectUnauthorized = true,
    followRedirect = false,
    cookieJar = {},
  } = request;

  // Validate URL
  if (!url || typeof url !== 'string') {
    return outputError('INVALID_URL', 'URL is missing or not a string: ' + JSON.stringify(url));
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return outputError('INVALID_URL', 'URL must start with http:// or https://: ' + url);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return outputError('INVALID_URL', 'Failed to parse URL: ' + url + ' - ' + e.message);
  }

  const isHttps = parsedUrl.protocol === 'https:';

  // Get proxy from request parameters (passed from http-client.ts via proxyResolver)
  let proxy = null;
  if (request.proxyUrl) {
    try {
      const proxyUrl = new URL(request.proxyUrl);
      proxy = {
        host: proxyUrl.hostname,
        port: Number.parseInt(proxyUrl.port) || (proxyUrl.protocol === 'https:' ? 443 : 80),
        protocol: proxyUrl.protocol,
        username: request.proxyUsername || proxyUrl.username || undefined,
        password: request.proxyPassword || proxyUrl.password || undefined,
      };
    } catch (e) {
      // Invalid proxy URL, continue without proxy
      outputError('INVALID_PROXY_URL', 'Failed to parse proxy URL: ' + request.proxyUrl + ' - ' + e.message);
    }
  }

  // Custom CA certificates for server verification (e.g. Konnektor CA chain, IDP CA chain).
  // PFX is only for mTLS client authentication and is independent of CA verification.
  const ca = caCertificates.length > 0 ? caCertificates : undefined;

  // Build request options
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (isHttps ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: method,
    headers: headers,
    timeout: timeout,
  };

  // Add HTTPS-specific options
  if (isHttps) {
    options.ca = ca;
    options.rejectUnauthorized = rejectUnauthorized;

    // Konnektor connections use custom ciphers and require Brainpool ECC support.
    // Brainpool curves only work with TLSv1.2, so we limit maxVersion for Konnektor.
    // IDP and other connections should use default TLS settings (TLSv1.3 supported).
    if (ciphers) {
      options.ciphers = ciphers;
      options.maxVersion = 'TLSv1.2';
      options.ecdhCurve = 'brainpoolP256r1:brainpoolP384r1:brainpoolP512r1:prime256v1:secp384r1:secp521r1';
    }
  }

  // Add PFX certificate if provided (for mTLS with PKCS#12)
  if (isHttps && pfxBase64) {
    try {
      options.pfx = Buffer.from(pfxBase64, 'base64');
      if (pfxPassword) {
        options.passphrase = pfxPassword;
      }
    } catch (e) {
      return outputError('PFX_READ_ERROR', 'Failed to process PFX data: ' + e.message);
    }
  }

  // Add PEM key/cert if provided (for mTLS with PEM files)
  if (isHttps && keyPem) {
    // Pre-validate the private key to get a clear error message
    try {
      const crypto = require('node:crypto');
      const keyObj = crypto.createPrivateKey(keyPem);
      process.stderr.write(
        'PEM key loaded: type=' + keyObj.asymmetricKeyType + ', format=' + keyPem.trimStart().split('\n')[0] + '\n',
      );
    } catch (e) {
      return outputError(
        'PEM_KEY_ERROR',
        'Failed to load PEM private key: ' +
          e.message +
          ' | Key header: ' +
          (keyPem.trimStart().split('\n')[0] || '(empty)'),
      );
    }
    options.key = keyPem;
  }
  if (isHttps && certPem) {
    // Pre-validate the certificate
    try {
      const crypto = require('node:crypto');
      const certObj = new crypto.X509Certificate(certPem);
      process.stderr.write(
        'PEM cert loaded: subject=' + certObj.subject + ', format=' + certPem.trimStart().split('\n')[0] + '\n',
      );
    } catch (e) {
      return outputError(
        'PEM_CERT_ERROR',
        'Failed to load PEM certificate: ' +
          e.message +
          ' | Cert header: ' +
          (certPem.trimStart().split('\n')[0] || '(empty)'),
      );
    }
    options.cert = certPem;
  }

  // Helper to make the actual request
  // httpModuleOverride: when set, forces the use of a specific http/https module
  //   (e.g. when destination is HTTP but proxy is HTTPS, we need https module for the proxy connection)
  function makeRequest(socket = null, httpModuleOverride = null) {
    const reqOptions = { ...options };

    if (socket) {
      // Use the tunneled socket for HTTPS through proxy
      reqOptions.socket = socket;
      reqOptions.agent = false;
    }

    // Attach cookies from cookie jar to the request
    const cookieEntries = Object.entries(cookieJar);
    if (cookieEntries.length > 0) {
      const cookieString = cookieEntries.map(([name, value]) => `${name}=${value}`).join('; ');
      reqOptions.headers = { ...reqOptions.headers, Cookie: cookieString };
    }

    // Set Content-Length for POST bodies to avoid chunked encoding issues on Windows
    if (body && !reqOptions.headers['Content-Length'] && !reqOptions.headers['content-length']) {
      reqOptions.headers = { ...reqOptions.headers, 'Content-Length': Buffer.byteLength(body).toString() };
    }

    const httpModule = httpModuleOverride || (isHttps ? https : http);
    const req = httpModule.request(reqOptions, (res) => {
      res.setEncoding('utf8');
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // Collect cookies from Set-Cookie headers into the cookie jar
        const updatedCookieJar = { ...cookieJar };
        const setCookieHeaders = res.headers['set-cookie'];
        if (setCookieHeaders) {
          for (const cookieHeader of setCookieHeaders) {
            const nameValue = cookieHeader.split(';')[0];
            const eqIndex = nameValue.indexOf('=');
            if (eqIndex > 0) {
              const name = nameValue.substring(0, eqIndex).trim();
              updatedCookieJar[name] = nameValue.substring(eqIndex + 1).trim();
            }
          }
        }

        // Handle redirects if followRedirect is true
        if (followRedirect && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (socket) socket.destroy();
          return performRequest({ ...request, url: res.headers.location, cookieJar: updatedCookieJar });
        }

        outputResponse({
          error: false,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          url: url,
        });
      });
    });

    req.on('error', (error) => {
      let code = 'REQUEST_ERROR';
      if (error.message.includes('handshake')) {
        code = 'TLS_HANDSHAKE_FAILED';
      } else if (error.message.includes('certificate')) {
        code = 'CERTIFICATE_ERROR';
      } else if (error.code === 'ECONNREFUSED') {
        code = 'CONNECTION_REFUSED';
      } else if (error.code === 'ENOTFOUND') {
        code = 'HOST_NOT_FOUND';
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        code = 'TIMEOUT';
      }

      outputError(code, error.message, {
        url: url,
        body: null,
        headers: null,
        statusCode: null,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      if (socket) socket.destroy();
      outputError('TIMEOUT', 'Request timed out after ' + timeout + 'ms');
    });

    if (body) {
      req.write(body);
    }

    req.end();
  }

  // If using proxy for HTTPS, create CONNECT tunnel first
  if (proxy && isHttps) {
    const connectReq = getProxyHttpModule(proxy).request({
      host: proxy.host,
      port: proxy.port,
      method: 'CONNECT',
      path: `${parsedUrl.hostname}:${parsedUrl.port || 443}`,
      timeout: timeout,
      headers: getProxyAuthHeaders(proxy),
    });

    connectReq.on('connect', (res, socket) => {
      if (res.statusCode === 200) {
        makeRequest(socket);
      } else {
        socket.destroy();
        outputError('PROXY_ERROR', `Proxy CONNECT failed with status ${res.statusCode}`);
      }
    });

    connectReq.on('error', (error) => {
      outputError('PROXY_ERROR', `Proxy connection failed: ${error.message}`);
    });

    connectReq.on('timeout', () => {
      connectReq.destroy();
      outputError('TIMEOUT', 'Proxy connection timed out after ' + timeout + 'ms');
    });

    connectReq.end();
  } else if (proxy && !isHttps) {
    // For HTTP through proxy, just change the request target
    options.hostname = proxy.host;
    options.port = proxy.port;
    options.path = url; // Use full URL as path for HTTP proxy
    options.headers = { ...options.headers, ...getProxyAuthHeaders(proxy) };
    // Use https module if the proxy itself is HTTPS, even though the destination is HTTP
    makeRequest(null, getProxyHttpModule(proxy));
  } else {
    // Direct connection (no proxy)
    makeRequest();
  }
}
