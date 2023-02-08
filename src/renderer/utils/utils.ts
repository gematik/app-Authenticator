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

import { PROCESS_ENVS, WIKI_ERRORCODES_URL, USERAGENT_PRODUKTNAME, USERAGENT_HERSTELLERNAME } from '@/constants';
import { logger } from '@/renderer/service/logger';
import { UserfacingError } from '@/renderer/errors/errors';
import swal from 'sweetalert';
import i18n from '@/renderer/i18n';

const translate = i18n.global.tc;
const packageJson = require('../../../package.json');

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
  const value = await swal({
    title: translate('errors.technical_error'),
    text: translate('errors.technical_error_code', { code: errorCode }),
    buttons: {
      cancel: { text: translate('cancel'), value: 0, visible: true },
      ok: { text: translate('errors.technical_error_wiki_link'), value: 1, visible: true },
    },
  });
  if (value) {
    openUrlOnclick();
  }
  throw new UserfacingError(translate('errors.technical_error_code', { code: errorCode }), errorMsg, errorCode);
}

export async function alertTechnicErrorWithIconOptional(errorCode: string, iconLable?: string) {
  const value = await swal({
    title: translate('errors.technical_error'),
    text: translate('errors.technical_error_code', { code: errorCode }),
    icon: iconLable,
    buttons: {
      cancel: { text: translate('cancel'), value: 0, visible: true },
      ok: { text: translate('errors.technical_error_wiki_link'), value: 1, visible: true },
    },
  });
  if (value) {
    openUrlOnclick();
  }
}

export async function alertDefinedErrorWithDataOptional(errorCode: string | undefined, errorData?: []) {
  const value = await swal({
    title: translate(`errors.${errorCode}.title`, { ...errorData }),
    text: translate(`errors.${errorCode}.text`, { ...errorData }),
    buttons: {
      cancel: { text: translate('cancel'), value: 0, visible: true },
      ok: { text: translate('errors.technical_error_wiki_link'), value: 1, visible: true },
    },
  });
  if (value) {
    openUrlOnclick();
  }
}

export async function alertLoginResultWithIconAndTimer(iconLable: string, loginResult: string, timerValue: number) {
  await swal({
    icon: iconLable,
    title: translate(loginResult),
    timer: timerValue,
  });
}

export function alertWithCancelButton(errorCode: string, initValue: number, cardType: string) {
  return swal({
    title: translate(`errors.${errorCode}.title`),
    text: translate(`errors.${errorCode}.text`, { cardType }),
    closeOnEsc: false,
    closeOnClickOutside: false,
    buttons: {
      cancel: { text: translate('cancel'), value: initValue, visible: true },
    },
  });
}

export function closeSwal() {
  return swal.close;
}

export const userAgent = `${USERAGENT_PRODUKTNAME}/${determineUserAgentVersion()} ${USERAGENT_HERSTELLERNAME}/`;
