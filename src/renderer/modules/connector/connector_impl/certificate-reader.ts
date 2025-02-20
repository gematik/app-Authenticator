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

import { TCertReaderParameter, TContextParameter } from '../type-definitions/common-types';
import { SOAP_ACTION, SOAP_ACTION_CONTENT_TYPE } from '@/renderer/modules/connector/constants';
import templatePTV4 from '@/renderer/modules/connector/assets/soap_templates/PTV4/read-card-certificate.xml';
import templatePTV3 from '@/renderer/modules/connector/assets/soap_templates/PTV3/read-card-certificate.xml';
import { getProductTypeVersion } from '@/renderer/modules/connector/connector_impl/sds-request';
import { getConnectorEndpoint, httpReqConfig } from '@/renderer/modules/connector/services';

export const runSoapRequest = async (
  contextParameter: TContextParameter,
  endpoint: string,
  cardHandle: string,
  certReaderParameter: TCertReaderParameter,
): Promise<string> => {
  const productVersionPTV = getProductTypeVersion();
  let envelope = '';
  if (productVersionPTV.startsWith('3')) {
    envelope = getTemplateCertificateReaderPTV3(cardHandle, contextParameter, certReaderParameter);
  } else {
    envelope = getTemplateCertificateReaderPTV4(cardHandle, contextParameter, certReaderParameter);
  }

  const requestHeaders = {
    'Content-Type': SOAP_ACTION_CONTENT_TYPE,
    soapAction: SOAP_ACTION.ReadCardCertificate,
  };

  const url = getConnectorEndpoint(endpoint);
  const { data } = await window.api.httpPost(url, envelope, httpReqConfig(requestHeaders));
  return data;
};

const getTemplateCertificateReaderPTV3 = (
  cardHandle: string,
  contextParameter: TContextParameter,
  certReaderParameter: TCertReaderParameter,
) => {
  return templatePTV3
    .replace('{MANDANT}', contextParameter.mandantId)
    .replace('{CLIENT}', contextParameter.clientId)
    .replace('{WORKPLACE}', contextParameter.workplaceId)
    .replace('{USER}', contextParameter.userId)
    .replace('{CARDHANDLE}', cardHandle)
    .replace('{CERTIFICATE_REF}', certReaderParameter.certificateRef);
};

const getTemplateCertificateReaderPTV4 = (
  cardHandle: string,
  contextParameter: TContextParameter,
  certReaderParameter: TCertReaderParameter,
) => {
  return templatePTV4
    .replace('{MANDANT}', contextParameter.mandantId)
    .replace('{CLIENT}', contextParameter.clientId)
    .replace('{WORKPLACE}', contextParameter.workplaceId)
    .replace('{USER}', contextParameter.userId)
    .replace('{CARDHANDLE}', cardHandle)
    .replace('{CERTIFICATE_REF}', certReaderParameter.certificateRef)
    .replace('{CRYPT}', certReaderParameter.crypt);
};
