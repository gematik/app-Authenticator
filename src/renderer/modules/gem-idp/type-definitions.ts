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

export type TAuthArguments = {
  deeplink: string;
  callbackType: TCallback;
  cardType: ECardTypes;
};
