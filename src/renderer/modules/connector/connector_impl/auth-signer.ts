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

import { SOAP_ACTION, SOAP_ACTION_CONTENT_TYPE } from '@/renderer/modules/connector/constants';
import { TAuthSignParameter, TContextParameter } from '../type-definitions/common-types';

import template from '@/renderer/modules/connector/assets/soap_templates/commonPTV/auth-sign.xml';
import { httpReqConfig } from '@/renderer/modules/connector/services';

export const runSoapRequest = async (
  contextParameter: TContextParameter,
  endpoint: string,
  cardHandle: string,
  authSignParameter: TAuthSignParameter,
): Promise<string> => {
  const envelope = getTemplate(cardHandle, contextParameter, authSignParameter);
  const requestHeaders = {
    'Content-Type': SOAP_ACTION_CONTENT_TYPE,
    soapAction: SOAP_ACTION.ExternalAuthenticate,
  };

  const { data } = await window.api.httpPost(endpoint, envelope, httpReqConfig(requestHeaders));
  return data;
};

const getTemplate = (
  cardHandle: string,
  contextParameter: TContextParameter,
  authSignParameter: TAuthSignParameter,
) => {
  return template
    .replace('{MANDANT}', contextParameter.mandantId)
    .replace('{CLIENT}', contextParameter.clientId)
    .replace('{WORKPLACE}', contextParameter.workplaceId)
    .replace('{USER}', contextParameter.userId)
    .replace('{CARDHANDLE}', cardHandle)
    .replace('{SIGNATURETYPE}', authSignParameter.signatureType)
    .replace('{SIGNATURESCHEME}', authSignParameter.signatureCidpSchemes)
    .replace('{BASE64DATA}', authSignParameter.base64data);
};
