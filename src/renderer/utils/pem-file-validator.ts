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

import i18n from '@/renderer/i18n';
import swal from 'sweetalert';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

const translate = i18n.global.tc;

export enum PEM_TYPES {
  KEY = 'key',
  CERT = 'cert',
}

const CERT_HEAD_AND_FOOTER_REGEX = {
  [PEM_TYPES.KEY]: {
    FILEFORMAT:
      /(-----BEGIN(.*?)KEY-----(\n|\r|\r\n)([0-9a-zA-Z\+\/=]{64}(\n|\r|\r\n))*([0-9a-zA-Z\+\/=]{1,63}(\n|\r|\r\n))?-----END(.*?)KEY-----)/, //eslint-disable-line
  },
  [PEM_TYPES.CERT]: {
    FILEFORMAT:
      /(-----BEGIN CERTIFICATE-----(\n|\r|\r\n)([0-9a-zA-Z\+\/=]{64}(\n|\r|\r\n))*([0-9a-zA-Z\+\/=]{1,63}(\n|\r|\r\n))?-----END CERTIFICATE-----)/, //eslint-disable-line
  },
};

export async function checkPemFileFormat(fileContent: string, type: PEM_TYPES) {
  const isFormatLineValid = CERT_HEAD_AND_FOOTER_REGEX[type].FILEFORMAT.test(fileContent);

  if (!isFormatLineValid) {
    await swal({
      icon: 'error',
      title: translate('selected_cert_file_is_not_valid'),
    });

    const ERROR_CODE = {
      key: ERROR_CODES.AUTHCL_1114,
      cert: ERROR_CODES.AUTHCL_1115,
    };

    throw new UserfacingError(
      `Invalid ${type} file format`,
      `${type}CertificateFile ist nicht richtig formatiert.`,
      ERROR_CODE[type],
    );
  }
}

export async function checkPemFileFormatSilent(fileContent: string, type: PEM_TYPES) {
  return CERT_HEAD_AND_FOOTER_REGEX[type].FILEFORMAT.test(fileContent);
}
