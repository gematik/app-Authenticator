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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { logger } from '@/renderer/service/logger';
import { IdpError, OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';

export class AuthenticatorError extends Error {
  constructor(error: string) {
    super(error);
    logger.error(error);
  }
}

export class AuthenticatorHint extends Error {
  constructor(hint: string) {
    super(hint);
    logger.info(hint);
  }
}

export class UserfacingError extends AuthenticatorError {
  name = 'UserfacingError';
  title: string;
  message: string;
  code?: string;
  data?: any;

  constructor(title: string, message: string, code?: string, data?: unknown) {
    super(window.api.utilFormat('code: %s; error: %s; description: %s; data: %s', code, title, message, data || ''));
    this.title = title;
    this.message = message;
    this.code = code;
    this.data = data;
  }
}

export class ConnectorError extends AuthenticatorError {
  name = 'ConnectorError';
  code: string;
  error?: string;
  description?: string;
  data?: any;

  constructor(code: string, error?: string, description?: string, data?: unknown) {
    super(
      window.api.utilFormat('code: %s; error: %s; description: %s; data: %s', code, error, description, data || ''),
    );
    this.code = code;
    this.error = error;
    this.description = description;
    this.data = data;
  }
}

export class ConnectorHint extends AuthenticatorHint {
  name = 'ConnectorHint';
  code: string;
  error?: string;
  description?: string;
  data?: any;

  constructor(code: string, hint?: string, description?: string, data?: unknown) {
    super(window.api.utilFormat('code: %s; hint: %s; description: %s', code, hint, description));
    this.code = code;
    this.error = hint;
    this.description = description;
    this.data = data;
  }
}

export class CentralIdpError extends AuthenticatorError {
  name = 'IdentifyProvider';
  data?: IdpError;

  constructor(error: string, data?: IdpError) {
    super(error);
    this.data = data;
  }
}

/**
 * Generates a new Error class only for the AuthFlow.
 * Right before this error is thrown, we should show an alert to the user
 */
export class AuthFlowError extends Error {
  name = 'AuthFlowError';
  errorDetails?: string;
  errorUrl?: string;
  errorShown?: boolean;
  errorType?: OAUTH2_ERROR_TYPE;

  constructor(
    error: string,
    errorDetails: string,
    errorUrl?: string,
    errorShown?: boolean,
    errorType?: OAUTH2_ERROR_TYPE,
  ) {
    super(error);
    logger.error('AuthFlowError: ' + error, errorDetails);
    this.errorDetails = errorDetails;
    this.errorUrl = errorUrl;
    this.errorShown = errorShown;
    this.errorType = errorType;
  }
}
