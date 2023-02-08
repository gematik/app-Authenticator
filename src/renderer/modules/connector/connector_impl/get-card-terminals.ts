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
import { TContextParameter } from '../type-definitions/common-types';
import template from '@/renderer/modules/connector/assets/soap_templates/commonPTV/get-card-terminals.xml';
import { getConnectorEndpoint, httpReqConfig } from '@/renderer/modules/connector/services';

export const runSoapRequest = async (contextParameter: TContextParameter, endpoint: string): Promise<string> => {
  const envelope = getTemplate(contextParameter);

  const headers = {
    'Content-Type': SOAP_ACTION_CONTENT_TYPE,
    soapAction: SOAP_ACTION.GetCardTerminals,
  };

  const url = getConnectorEndpoint(endpoint);
  const { data } = await window.api.httpPost(url, envelope, httpReqConfig(headers));
  return data;
};

function getTemplate(contextParameter: TContextParameter) {
  return template
    .replace('{MANDANT}', contextParameter.mandantId)
    .replace('{CLIENT}', contextParameter.clientId)
    .replace('{WORKPLACE}', contextParameter.workplaceId);
}
