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

import { logger } from '@/renderer/service/logger';

export class AuthenticatorError extends Error {
  constructor(error: string) {
    super(error);
    logger.error(error);
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

export class KeycloakPluginError extends AuthenticatorError {
  name = 'IdentifyProvider';
  error: string;
  data?: any;

  constructor(error: string, data?: unknown) {
    super(window.api.utilFormat('error: %s; data: %s', error, data || ''));
    this.error = error;
    this.data = data;
  }
}

export class CentralIdpError extends AuthenticatorError {
  name = 'IdentifyProvider';
  error: string;
  data?: unknown;

  constructor(error: string, data?: unknown) {
    super(error);
    this.error = error;
    this.data = data;
  }
}
