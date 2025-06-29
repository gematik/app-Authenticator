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

import {
  createRedirectDeeplink,
  escapeHTML,
  parseErrorMessageToIDPError,
  parseOauthError,
  parseUrlToIdpError,
} from '@/renderer/utils/utils';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';

describe('Test util functions', () => {
  it('test parseOauthError function', async () => {
    const invalidRequest = parseOauthError('invalid_request');
    expect(invalidRequest).toBe(OAUTH2_ERROR_TYPE.INVALID_REQUEST);

    const accessDenied = parseOauthError('access_denied');
    expect(accessDenied).toBe(OAUTH2_ERROR_TYPE.ACCESS_DENIED);

    const unauthorizedClient = parseOauthError('unauthorized_client');
    expect(unauthorizedClient).toBe(OAUTH2_ERROR_TYPE.UNAUTHORIZED_CLIENT);

    const unsupportedResponseType = parseOauthError('unsupported_response_type');
    expect(unsupportedResponseType).toBe(OAUTH2_ERROR_TYPE.UNSUPPORTED_RESPONSE_TYPE);

    const invalidScope = parseOauthError('invalid_scope');
    expect(invalidScope).toBe(OAUTH2_ERROR_TYPE.INVALID_SCOPE);

    const serverError = parseOauthError('server_error');
    expect(serverError).toBe(OAUTH2_ERROR_TYPE.SERVER_ERROR);

    const temporarilyUnavailable = parseOauthError('temporarily_unavailable');
    expect(temporarilyUnavailable).toBe(OAUTH2_ERROR_TYPE.TEMPORARILY_UNAVAILABLE);

    const invalidClient = parseOauthError('invalid_client');
    expect(invalidClient).toBe(OAUTH2_ERROR_TYPE.INVALID_CLIENT);

    const invalidGrant = parseOauthError('invalid_grant');
    expect(invalidGrant).toBe(OAUTH2_ERROR_TYPE.INVALID_GRANT);

    const unsupportedGrantType = parseOauthError('unsupported_grant_type');
    expect(unsupportedGrantType).toBe(OAUTH2_ERROR_TYPE.UNSUPPORTED_GRANT_TYPE);

    const undefinedType = parseOauthError('undefined');
    expect(undefinedType).toBeUndefined();
  });

  it('test parseErrorMessageToIDPError with valid message', async () => {
    const message =
      '{"error":"invalid_request","gematik_error_text":"client_id ist ungültig","gematik_timestamp":1678188405,"gematik_uuid":"eded25c9-86c0-45f0-bdfe-b861edd42e8f","gematik_code":"2012"}';
    const idpError = parseErrorMessageToIDPError(message);
    expect(idpError.oauth2ErrorType).toBe(OAUTH2_ERROR_TYPE.INVALID_REQUEST);
    expect(idpError.gamatikErrorText).toBe('client_id ist ungültig');
    expect(idpError.gematikCode).toBe('2012');
  });

  it('test parseErrorMessageToIDPError with invalid message', async () => {
    const message =
      '{"error":"invalid_request_","gematik_error_text_":"client_id ist ungültig","gematik_timestamp":1678188405,"gematik_uuid":"eded25c9-86c0-45f0-bdfe-b861edd42e8f","gematik_code_":"2012"}';
    const idpError = parseErrorMessageToIDPError(message);
    expect(idpError.oauth2ErrorType).toBeUndefined();
    expect(idpError.gamatikErrorText).toBeUndefined();
    expect(idpError.gematikCode).toBeUndefined();
  });

  it('test parseErrorMessageToIDPError without a message', async () => {
    const idpError = parseErrorMessageToIDPError('');
    expect(idpError.oauth2ErrorType).toBeUndefined();
    expect(idpError.gamatikErrorText).toBeUndefined();
    expect(idpError.gematikCode).toBeUndefined();
  });

  it('test parseErrorMessageToIDPError with undefined', async () => {
    // @ts-ignore
    const idpError = parseErrorMessageToIDPError(undefined);
    expect(idpError.oauth2ErrorType).toBeUndefined();
    expect(idpError.gamatikErrorText).toBeUndefined();
    expect(idpError.gematikCode).toBeUndefined();
  });

  it('test parseUrlToIdpError with valid url', async () => {
    const url =
      'https://testURL?error=invalid_request&gematik_error_text=client_id ist ungültig&gematik_timestamp=1678188405&gematik_uuid=eded25c9-86c0-45f0-bdfe-b861edd42e8f&gematik_code=2012';
    const idpError = parseUrlToIdpError(url);
    expect(idpError).not.toBeNull();
    expect(idpError?.oauth2ErrorType).toBe(OAUTH2_ERROR_TYPE.INVALID_REQUEST);
    expect(idpError?.gamatikErrorText).toBe('client_id ist ungültig');
    expect(idpError?.gematikCode).toBe('2012');
  });

  it('test parseUrlToIdpError with valid url but withouz params', async () => {
    const url = 'https://testURL?error=hoho';
    const idpError = parseUrlToIdpError(url);
    expect(idpError).not.toBeNull();
    expect(idpError?.oauth2ErrorType).toBeUndefined();
    expect(idpError?.gamatikErrorText).toBe('');
    expect(idpError?.gematikCode).toBe('');
  });

  it('test parseErrorMessageToIDPError is a url without a error', async () => {
    const url = 'https://testURL';
    const idpError = parseUrlToIdpError(url);
    expect(idpError).toBeNull();
  });

  it('test createRedirectDeeplink with valid parameters', async () => {
    const url = 'https://testURL?code=test_code&ssotoken=test_ssotoken&StAtE=test_state';
    const deeplink = createRedirectDeeplink('protocol', url);
    expect(deeplink).toBe('protocol://code=test_code&ssotoken=test_ssotoken&StAtE=test_state');
  });

  it('test the escapeHTML function', async () => {
    const html = '<div>test</div>';
    const escapedHtml = escapeHTML(html);
    expect(escapedHtml).toBe('&lt;div&gt;test&lt;/div&gt;');
  });

  it('test the escapeHTML function with br exception', async () => {
    const html = '<div><br>test</br></div>';
    const escapedHtml = escapeHTML(html, ['br']);
    expect(escapedHtml).toBe('&lt;div&gt;<br>test</br>&lt;/div&gt;');
  });
});
