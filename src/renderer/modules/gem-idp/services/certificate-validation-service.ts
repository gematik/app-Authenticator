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
import { launch as verifyCertificate } from '@/renderer/modules/connector/connector_impl/verify-certificate-launcher';
import { IVerifyCertificateResponse } from '@/renderer/modules/connector/type-definitions';
import { DISCOVERY_DOCUMENT_ROLE } from '@/constants';

/**
 * Validates a certificate using the connector's VerifyCertificate endpoint
 * @param certificate - The base64 encoded certificate to validate
 * @param verificationTime - Optional verification time reference
 * @returns {Promise<IVerifyCertificateResponse>} - The validation result
 */
export async function validateCertificate(
  certificate: string,
  verificationTime?: string,
): Promise<IVerifyCertificateResponse> {
  try {
    logger.debug('Validating certificate via Konnektor VerifyCertificate endpoint');
    const result = await verifyCertificate(certificate, verificationTime);

    // Log the validation result
    logger.debug(
      `Certificate validation via Konnektor VerifyCertificate endpoint result: ${result.verificationResult}`,
    );

    if (result.roleList && result.roleList.length > 0) {
      logger.debug(`Certificate roles: ${result.roleList.join(', ')}`);
    }

    if (result.error) {
      logger.warn(
        `Certificate validation via Konnektor VerifyCertificate endpoint error: ${result.error.code} - ${result.error.message}`,
      );
    }

    return result;
  } catch (error) {
    logger.error('Error validating certificate via Konnektor VerifyCertificate endpoint', error.message);
    throw error;
  }
}

export interface ICertificateStatus {
  isValid: boolean;
  roleList: string[];
}

/**
 * Checks if a certificate is valid
 * @param certificate - The base64 encoded certificate to validate
 * @param verificationTime - Optional verification time reference
 * @returns {Promise<ICertificateStatus>} - An object with validity status and role list
 */
export async function isCertificateValid(certificate: string, verificationTime?: string): Promise<ICertificateStatus> {
  try {
    const result = await validateCertificate(certificate, verificationTime);
    return {
      isValid: result.verificationResult === 'VALID',
      roleList: result.roleList || [],
    };
  } catch (error) {
    logger.error('Error checking certificate validity', error.message);
    return {
      isValid: false,
      roleList: [],
    };
  }
}

/**
 * Checks if a discovery document certificate is valid
 * @param certificate - The base64 encoded certificate to validate
 * @param verificationTime - Optional verification time reference
 * @returns {Promise<boolean>} - True if the certificate is valid and has the correct role, false otherwise
 */
export async function isDiscoveryDocumentCertificateValid(
  certificate: string,
  verificationTime?: string,
): Promise<boolean> {
  const status = await isCertificateValid(certificate, verificationTime);
  if (!status.isValid) {
    return false;
  }
  const hasRole = status.roleList.includes(DISCOVERY_DOCUMENT_ROLE);
  if (!hasRole) {
    logger.warn(`Discovery document certificate is missing role: ${DISCOVERY_DOCUMENT_ROLE}`);
  }
  return hasRole;
}
