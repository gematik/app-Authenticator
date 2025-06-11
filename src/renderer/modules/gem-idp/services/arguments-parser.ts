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
import { OAUTH2_ERROR_TYPE, TAuthArguments, TCallback } from '@/renderer/modules/gem-idp/type-definitions';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import queryString from 'qs';
import { logStep } from '@/renderer/modules/gem-idp/utils';
import { validateDeeplinkProtocol } from '@/renderer/utils/validate-redirect-uri-protocol';
import { AuthFlowError } from '@/renderer/errors/errors';
import { alertDefinedErrorWithDataOptional } from '@/renderer/utils/utils';
import { ERROR_CODES } from '@/error-codes';
import { COMMON_USED_REGEXES } from '@/constants';
import { logger } from '@/renderer/service/logger';
import { filterCardTypeFromScope } from '@/renderer/utils/card-type-service';

export async function parseAuthArguments(fullChallengePath: string, $store: any): Promise<TAuthArguments> {
  try {
    logStep('Step: ParseAuthArguments');

    // extract the 'callback' from the challenge path
    const callbackAndCleanChallengePath = getParamFromChallengePath('callback', fullChallengePath);
    const { callbackType, deeplink } = await getCallback(callbackAndCleanChallengePath.value);

    // extract the 'cardType' from the challenge path
    const cardTypeAndCleanChallengePath = getParamFromChallengePath(
      'cardType',
      callbackAndCleanChallengePath.cleanChallengePath,
    );

    // extract the client_id from the challenge path
    const clientId = getParamFromChallengePath(
      'client_id',
      cardTypeAndCleanChallengePath.cleanChallengePath,
      false, // don't remove the client_id from the challenge path
    ).value!;

    // now we have a clean challenge path, we can validate it
    await validateChallengePath(cardTypeAndCleanChallengePath.cleanChallengePath);

    const cleanChallengePath = filterCardTypeFromScope(cardTypeAndCleanChallengePath.cleanChallengePath).challenge_path;

    // set in the store
    $store.commit('idpServiceStore/setClientId', clientId);
    $store.commit('idpServiceStore/setChallengePath', cleanChallengePath);

    return {
      deeplink,
      callbackType,
      cardType: cardTypeAndCleanChallengePath.value as ECardTypes,
    };
  } catch (e) {
    if (e instanceof AuthFlowError) {
      throw e;
    }

    await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0001);
    throw new AuthFlowError(
      `Error parsing auth arguments (${ERROR_CODES.AUTHCL_0001})`,
      e.message,
      undefined,
      true,
      OAUTH2_ERROR_TYPE.INVALID_REQUEST,
    );
  }
}

export function getParamFromChallengePath(
  paramName: string,
  challengePath: string,
  pop = true, // remove the parameter from the challenge path
): {
  cleanChallengePath: string;
  value: string | null;
} {
  if (challengePath && challengePath.includes(paramName)) {
    const searchParamsString = challengePath.split('?')[1];
    const parsedPath = queryString.parse(searchParamsString);
    const value = parsedPath[paramName];

    let cleanChallengePath = challengePath;
    // update challenge path if we want to pop the parameter
    if (pop) {
      cleanChallengePath = challengePath.replace('&' + paramName + '=' + value, '');
    }

    return {
      cleanChallengePath,
      value: typeof value === 'string' ? value : null,
    };
  }

  return {
    cleanChallengePath: challengePath,
    value: null,
  };
}

export async function getCallback(
  callbackValue: string | null,
): Promise<{ callbackType: TCallback; deeplink: string }> {
  if (callbackValue) {
    if (callbackValue.toUpperCase() == TCallback.DIRECT) {
      return { callbackType: TCallback.DIRECT, deeplink: '' };
    } else if (callbackValue.toUpperCase() == TCallback.OPEN_TAB) {
      return { callbackType: TCallback.OPEN_TAB, deeplink: '' };
    } else if (validateDeeplinkProtocol(callbackValue)) {
      return { callbackType: TCallback.DEEPLINK, deeplink: callbackValue };
    } else {
      await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0007);
      throw new AuthFlowError(
        `Invalid callback value Value: ${callbackValue} (${ERROR_CODES.AUTHCL_0007})`,
        '',
        undefined,
        true,
        OAUTH2_ERROR_TYPE.INVALID_REQUEST,
      );
    }
  }
  return { callbackType: TCallback.OPEN_TAB, deeplink: '' };
}

/**
 * Check launcher arguments, some of them are required for the auth flow
 * todo: implement a better validation like a scope and client_id check
 */
export async function validateChallengePath(challengePath: string) {
  if (!COMMON_USED_REGEXES.URL.test(challengePath)) {
    const error = `Invalid launch parameters provided in the challenge path (${ERROR_CODES.AUTHCL_0001})`;
    const message = `Key: challenge_path. Value: ${challengePath}`;

    logger.error(`${ERROR_CODES.AUTHCL_0001}: ${error}`, message);
    await alertDefinedErrorWithDataOptional(ERROR_CODES.AUTHCL_0001);
    throw new AuthFlowError(error, '', undefined, true, OAUTH2_ERROR_TYPE.INVALID_REQUEST);
  }
}
