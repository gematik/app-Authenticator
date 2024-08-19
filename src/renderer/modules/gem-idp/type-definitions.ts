/*
 * Copyright 2024 gematik GmbH
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

import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

export enum OAUTH2_ERROR_TYPE {
  INVALID_REQUEST = 'invalid_request',
  ACCESS_DENIED = 'access_denied',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  INVALID_SCOPE = 'invalid_scope',
  SERVER_ERROR = 'server_error',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
  INVALID_CLIENT = 'invalid_client',
  INVALID_GRANT = 'invalid_grant',
  UNSUPPORTED_GRANT_TYPE = 'unsupported_grant_type',
}

export type TAccessDataResponse = {
  redirectUri?: string;
  statusCode: number;
  errorUri?: string;
  idpError?: IdpError;
};

export type IdpError = {
  oauth2ErrorType?: OAUTH2_ERROR_TYPE;
  gamatikErrorText: string;
  gematikCode: string;
};

export enum TCallback {
  OPEN_TAB = 'OPEN_TAB',
  DIRECT = 'DIRECT',
  DEEPLINK = 'DEEPLINK',
}

export type TCard = {
  CardHandle: string;
  Iccsn: string;
  CardType: ECardTypes;
  SlotId: number;
  CtId: string;
};
