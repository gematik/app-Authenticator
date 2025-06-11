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

// #!if MOCK_MODE === 'ENABLED'
export const MOCK_CONNECTOR_CONFIG = 'connector.mockConnector';
export const MOCK_CONNECTOR_CERTS_CONFIG = {
  SMCB_CERT: 'connector.mockSmcbCert',
  SMCB_KEY: 'connector.mockSmcbKey',
  HBA_CERT: 'connector.mockHbaCert',
  HBA_KEY: 'connector.mockHbaKey',
} as const;

export const DEVELOPER_OPTIONS = {
  IDP_CERTIFICATE_CHECK: 'developer.disableCertificateCheck',
} as const;
// #!endif
