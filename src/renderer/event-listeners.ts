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
 */

import Swal from 'sweetalert2';

import { IPC_WARN_USER } from '@/constants';
import { TUserWarnObject } from '@/@types/common-types';
import i18n from '@/renderer/i18n';
import { logger } from '@/renderer/service/logger';

const translate = i18n.global.t;

/**
 * Listener for main process warnings
 */
window.api.on(IPC_WARN_USER, (_: Event, args: TUserWarnObject) => {
  const { swalOptions, data } = args;
  Swal.fire({
    ...swalOptions,
    title: translate('errors.technical_error'),
    text: translate('errors.technical_error_code', { code: data.code }),
  });
});

// prevent closing app by ctrl+w combination
window.addEventListener('keydown', (e) => {
  const { key, ctrlKey } = e;
  if (key === 'w' && ctrlKey) {
    logger.info('Closing app by keyboard combination blocked!');
    e.preventDefault();
  }
});

// prevent opening a new instance on ctrl+click
window.addEventListener('click', (e) => {
  const target = e?.target as HTMLElement;
  if (e.ctrlKey && target?.tagName?.toLowerCase() === 'a') {
    logger.info('Opening a new instance blocked!');
    e.preventDefault();
  }
});
