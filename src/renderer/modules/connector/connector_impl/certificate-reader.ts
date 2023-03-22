/*
 * Copyright 2023 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
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
