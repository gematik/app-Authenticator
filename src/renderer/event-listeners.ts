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
