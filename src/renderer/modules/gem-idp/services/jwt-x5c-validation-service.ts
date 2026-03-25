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

import jsonwebtoken from 'jsonwebtoken';
import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';
import {
  isCertificateValid,
  isDiscoveryDocumentCertificateValid,
} from '@/renderer/modules/gem-idp/services/certificate-validation-service';
import { verifyJwtSignatureWithX5c } from '@/renderer/modules/gem-idp/services/jws-verification-service';
import { ERROR_CODES } from '@/error-codes';
import { getConfig } from '@/renderer/utils/get-configs';
import { MOCK_CONNECTOR_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';

/**
 * Validates the x5c certificate from a JWT token
 * @param jwtToken - The JWT token to validate
 * @param context - Context for logging (e.g., function name)
 * @param isDiscoveryDoc - Whether to perform discovery document specific validation
 * @returns Promise<void>
 * @throws UserfacingError if certificate validation fails
 */
export async function validateJwtX5cCertificate(
  jwtToken: string,
  context: string = 'JWT',
  isDiscoveryDoc: boolean = false,
): Promise<void> {
  try {
    // #!if MOCK_MODE === 'ENABLED'
    // on mock-mode return true
    if (getConfig(MOCK_CONNECTOR_CONFIG).value) {
      logger.debug(`Mock mode enabled - skipping x5c certificate validation for ${context}`);
      return Promise.resolve();
    }
    // #!endif

    // Decode the JWT header to extract x5c certificate
    const decodedHeader = jsonwebtoken.decode(jwtToken, { complete: true });
    if (decodedHeader && decodedHeader.header && decodedHeader.header.x5c && decodedHeader.header.x5c.length > 0) {
      const certificate = decodedHeader.header.x5c[0];
      logger.debug(`Validating x5c certificate from ${context}`);

      // Validate the certificate
      const isValid = isDiscoveryDoc
        ? await isDiscoveryDocumentCertificateValid(certificate)
        : (await isCertificateValid(certificate)).isValid;

      if (!isValid) {
        logger.error(`x5c certificate validation failed for ${context}`);
        throw new UserfacingError(
          'Certificate validation failed',
          `The provided certificate in ${context} is not valid`,
          ERROR_CODES.AUTHCL_0005,
        );
      }
      logger.debug(`x5c certificate validation successful for ${context}`);

      // For discovery documents, also verify the JWT signature
      if (isDiscoveryDoc) {
        await verifyJwtSignatureWithX5c(jwtToken, context);
      }
    } else {
      logger.error(`No x5c certificate found in JWT token from ${context}`);
      throw new UserfacingError(
        'No certificate found',
        `The JWT token from ${context} does not contain an x5c certificate`,
        ERROR_CODES.AUTHCL_0004,
      );
    }
  } catch (validationError) {
    if (validationError instanceof UserfacingError) {
      throw validationError;
    }
    logger.warn(`Could not validate x5c certificate from ${context}:`, validationError.message);
    // re-throw as a user-facing error to be caught by the caller
    throw new UserfacingError(
      'Certificate validation failed',
      `Could not validate certificate from ${context}: ${validationError.message}`,
      ERROR_CODES.AUTHCL_0005,
    );
  }
}
