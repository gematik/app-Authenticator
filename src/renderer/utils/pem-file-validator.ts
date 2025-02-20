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
 */

import Swal from 'sweetalert2';
import forge from 'node-forge';
import * as x509 from '@peculiar/x509';

import i18n from '@/renderer/i18n';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { CERTIFICATE_VALIDATION_STATUS } from '@/constants';
import { logger } from '@/renderer/service/logger';
import { readECPrivateKey } from '@/renderer/modules/connector/connector-mock/jws-jose-tools/sign-bp-256';

const translate = i18n.global.t;

export enum PEM_TYPES {
  KEY = 'key',
  CERT = 'cert',
}

export async function checkPemFileFormat(fileContent: string, type: PEM_TYPES) {
  let isFormatLineValid: boolean;
  if (type === PEM_TYPES.CERT) {
    isFormatLineValid = checkCertificates(fileContent) === CERTIFICATE_VALIDATION_STATUS.VALID;
  } else {
    isFormatLineValid = checkPrivateKey(fileContent);
  }

  if (!isFormatLineValid) {
    await Swal.fire({
      icon: 'error',
      title: translate('selected_cert_file_is_not_valid'),
    });

    const ERROR_CODE = {
      key: ERROR_CODES.AUTHCL_1114,
      cert: ERROR_CODES.AUTHCL_1115,
    };

    throw new UserfacingError(
      `Invalid ${type} file format`,
      `${type}CertificateFile ist nicht richtig formatiert.`,
      ERROR_CODE[type],
    );
  }
}

// Function to parse certificates
export function checkCertificates(pem: string): CERTIFICATE_VALIDATION_STATUS {
  try {
    const normalizedPem = pem.replace(/\r\n/g, '\n');
    const cert = new x509.X509Certificate(normalizedPem);

    const notBefore = cert.notBefore;
    const notAfter = cert.notAfter;

    const now = new Date();

    if (now < notBefore) {
      return CERTIFICATE_VALIDATION_STATUS.NOT_VALID_YET;
    } else if (now > notAfter) {
      return CERTIFICATE_VALIDATION_STATUS.EXPIRED;
    } else {
      return CERTIFICATE_VALIDATION_STATUS.VALID;
    }
  } catch (error) {
    logger.error('Error parsing certificate: ', error);
    return CERTIFICATE_VALIDATION_STATUS.INVALID;
  }
}

export function checkPrivateKey(pem: string): boolean {
  try {
    forge.pki.privateKeyFromPem(pem);

    return true;
  } catch (error) {
    logger.warn('Error parsing private key. Try parsing as EC key:', error);

    try {
      readECPrivateKey(pem);

      logger.info('EC private key parsed successfully');

      return true;
    } catch (error) {
      logger.error('Error parsing EC private key:', error);
      return false;
    }
  }
}
