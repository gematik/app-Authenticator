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
import { shallowMount } from '@vue/test-utils';
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import i18n from '@/renderer/i18n';
import store from '@/renderer/store';
import { logger } from '@/renderer/service/logger';
import router from '@/renderer/router';

jest.spyOn(logger, 'warn');

describe('AuthFlow.vue', () => {
  const wrapper = shallowMount(AuthFlow, {
    global: {
      plugins: [store, i18n],
      mocks: {
        $router: router,
      },
    },
  });

  // Cleanup
  afterEach(() => {
    store.commit('idpServiceStore/resetStore');
  });

  // mock parseAndSetIdpHost and throw an error
  (wrapper.vm.$refs.idpActionsComponent as any).parseAuthArguments = jest.fn().mockImplementation(() => {
    throw new Error('Exit');
  });

  (wrapper.vm.$refs.pinActionsComponent as any).resetVerifyPinClose = jest.fn().mockImplementation(() => {
    return false;
  });

  wrapper.vm.sendAuthorizationRequest = jest.fn().mockImplementation(() => {
    throw new Error('Exit');
  });

  // todo remove after removing deprecated filterCardTypeFromScope function
  it('should remove cardType and Person_ID and log deprecated warnings', async () => {
    // Define test arguments
    const args = {
      challenge_path:
        'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type' +
        '=code&redirect_uri=http%3A%2F%2Fgsltucd01.ltu.int.gematik.de%3A8990%2Fapi%2Fcallback&state=DtzTIzr51FgW6p1d' +
        '&code_challenge=gW5RIbZUy08-T1Y2EwU06KuFEj1xll7vNfbN7ky_dtg' +
        '&code_challenge_method=S256' +
        '&scope=openid%20gem-auth Person_ID' + // scope defined
        '&nonce=JedtXyElLUld6C1s' +
        '&cardType=HBA' + // cardType defined
        '&callback=DIRECT',
    };

    // expected challenge path does not contain cardType and %20Person_ID in scope
    const expectedChallengePath =
      'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type' +
      '=code&redirect_uri=http%3A%2F%2Fgsltucd01.ltu.int.gematik.de%3A8990%2Fapi%2Fcallback&state=DtzTIzr51FgW6p1d' +
      '&code_challenge=gW5RIbZUy08-T1Y2EwU06KuFEj1xll7vNfbN7ky_dtg' +
      '&code_challenge_method=S256' +
      '&scope=openid%20gem-auth' + // scope defined
      '&nonce=JedtXyElLUld6C1s';

    const warningForDeprecatedParameter =
      'Sending Card Type in scope is deprecated. Please use only the cardType parameter in challenge_path instead.';

    try {
      // Call the function
      await wrapper.vm.startAuthenticationFlow(new Event('test'), args);
    } catch (error) {
      // Expect the error to be our mock error
      expect(error).toEqual(new Error('Exit'));
    }

    // Verify results
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(warningForDeprecatedParameter);

    expect(wrapper.vm.$store.state.idpServiceStore.challengePath).toBe(expectedChallengePath);
  });

  // todo remove after removing deprecated filterCardTypeFromScope function
  it('should log warning about deprecation', async () => {
    // Define test arguments
    const args = {
      challenge_path:
        'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type' +
        '=code&redirect_uri=http%3A%2F%2Fgsltucd01.ltu.int.gematik.de%3A8990%2Fapi%2Fcallback&state=DtzTIzr51FgW6p1d' +
        '&code_challenge=gW5RIbZUy08-T1Y2EwU06KuFEj1xll7vNfbN7ky_dtg' +
        '&code_challenge_method=S256' +
        '&scope=openid%20gem-auth' + // scope defined
        '&nonce=JedtXyElLUld6C1s' +
        '&callback=DIRECT',
    };

    // expected challenge path does not contain cardType and %20Person_ID in scope
    const expectedChallengePath =
      'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type' +
      '=code&redirect_uri=http%3A%2F%2Fgsltucd01.ltu.int.gematik.de%3A8990%2Fapi%2Fcallback&state=DtzTIzr51FgW6p1d' +
      '&code_challenge=gW5RIbZUy08-T1Y2EwU06KuFEj1xll7vNfbN7ky_dtg' +
      '&code_challenge_method=S256' +
      '&scope=openid%20gem-auth' + // scope defined
      '&nonce=JedtXyElLUld6C1s';

    const warningForDeprecatedParameter =
      'No cardType info found in challenge_path and in scope, please add it to the challenge_path';

    try {
      // Call the function
      await wrapper.vm.startAuthenticationFlow(new Event('test'), args);
    } catch (error) {
      // Expect the error to be our mock error
      expect(error).toEqual(new Error('Exit'));
    }

    // Verify results
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(warningForDeprecatedParameter);

    expect(wrapper.vm.$store.state.idpServiceStore.challengePath).toBe(expectedChallengePath);
  });

  it('should remove cardType', async () => {
    // Define test arguments
    const args = {
      challenge_path:
        'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type' +
        '=code&redirect_uri=http%3A%2F%2Fgsltucd01.ltu.int.gematik.de%3A8990%2Fapi%2Fcallback&state=DtzTIzr51FgW6p1d' +
        '&code_challenge=gW5RIbZUy08-T1Y2EwU06KuFEj1xll7vNfbN7ky_dtg' +
        '&code_challenge_method=S256' +
        '&scope=openid%20gem-auth' +
        '&nonce=JedtXyElLUld6C1s' +
        '&cardType=HBA' + // cardType defined
        '&callback=DIRECT',
    };

    // expected challenge path does not contain cardType and %20Person_ID in scope
    const expectedChallengePath =
      'http://x.de/sign_response?client_id=AuthenticatorDevRemoteApi&response_type' +
      '=code&redirect_uri=http%3A%2F%2Fgsltucd01.ltu.int.gematik.de%3A8990%2Fapi%2Fcallback&state=DtzTIzr51FgW6p1d' +
      '&code_challenge=gW5RIbZUy08-T1Y2EwU06KuFEj1xll7vNfbN7ky_dtg' +
      '&code_challenge_method=S256' +
      '&scope=openid%20gem-auth' + // scope defined
      '&nonce=JedtXyElLUld6C1s';

    try {
      // Call the function
      await wrapper.vm.startAuthenticationFlow(new Event('test'), args);
    } catch (error) {
      // Expect the error to be our mock error
      expect(error).toEqual(new Error('Exit'));
    }

    // Verify results
    expect(wrapper.vm.$store.state.idpServiceStore.challengePath).toBe(expectedChallengePath);
  });
});
