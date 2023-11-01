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

import i18n from '@/renderer/i18n';
import Swal from 'sweetalert2';
import { UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';

const translate = i18n.global.t;

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
    await Swal.fire({
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
