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

import { SwalOptions } from 'sweetalert/typings/modules/options';

export interface TOidcProtocol2UrlSpec {
  authz_path?: string;
  challenge_path?: string;
  serverMode?: boolean;
}

export type TUserWarnObject = {
  swalOptions: Partial<SwalOptions>;
  data: Record<string, unknown>;
};

export type TAuthFlowEndState = { isSuccess: boolean; url: string };

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
}

export interface IConfigSection {
  title: string;
  hide?: boolean;
  icon?: string;
  columns: IConfig[];
}
export const TlsAuthType = {
  BasicAuth: 'BasicAuth',
  ServerCertAuth: 'ServerCertAuth',
  ServerClientCertAuth: 'ServerClientCertAuth',
};
