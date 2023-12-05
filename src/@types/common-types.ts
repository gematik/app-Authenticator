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

import { SweetAlertOptions } from 'sweetalert2';

export interface TOidcProtocol2UrlSpec {
  challenge_path?: string;
  redirect_automatically?: boolean;
}

export type TUserWarnObject = {
  swalOptions: Partial<SweetAlertOptions>;
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
  validateInput?: (value: string) => boolean;
  infoText?: string;
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
  ServerClientCertAuth_Pfx: 'ServerClientCertAuth_Pfx',
};
