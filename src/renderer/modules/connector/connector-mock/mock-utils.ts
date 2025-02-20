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

// #!if MOCK_MODE === 'ENABLED'
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { getConfig } from '@/renderer/utils/get-configs';
import { logger } from '@/renderer/service/logger';

// create type definition from object
type TMockCertificatesValues = (typeof MOCK_CONNECTOR_CERTS_CONFIG)[keyof typeof MOCK_CONNECTOR_CERTS_CONFIG];

export const readMockCertificate = (configKey: TMockCertificatesValues, cleanCert = false): string => {
  const filePath = getConfig(configKey).value;

  if (!filePath || typeof filePath !== 'string') {
    logger.error('Please select mock certificate for: ' + configKey);
    throw new Error('Missing certificate path for ' + configKey);
  }

  try {
    const file = window.api.readFileSync(filePath, 'utf8');

    if (!cleanCert) {
      return file;
    }

    return file?.replace(/[\n\r]|-(.*?)-/g, '');
  } catch (e) {
    logger.error('Missing certificate for: ' + configKey);
    throw e;
  }
};

// #!endif
