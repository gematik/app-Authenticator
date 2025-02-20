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

import { SweetAlertOptions } from 'sweetalert2';
import { IdpError } from '@/renderer/modules/gem-idp/type-definitions';

export interface TOidcProtocol2UrlSpec {
  challenge_path?: string;
  redirect_automatically?: boolean;
}

export type TUserWarnObject = {
  swalOptions: Partial<SweetAlertOptions>;
  data: Record<string, unknown>;
};

export type TAuthFlowEndState = { isSuccess: boolean; url: string; idpError?: IdpError };

/**
 * Options types for FormInput DropDown element.
 * If you implement anything, please also add types in the FormInput element
 */
export type IFormInputDropDownOptionType = 'standardBool';

/**
 * If option list is not suitable with OptionsType we can give a custom option list for the dropdown
 */
export type IFormInputDropDownOptions = { text: string; value: string | boolean | number };

/**
 * If option list is not suitable with OptionsType we can give a custom option list for the dropdown
 */
export type IFormInputColumnTypes =
  | 'input'
  | 'number'
  | 'password'
  | 'email'
  | 'text'
  | 'drop-down'
  | 'file'
  | 'file-path';

export interface IConfig {
  label: string;
  key: string;
  type: IFormInputColumnTypes;
  required?: boolean;
  iterable?: boolean;
  placeholder?: string;
  optionsType?: IFormInputDropDownOptionType;
  options?: IFormInputDropDownOptions[];
  hide?: boolean;
  validationRegex?: RegExp;
  onChange?: (...args: any[]) => void;
  validateInput?: (value: string) => boolean;
  sanitizeInput?: (value: string) => void;
  infoText?: string;
}

export interface IConfigSection {
  title: string;
  hide?: boolean;
  icon?: string;
  columns: IConfig[];
}

export enum TLS_AUTH_TYPE {
  BasicAuth = 'BasicAuth',
  ServerCertAuth = 'ServerCertAuth',
  ServerClientCertAuth = 'ServerClientCertAuth',
  ServerClientCertAuth_Pfx = 'ServerClientCertAuth_Pfx',
}

export enum KONNEKTOR_VENDORS {
  Rise = 'Rise',
  Koco = 'KoCo',
  Secunet = 'Secunet',
}
