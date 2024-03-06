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

// #!if MOCK_MODE === 'ENABLED'
import {
  DEVELOPER_OPTIONS,
  MOCK_CONNECTOR_CERTS_CONFIG,
  MOCK_CONNECTOR_CONFIG,
} from '@/renderer/modules/connector/connector-mock/mock-config';
// #!endif
import { getMatch } from 'ip-matching';
import isFQDN from 'validator/lib/isFQDN';

import { IConfig, IConfigSection, TlsAuthType } from '@/@types/common-types';
import {
  CHECK_UPDATES_AUTOMATICALLY_CONFIG,
  CONTEXT_PARAMETERS_CONFIG_GROUP,
  ENTRY_OPTIONS_CONFIG_GROUP,
  PROXY_AUTH_TYPES,
  PROXY_SETTINGS_CONFIG,
  TIMEOUT_PARAMETER_CONFIG,
  TLS_AUTH_TYPE_CONFIG,
} from '@/config';
import { COMMON_USED_REGEXES, P12_VALIDITY_TYPE } from '@/constants';
import { TRepositoryData } from '@/renderer/modules/settings/repository';
import { AuthenticatorError, UserfacingError } from '@/renderer/errors/errors';
import { ERROR_CODES } from '@/error-codes';
import { checkPemFileFormat, PEM_TYPES } from '@/renderer/utils/pem-file-validator';
import { copyUploadedFileToTargetDir } from '@/renderer/utils/read-tls-certificates';
import Swal from 'sweetalert2';
import i18n from '@/renderer/i18n';
import ConnectorIcon from '@/assets/icon-connector.svg';
import { logger } from '@/renderer/service/logger';

const translate = i18n.global.t;

export function getFormSections(repositoryData: TRepositoryData): IConfigSection[] {
  let mocked = false;
  // #!if MOCK_MODE === 'ENABLED'
  if (repositoryData[MOCK_CONNECTOR_CONFIG]) {
    mocked = true;
  }
  // #!endif

  return [
    // #!if MOCK_MODE === 'ENABLED'
    {
      title: 'Mock Konnektor',
      hide: false,
      columns: [
        {
          label: 'Status',
          key: MOCK_CONNECTOR_CONFIG,
          type: 'drop-down',
          optionsType: 'standardBool',
          infoText: translate('info_text_status'),
        },
        {
          label: 'SMC-B Certificate',
          key: MOCK_CONNECTOR_CERTS_CONFIG.SMCB_CERT,
          type: 'file-path',
          hide: !mocked,
          infoText: translate('info_text_smcb_certificate'),
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            const fieldKey = MOCK_CONNECTOR_CERTS_CONFIG.SMCB_CERT;

            if (!file) {
              throw new AuthenticatorError('Invalid certificate selected for ' + fieldKey);
            }

            const fileAsString = await file?.text();

            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.CERT);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
        {
          label: 'SMC-B Private Key',
          key: MOCK_CONNECTOR_CERTS_CONFIG.SMCB_KEY,
          type: 'file-path',
          hide: !mocked,
          infoText: translate('info_text_smcb_private_key'),
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            const fieldKey = MOCK_CONNECTOR_CERTS_CONFIG.SMCB_KEY;

            if (!file) {
              throw new AuthenticatorError('Invalid certificate selected for ' + fieldKey);
            }

            const fileAsString = await file?.text();

            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.KEY);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
        {
          label: 'HBA Certificate',
          key: MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT,
          type: 'file-path',
          hide: !mocked,
          infoText: translate('info_text_hba_certificate'),
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            const fieldKey = MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT;

            if (!file) {
              throw new AuthenticatorError('Invalid certificate selected for ' + fieldKey);
            }

            const fileAsString = await file?.text();

            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.CERT);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
        {
          label: 'HBA Private Key',
          key: MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY,
          type: 'file-path',
          optionsType: 'standardBool',
          hide: !mocked,
          infoText: translate('info_text_hba_private_key'),
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            const fieldKey = MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY;

            if (!file) {
              throw new AuthenticatorError('Invalid certificate selected for ' + fieldKey);
            }

            const fileAsString = await file?.text();

            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.KEY);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
      ],
    },
    {
      title: 'Developer Options',
      hide: false,
      columns: [
        {
          label: 'IDP Zertifikatsprüfung',
          key: DEVELOPER_OPTIONS.IDP_CERTIFICATE_CHECK,
          type: 'drop-down',
          optionsType: 'standardBool',
          infoText: 'Zertifikatsprüfung des IDP und die WANDA Applications ein oder auszuschalten.',
        },
      ],
    },
    // #!endif
    {
      title: translate('connector_settings'),
      hide: mocked,
      icon: ConnectorIcon,
      columns: [
        {
          label: translate('host'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME,
          type: 'input',
          infoText: translate('info_text_host'),
        },
        {
          label: translate('port'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.PORT,
          type: 'input',
          validationRegex: COMMON_USED_REGEXES.NUMBER,
          infoText: translate('info_text_port'),
        },
        {
          label: translate('mandant_id'),
          key: CONTEXT_PARAMETERS_CONFIG_GROUP.MANDANT_ID,
          type: 'input',
          validationRegex: COMMON_USED_REGEXES.CONNECTOR_ALLOWED,
          infoText: translate('info_text_mandant_id'),
        },
        {
          label: translate('client_id'),
          key: CONTEXT_PARAMETERS_CONFIG_GROUP.CLIENT_ID,
          type: 'input',
          validationRegex: COMMON_USED_REGEXES.CONNECTOR_ALLOWED,
          infoText: translate('info_text_client_id'),
        },
        {
          label: translate('work_space_id'),
          key: CONTEXT_PARAMETERS_CONFIG_GROUP.WORKPLACE_ID,
          type: 'input',
          validationRegex: COMMON_USED_REGEXES.CONNECTOR_ALLOWED,
          infoText: translate('info_text_work_space_id'),
        },
        {
          label: translate('tls_authentication'),
          key: TLS_AUTH_TYPE_CONFIG,
          type: 'drop-down',
          options: [
            {
              text: translate('username_password'),
              value: TlsAuthType.BasicAuth,
            },
            { text: translate('certificate'), value: 'ServerClientCertAuth' },
            { text: translate('certificate_pfx'), value: 'ServerClientCertAuth_Pfx' },
            {
              text: translate('no_authentication'),
              value: 'ServerCertAuth',
            },
          ],
          infoText: translate('info_text_tls_authentication'),
        },
        {
          label: translate('username_from_connector'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.USERNAME_BASIC_AUTH,
          type: 'input',
          hide: repositoryData[TLS_AUTH_TYPE_CONFIG] !== TlsAuthType.BasicAuth,
          infoText: translate('info_text_username_con'),
          required: repositoryData[TLS_AUTH_TYPE_CONFIG] === TlsAuthType.BasicAuth,
        },
        {
          label: translate('password_from_connector'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.PASSWORD_BASIC_AUTH,
          type: 'password',
          hide: repositoryData[TLS_AUTH_TYPE_CONFIG] !== TlsAuthType.BasicAuth,
          infoText: translate('info_text_password_con'),
          required: repositoryData[TLS_AUTH_TYPE_CONFIG] === TlsAuthType.BasicAuth,
        },
        {
          label: translate('private_key'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY,
          type: 'file-path',
          hide: repositoryData[TLS_AUTH_TYPE_CONFIG] !== TlsAuthType.ServerClientCertAuth,
          infoText: translate('info_text_private_key'),
          /**
           * Moves file to right position and renames it
           * @param e
           */
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            if (file === null) {
              throw new UserfacingError('Invalid Keyfile', 'Input File darf nicht NULL sein.', ERROR_CODES.AUTHCL_1114);
            }

            const keyFilename = file?.name.toString();
            const fileAsString = await file?.text();

            const fieldKey = ENTRY_OPTIONS_CONFIG_GROUP.TLS_PRIVATE_KEY;
            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.KEY);

              repositoryData[fieldKey] = await copyUploadedFileToTargetDir(file.path, fieldKey, keyFilename);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
        {
          label: translate('client_certificate'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE,
          type: 'file-path',
          hide: repositoryData[TLS_AUTH_TYPE_CONFIG] !== TlsAuthType.ServerClientCertAuth,
          infoText: translate('info_text_client_certificate'),
          /**
           * Moves file to right position and renames it
           * @param e
           */
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            if (file === null) {
              throw new UserfacingError(
                'Invalid Cert-file',
                'Input File darf nicht NULL sein.',
                ERROR_CODES.AUTHCL_1115,
              );
            }
            const certFilename = file?.name.toString();
            const fileAsString = await file?.text();

            const fieldKey = ENTRY_OPTIONS_CONFIG_GROUP.TLS_CERTIFICATE;
            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.CERT);

              repositoryData[fieldKey] = await copyUploadedFileToTargetDir(file.path, fieldKey, certFilename);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
        {
          label: translate('pfx_file'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE,
          type: 'file-path',
          hide: repositoryData[TLS_AUTH_TYPE_CONFIG] !== TlsAuthType.ServerClientCertAuth_Pfx,
          infoText: translate('info_text_pfx_file'),
          required: repositoryData[TLS_AUTH_TYPE_CONFIG] === TlsAuthType.ServerClientCertAuth_Pfx,
          /**
           * Moves file to right position and renames it
           * @param e
           */
          onChange: async (e: Event) => {
            await validateP12AndMove(e, repositoryData);
          },
        },
        {
          label: translate('pfx_file_password'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD,
          type: 'password',
          hide: repositoryData[TLS_AUTH_TYPE_CONFIG] !== TlsAuthType.ServerClientCertAuth_Pfx,
          infoText: translate('info_text_pfx_file_password'),
        },
        {
          label: translate('reject_unauthorized'),
          key: ENTRY_OPTIONS_CONFIG_GROUP.TLS_REJECT_UNAUTHORIZED,
          type: 'drop-down',
          optionsType: 'standardBool',
          infoText: translate('info_text_reject_unauthorized'),
        },
      ],
    },
    {
      title: translate('proxy_settings'),
      hide: false,
      columns: [
        {
          label: translate('proxy_authentication_type'),
          key: PROXY_SETTINGS_CONFIG.AUTH_TYPE,
          type: 'drop-down',
          options: [
            {
              text: translate('no_proxy_authentication'),
              value: false,
            },
            {
              text: translate('proxy_basic_authentication'),
              value: PROXY_AUTH_TYPES.BASIC_AUTH,
            },
            {
              text: translate('proxy_certificate_authentication'),
              value: PROXY_AUTH_TYPES.PROXY_CLIENT_CERT,
            },
          ],
          infoText: translate('info_text_proxy_auth_type'),
        },
        {
          label: translate('proxy_username'),
          key: PROXY_SETTINGS_CONFIG.PROXY_USERNAME,
          type: 'input',
          hide: repositoryData[PROXY_SETTINGS_CONFIG.AUTH_TYPE] !== PROXY_AUTH_TYPES.BASIC_AUTH,
          infoText: translate('info_text_proxy_username'),
          required: repositoryData[PROXY_SETTINGS_CONFIG.AUTH_TYPE] === PROXY_AUTH_TYPES.BASIC_AUTH,
        },
        {
          label: translate('proxy_password'),
          key: PROXY_SETTINGS_CONFIG.PROXY_PASSWORD,
          type: 'password',
          hide: repositoryData[PROXY_SETTINGS_CONFIG.AUTH_TYPE] !== PROXY_AUTH_TYPES.BASIC_AUTH,
          infoText: translate('info_text_proxy_password'),
          required: repositoryData[PROXY_SETTINGS_CONFIG.AUTH_TYPE] === PROXY_AUTH_TYPES.BASIC_AUTH,
        },
        {
          label: translate('proxy_client_certificate'),
          key: PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH,
          type: 'file-path',
          hide: repositoryData[PROXY_SETTINGS_CONFIG.AUTH_TYPE] !== PROXY_AUTH_TYPES.PROXY_CLIENT_CERT,
          infoText: translate('info_text_proxy_client_certificate'),
          /**
           * Moves file to right position and renames it
           * @param e
           */
          onChange: async (e: Event) => {
            const input = e.target as HTMLInputElement;
            const file = input.files && input.files[0];
            if (file === null) {
              return;
            }
            const certFilename = file?.name.toString();
            const fileAsString = await file?.text();
            const fieldKey = PROXY_SETTINGS_CONFIG.PROXY_CERTIFICATE_PATH;
            try {
              await checkPemFileFormat(fileAsString, PEM_TYPES.CERT);

              repositoryData[fieldKey] = await copyUploadedFileToTargetDir(file.path, fieldKey, certFilename);
            } catch (err) {
              input.value = '';
              repositoryData[fieldKey] = '';
            }
          },
        },
        {
          label: translate('use_os_proxy_settings'),
          key: PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS,
          type: 'drop-down',
          optionsType: 'standardBool',
          infoText: translate('info_text_use_os_proxy_settings'),
        },
        {
          label: translate('proxy_address'),
          key: PROXY_SETTINGS_CONFIG.PROXY_ADDRESS,
          type: 'input',
          required: true,
          hide: repositoryData[PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS] === true,
          infoText: translate('info_text_proxy_address'),
          // check if url is valid, and show warning if it isn't valid
          validateInput(value) {
            if (COMMON_USED_REGEXES.URL.test(value)) {
              return true;
            }

            if (isFQDN(value)) {
              return true;
            }

            try {
              return !!getMatch(value);
            } catch (e) {
              Swal.fire({
                title: translate('error_info'),
                text: i18n.global.t('invalid_proxy_address', { value }),
                icon: 'error',
              });
              return false;
            }
          },
        },
        {
          label: translate('proxy_port'),
          key: PROXY_SETTINGS_CONFIG.PROXY_PORT,
          type: 'input',
          required: true,
          validationRegex: COMMON_USED_REGEXES.NUMBER,
          hide: repositoryData[PROXY_SETTINGS_CONFIG.USE_OS_SETTINGS] === true,
          infoText: translate('info_text_proxy_port'),
        },
        {
          label: translate('proxy_ignore_list'),
          key: PROXY_SETTINGS_CONFIG.PROXY_IGNORE_LIST,
          type: 'input',
          validateInput: (value) => {
            try {
              // Split the input string into an array of individual addresses
              const entries = value.split(';').map((entry) => entry.trim());
              // Validate each individual IP address and keep track of invalid addresses
              const invalidEntries: string[] = [];
              const isEntriesValid = entries.every((entry) => {
                try {
                  const isIPValid = !!getMatch(entry);
                  if (!isIPValid) {
                    invalidEntries.push(entry);
                  }
                  return isIPValid;
                } catch (error) {
                  const isFQDNValid = isFQDN(entry, {
                    allow_wildcard: true,
                  });

                  if (!isFQDNValid) {
                    invalidEntries.push(entry);
                  }
                  return isFQDNValid;
                }
              });

              // Shows an error message if some given ip address is invalid and when which of them
              if (!isEntriesValid) {
                const invalidIPAddress = `${invalidEntries.join(', ')}`;
                Swal.fire({
                  title: translate('error_info'),
                  text: i18n.global.t('invalid_ip_address', { invalidIPAddress }),
                  icon: 'error',
                });
                return false;
              }
              return true;
            } catch (error) {
              logger.error('Error validating IP for Proxy Ignore-List:', error);
              return false;
            }
          },
          infoText: translate('info_text_proxy_ignore_list'),
        },
      ],
    },
    {
      title: translate('timout_settings'),
      hide: false,
      columns: [
        {
          label: translate('time_out_value'),
          key: TIMEOUT_PARAMETER_CONFIG,
          type: 'number',
          placeholder: '10000',
          infoText: translate('info_text_timeout_for_developers'),
        },
      ],
    },
    {
      title: translate('automatic_updates'),
      hide: false,
      columns: [
        {
          label: translate('check_updates_automatically'),
          key: CHECK_UPDATES_AUTOMATICALLY_CONFIG,
          type: 'drop-down',
          optionsType: 'standardBool',
          infoText: translate('info_text_check_updates_automatically'),
        },
      ],
    },
  ];
}

export function getFormColumnsFlat(repositoryData: TRepositoryData): Record<string, IConfig> {
  const sections = getFormSections(repositoryData);
  const formSectionsFlat: Record<string, IConfig> = {};

  sections.forEach((section) => {
    section.columns.forEach((value) => {
      formSectionsFlat[value.key] = value;
    });
  });

  return formSectionsFlat;
}

export async function validateP12AndMove(e: Event, repositoryData: TRepositoryData) {
  const input = e.target as HTMLInputElement;
  const file = input.files && input.files[0];
  if (file === null) {
    throw new UserfacingError('Invalid File', 'Input File darf nicht NULL sein.', ERROR_CODES.AUTHCL_1114);
  }
  const pfxFilename = file?.name.toString();

  const fieldKey = ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_CERTIFICATE;
  try {
    const newPassword = await Swal.fire({
      title: translate('pfx_file_password_swal'),
      input: 'password',
      inputAttributes: {
        autocapitalize: 'off',
      },
      showCancelButton: true,
      confirmButtonText: translate('save'),
      cancelButtonText: translate('cancel'),
      allowOutsideClick: false,
    });

    if (!newPassword.isConfirmed) {
      return false;
    }
    let sourcePath = file.path;
    let errorText = '';
    const isP12Valid = window.api.isP12Valid(sourcePath, <string>newPassword.value);
    switch (isP12Valid) {
      case P12_VALIDITY_TYPE.INVALID_CERTIFICATE:
        errorText = 'pfx_cert_invalid';
        break;
      case P12_VALIDITY_TYPE.WRONG_PASSWORD:
        errorText = 'pfx_password_fail';
        break;
      case P12_VALIDITY_TYPE.NO_CERT_FOUND:
        errorText = 'pfx_no_cert';
        break;
      case P12_VALIDITY_TYPE.ONE_VALID_AND_INVALID_CERTIFICATES:
        // eslint-disable-next-line no-case-declarations
        const value = await Swal.fire({
          title: translate('pfx_with_invalid_certs'),
          text: translate('pfx_repair_swal'),
          cancelButtonText: translate('cancel'),
          confirmButtonText: translate('pfx_confirm_repair'),
          showCancelButton: true,
        });
        if (value.isConfirmed) {
          sourcePath = window.api.extractValidCertificate(sourcePath, <string>newPassword.value);
          repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD] = <string>newPassword.value;
          repositoryData[fieldKey] = await copyUploadedFileToTargetDir(sourcePath, fieldKey, pfxFilename);
          return;
        }
        input.value = '';
        repositoryData[fieldKey] = '';
        return;
      case P12_VALIDITY_TYPE.TOO_MANY_CERTIFICATES:
        errorText = 'pfx_to_many_certificates';
        break;
      case P12_VALIDITY_TYPE.PROCESSING_EXCEPTION:
        errorText = 'pfx_processing_error';
        break;
      case P12_VALIDITY_TYPE.VALID:
        repositoryData[ENTRY_OPTIONS_CONFIG_GROUP.TLS_PFX_PASSWORD] = <string>newPassword.value;
        repositoryData[fieldKey] = await copyUploadedFileToTargetDir(file.path, fieldKey, pfxFilename);
        return;
    }
    input.value = '';
    repositoryData[fieldKey] = '';
    Swal.fire({
      title: translate('error_info'),
      text: translate(errorText),
      icon: 'error',
    });
  } catch (err) {
    input.value = '';
    repositoryData[fieldKey] = '';
  }
}
