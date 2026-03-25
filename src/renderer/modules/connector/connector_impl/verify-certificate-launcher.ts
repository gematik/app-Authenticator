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

import { XML_TAG_NAMES } from '@/renderer/modules/connector/constants';
import ConnectorConfig from './connector-config';
import { runSoapRequest } from '@/renderer/modules/connector/connector_impl/verify-certificate';
import { getServiceEndpointTls } from './sds-request';
import { logger } from '@/renderer/service/logger';
import { checkSoapError } from '@/renderer/modules/connector/common/utils';
import {
  parseVerifyCertificateResponse,
  IVerifyCertificateResponse,
} from '@/renderer/modules/connector/common/verify-certificate-response-parser';

/**
 * Verifies a certificate using the connector
 * @param endpoint - The connector endpoint
 * @param certificate - The base64 encoded certificate to verify
 * @param verificationTime - Optional verification time reference
 * @returns {Promise<IVerifyCertificateResponse>} - The parsed response
 */
export const verifyCertificate = async (
  endpoint: string,
  certificate: string,
  verificationTime?: string,
): Promise<IVerifyCertificateResponse> => {
  const soapResponse = await runSoapRequest(ConnectorConfig.contextParameters, endpoint, certificate, verificationTime);
  return parseVerifyCertificateResponse(soapResponse);
};

/**
 * Launches the certificate verification process
 * @param certificate - The base64 encoded certificate to verify
 * @param verificationTime - Optional verification time reference
 * @returns {Promise<IVerifyCertificateResponse>} - The parsed response
 */
export const launch = async (certificate: string, verificationTime?: string): Promise<IVerifyCertificateResponse> => {
  try {
    const certificateServiceEndpoint = await getServiceEndpointTls(XML_TAG_NAMES.TAG_CERTIFICATE_SERVICE);
    logger.debug(`Using certificate service endpoint ${certificateServiceEndpoint} to verify certificate.`);
    return await verifyCertificate(certificateServiceEndpoint, certificate, verificationTime);
  } catch (err) {
    logger.error('Error verifying certificate with connector:', err.message);
    throw checkSoapError(err.response?.body) || err;
  }
};
