/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { SOAP_ACTION, SOAP_ACTION_CONTENT_TYPE } from '@/renderer/modules/connector/constants';
import { TAuthSignParameter, TContextParameter } from '../type-definitions/common-types';

import template from '@/renderer/modules/connector/assets/soap_templates/commonPTV/auth-sign.xml';
import { getConnectorEndpoint, httpReqConfig } from '@/renderer/modules/connector/services';
import { IPC_OGR_IDP_START_EVENT } from '@/constants';

export const runSoapRequest = async (
  contextParameter: TContextParameter,
  endpoint: string,
  cardHandle: string,
  authSignParameter: TAuthSignParameter,
  flowType: string,
): Promise<string> => {
  const envelope = getTemplate(cardHandle, contextParameter, authSignParameter, flowType);
  const requestHeaders = {
    'Content-Type': SOAP_ACTION_CONTENT_TYPE,
    soapAction: SOAP_ACTION.ExternalAuthenticate,
  };

  const url = getConnectorEndpoint(endpoint);
  const { data } = await window.api.httpPost(url, envelope, httpReqConfig(requestHeaders));
  return data;
};

const getTemplate = (
  cardHandle: string,
  contextParameter: TContextParameter,
  authSignParameter: TAuthSignParameter,
  flowType: string,
) => {
  return template
    .replace('{MANDANT}', contextParameter.mandantId)
    .replace('{CLIENT}', contextParameter.clientId)
    .replace('{WORKPLACE}', contextParameter.workplaceId)
    .replace('{USER}', contextParameter.userId)
    .replace('{CARDHANDLE}', cardHandle)
    .replace('{SIGNATURETYPE}', authSignParameter.signatureType)
    .replace(
      '{SIGNATURESCHEME}',
      flowType == IPC_OGR_IDP_START_EVENT
        ? authSignParameter.signatureKeycloackSchemes
        : authSignParameter.signatureCidpSchemes,
    )
    .replace('{BASE64DATA}', authSignParameter.base64data);
};
