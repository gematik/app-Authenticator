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

import { PROCESS_ENVS, USERAGENT_HERSTELLERNAME, USERAGENT_PRODUKTNAME, WIKI_ERRORCODES_URL } from '@/constants';
import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import i18n from '@/renderer/i18n';
import { IdpError, OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import packageJson from '../../../package.json';

const translate = i18n.global.t;

function openUrlOnclick() {
  if (!WIKI_ERRORCODES_URL.includes('https')) return;
  window.api.openExternal(WIKI_ERRORCODES_URL);
}

function determineUserAgentVersion() {
  if (packageJson) {
    return packageJson.version;
  }
  if (PROCESS_ENVS.version) return PROCESS_ENVS.version;
  logger.warn("Info on VERSION not available for user-agent. set '1.0.0' as default");
  return '1.0.0';
}

export async function alertTechnicErrorAndThrow(errorCode: string, errorMsg: string) {
  const value = await Swal.fire({
    title: translate('errors.technical_error'),
    text: translate('errors.technical_error_code', { code: errorCode }),
    cancelButtonText: translate('cancel'),
    confirmButtonText: translate('errors.technical_error_wiki_link'),
    showCancelButton: true,
  });
  if (value.isConfirmed) {
    openUrlOnclick();
  }
  throw new UserfacingError(translate('errors.technical_error_code', { code: errorCode }), errorMsg, errorCode);
}

export async function alertTechnicErrorWithIconOptional(errorCode: string, iconLable?: SweetAlertIcon) {
  const value = await Swal.fire({
    title: translate('errors.technical_error'),
    text: translate('errors.technical_error_code', { code: errorCode }),
    icon: iconLable,
    cancelButtonText: translate('cancel'),
    confirmButtonText: translate('errors.technical_error_wiki_link'),
    showCancelButton: true,
  });
  if (value.isConfirmed) {
    openUrlOnclick();
  }
}

export async function alertDefinedErrorWithDataOptional(errorCode: string | undefined, errorData?: []) {
  const value = await Swal.fire({
    title: translate(`errors.${errorCode}.title`, { ...errorData }),
    text: translate(`errors.${errorCode}.text`, { ...errorData }),
    cancelButtonText: translate('cancel'),
    confirmButtonText: translate('errors.technical_error_wiki_link'),
    showCancelButton: true,
  });
  if (value.isConfirmed) {
    openUrlOnclick();
  }
}

export async function alertLoginResultWithIconAndTimer(
  iconLable: SweetAlertIcon,
  loginResult: string,
  timerValue: number,
) {
  await Swal.fire({
    icon: iconLable,
    title: translate(loginResult),
    timer: timerValue,
  });
}

export function alertWithCancelButton(errorCode: string, initValue: number, cardType: string) {
  return Swal.fire({
    title: translate(`errors.${errorCode}.title`),
    text: translate(`errors.${errorCode}.text`, { cardType }),
    cancelButtonText: translate('cancel'),
    allowOutsideClick: false,
    showConfirmButton: false,
    showCancelButton: true,
    showClass: { popup: 'swal2-show-loading-above-buttons', backdrop: 'swal2-backdrop-show' },
    hideClass: { popup: '', backdrop: '' },
    didOpen() {
      Swal.showLoading();
    },
  });
}

export function closeSwal() {
  return Swal.close;
}

export const userAgent = `${USERAGENT_PRODUKTNAME}/${determineUserAgentVersion()} ${USERAGENT_HERSTELLERNAME}/`;

export function parseUrlToIdpError(message: string): IdpError | null {
  const url = new URL(message);
  let error = null;
  if (url.searchParams.get('error')) {
    error = {
      oauth2ErrorType: parseOauthError(url.searchParams.get('error') ?? ''),
      gamatikErrorText: url.searchParams.get('gematik_error_text') ?? '',
      gematikCode: url.searchParams.get('gematik_code') ?? '',
    };
  }
  return error;
}

export function parseErrorMessageToIDPError(message: string): IdpError {
  const errorMap = new Map();
  if (message) {
    message.split(',').forEach(function (entry) {
      const keyValue = entry.split(':');
      const regex = /[\\"{}]/g;
      errorMap.set(keyValue[0].replaceAll(regex, ''), keyValue[1].replaceAll(regex, ''));
    });
  }

  return {
    oauth2ErrorType: parseOauthError(errorMap.get('error')),
    gamatikErrorText: errorMap.get('gematik_error_text'),
    gematikCode: errorMap.get('gematik_code'),
  };
}

export function parseOauthError(error: string): OAUTH2_ERROR_TYPE | undefined {
  switch (error) {
    case 'invalid_request':
      return OAUTH2_ERROR_TYPE.INVALID_REQUEST;
    case 'access_denied':
      return OAUTH2_ERROR_TYPE.ACCESS_DENIED;
    case 'unauthorized_client':
      return OAUTH2_ERROR_TYPE.UNAUTHORIZED_CLIENT;
    case 'unsupported_response_type':
      return OAUTH2_ERROR_TYPE.UNSUPPORTED_RESPONSE_TYPE;
    case 'invalid_scope':
      return OAUTH2_ERROR_TYPE.INVALID_SCOPE;
    case 'server_error':
      return OAUTH2_ERROR_TYPE.SERVER_ERROR;
    case 'temporarily_unavailable':
      return OAUTH2_ERROR_TYPE.TEMPORARILY_UNAVAILABLE;
    case 'invalid_client':
      return OAUTH2_ERROR_TYPE.INVALID_CLIENT;
    case 'invalid_grant':
      return OAUTH2_ERROR_TYPE.INVALID_GRANT;
    case 'unsupported_grant_type':
      return OAUTH2_ERROR_TYPE.UNSUPPORTED_GRANT_TYPE;
  }
}

export function createRedirectDeeplink(protocol: string, redirectIdp: string): string {
  const url = new URL(redirectIdp);
  return `${protocol}://${url.searchParams}`;
}
