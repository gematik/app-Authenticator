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

import { getConfig } from '@/renderer/utils/get-configs';
import { DEVELOPER_OPTIONS } from '@/renderer/modules/connector/connector-mock/mock-config';
import getIdpTlsCertificates from '@/renderer/utils/get-idp-tls-certificates';
import { IDP_CIPHERS } from '@/constants';

type ReqConfigType = {
  https: { certificateAuthority: undefined | string[]; rejectUnauthorized: boolean };
  ciphers?: string;
  secureProtocol?: string;
};

export const httpsReqConfig = (): ReqConfigType => {
  let rejectUnauthorized = true;

  // #!if MOCK_MODE === 'ENABLED'
  rejectUnauthorized = !!getConfig(DEVELOPER_OPTIONS.IDP_CERTIFICATE_CHECK, true).value;
  // #!endif

  return {
    https: {
      certificateAuthority: getIdpTlsCertificates(),
      rejectUnauthorized: rejectUnauthorized,
    },
    ciphers: IDP_CIPHERS.join(':'),
    secureProtocol: 'TLSv1_2_method',
  };
};
