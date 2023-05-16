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

import { logger } from '@/renderer/service/logger';
import { IdpError } from '@/renderer/modules/gem-idp/type-definitions';

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
