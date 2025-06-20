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

import { TContextParameter } from '../type-definitions';
import template from '@/renderer/modules/connector/assets/soap_templates/commonPTV/verify-pin.xml';
import { SOAP_ACTION, SOAP_ACTION_CONTENT_TYPE } from '../constants';
import { httpReqConfig } from '@/renderer/modules/connector/services';

export const runSoapRequest = async (
  contextParameter: TContextParameter,
  endpoint: string,
  cardHandle: string,
  pinType: string,
): Promise<string> => {
  const envelope = getTemplate(cardHandle, contextParameter, pinType);

  const requestHeaders = {
    'Content-Type': SOAP_ACTION_CONTENT_TYPE,
    soapAction: SOAP_ACTION.VerifyPin,
  };

  const { data } = await window.api.httpPost(
    endpoint,
    envelope,
    httpReqConfig(requestHeaders, {
      timeout: {
        request: 60_000,
      },
    }),
  );
  return data;
};

function getTemplate(cardHandle: string, contextParameter: TContextParameter, pinType: string) {
  return template
    .replace('{MANDANT}', contextParameter.mandantId)
    .replace('{CLIENT}', contextParameter.clientId)
    .replace('{WORKPLACE}', contextParameter.workplaceId)
    .replace('{USER}', contextParameter.userId)
    .replace('{CARDHANDLE}', cardHandle)
    .replace('{PINTYPE}', pinType);
}
