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

import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import * as x509 from '@peculiar/x509';
import { verifyJwtSignature } from '@/renderer/modules/gem-idp/services/bp-256/bp256-utils';
import { IJsonWebKey, IJsonWebKeySet } from '@/renderer/modules/gem-idp/store/idp-service-store.d';

/**
 * Verifies the signature of a JWT using the public key from the x5c certificate
 * @param jwtToken - The JWT token to verify
 * @param context - Context for logging (e.g., function name)
 * @returns Promise<void>
 * @throws UserfacingError if signature verification fails
 */
export async function verifyJwtSignatureWithX5c(jwtToken: string, context: string = 'JWT'): Promise<void> {
  const logContext = `[${context}]`;
  logger.debug(`${logContext} Starting JWT signature verification`);

  try {
    // Decode the JWT header to extract x5c certificate
    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      logger.error(`${logContext} Invalid JWT format - expected 3 parts, got ${parts.length}`);
      throw new Error('Invalid JWT format');
    }

    logger.debug(`${logContext} JWT structure validated - 3 parts found`);

    const headerStr = Buffer.from(parts[0], 'base64').toString('utf8');
    const header = JSON.parse(headerStr);

    if (!header.x5c || header.x5c.length === 0) {
      logger.error(`${logContext} No x5c certificate found in JWT header`);
      throw new UserfacingError(
        'No certificate found',
        `The JWT token from ${context} does not contain an x5c certificate`,
        ERROR_CODES.AUTHCL_0004,
      );
    }

    const normalizedPem = header.x5c[0].replace(/\r\n/g, '\n');
    const x5cCertificate = new x509.X509Certificate(normalizedPem);
    const publicKey = x5cCertificate.publicKey;

    const isValid = await verifyJwtSignature(jwtToken, publicKey);

    if (!isValid) {
      logger.error(`${logContext} JWT signature verification failed - signature is invalid`);
      throw new UserfacingError(
        'Signature verification failed',
        `The signature of the JWT from ${context} is not valid`,
        ERROR_CODES.AUTHCL_0006,
      );
    }

    logger.debug(`${logContext} JWT signature verification completed successfully`);
  } catch (error) {
    if (error instanceof UserfacingError) {
      logger.error(`${logContext} Verification failed with user-facing error`, {
        code: error.code,
        message: error.message,
      });
      throw error;
    }

    logger.error(`${logContext} Unexpected error during JWT signature verification`, {
      errorName: error.constructor.name,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new UserfacingError(
      'Signature verification failed',
      `Could not verify signature from ${context}: ${error.message}`,
      ERROR_CODES.AUTHCL_0006,
    );
  }
}

/**
 * Verify the signature of the CHALLENGE_TOKEN against the public key
 * of the Endpoint PUK_AUTH
 * @param challengeToken - The CHALLENGE_TOKEN (JWT)
 * @param publicKeyJwk - Public key to use for verification
 * @param context - Context for logging (e.g., function name)
 * @returns Promise<void>
 * @throws UserfacingError if signature verification fails
 */
export async function verifyChallengeTokenSignature(
  challengeToken: string,
  publicKeyJwk: IJsonWebKey | IJsonWebKeySet,
  context: string,
): Promise<void> {
  const logContext = `[${context}]`;
  logger.debug(`${logContext} Starting challenge token signature verification`);

  try {
    // use publicKeyJwk as jwk
    const keyToImport = (publicKeyJwk as IJsonWebKeySet).keys
      ? ((publicKeyJwk as IJsonWebKeySet).keys[0] as IJsonWebKey)
      : (publicKeyJwk as IJsonWebKey);

    if (!keyToImport.x5c || keyToImport.x5c.length === 0) {
      logger.error(`${logContext} No x5c certificate found in JWK`);
      throw new UserfacingError(
        'No certificate found',
        `The JWT token (${context}) does not contain an x5c certificate`,
        ERROR_CODES.AUTHCL_0004,
      );
    }

    logger.debug(`${logContext} Extracting public key from JWK x5c certificate`);
    const normalizedPem = keyToImport.x5c[0].replace(/\r\n/g, '\n');
    const x5cCertificate = new x509.X509Certificate(normalizedPem);
    const publicKey = x5cCertificate.publicKey;

    logger.debug(`${logContext} Performing challenge token signature verification`);
    const isValid = await verifyJwtSignature(challengeToken, publicKey);

    if (!isValid) {
      logger.error(`${logContext} Challenge token signature verification failed - signature is invalid`);
      throw new UserfacingError(
        'Signature verification failed',
        `The signature of the JWT (Challenge Token) is not valid (${context})`,
        ERROR_CODES.AUTHCL_0006,
      );
    }

    logger.debug(`${logContext} Challenge token signature verification completed successfully`);
  } catch (error) {
    if (error instanceof UserfacingError) {
      logger.error(`${logContext} Challenge token verification failed with user-facing error`, {
        code: error.code,
        message: error.message,
      });
      throw error;
    }

    logger.error(`${logContext} Unexpected error during challenge token signature verification`, {
      errorName: error.constructor.name,
      errorMessage: error.message,
      stack: error.stack,
    });

    throw new UserfacingError(
      'Signature verification failed',
      `Could not verify signature from challenge token - ${context}: ${error.message}`,
      ERROR_CODES.AUTHCL_0006,
    );
  }
}
