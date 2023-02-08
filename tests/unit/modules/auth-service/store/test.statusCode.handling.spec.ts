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

import store from '@/renderer/store';
import { mount } from '@vue/test-utils';
import AuthFlowProcess from '@/renderer/modules/auth-service/event-listeners/AuthFlowProcess.vue';
import i18n from '@/renderer/i18n';
import got from 'got';

const callbackUrl = 'http://central.idp/sign_response';
jest.mock('sweetalert', () => () => {});

describe('AUTHCL-703', () => {
  beforeEach(() => {
    store.commit('authServiceStore/resetStore');
    process.env.NODE_ENV = 'development';
    store.commit('authServiceStore/setChallengePath', callbackUrl);
  });

  const wrapper = mount(AuthFlowProcess, {
    global: {
      plugins: [store, i18n],
    },
  });

  //'should get response on statusCode 204 aktiviert nur bei statusCode 204'
  it('should get response on statusCode 204', async () => {
    jest.spyOn(got, 'post').mockReturnValue({
      // @ts-ignore
      json: () => {},
      statusCode: 204,
      headers: {
        'x-callback-location': callbackUrl,
      },
    });

    expect(await wrapper.vm.getRedirectUriWithToken(null)).toEqual({ isSuccess: true, url: callbackUrl });
  });

  //'should get response on statusCode 400 aktiviert nur bei statusCode 400'
  it('should get response on statusCode 400', async () => {
    jest.spyOn(got, 'post').mockReturnValue({
      // @ts-ignore
      json: () => {},
      statusCode: 400,
      headers: {
        'x-callback-location': callbackUrl,
      },
    });
    expect(await wrapper.vm.getRedirectUriWithToken(null)).toEqual({ isSuccess: true, url: '' });
  });

  //'should get response on statusCode 200 aktiviert nur bei statusCode 200'
  it('should get response on statusCode 200', async () => {
    jest.spyOn(got, 'post').mockReturnValue({
      // @ts-ignore
      json: () => {},
      statusCode: 200,
      headers: {
        'x-callback-location': callbackUrl,
      },
    });

    expect(await wrapper.vm.getRedirectUriWithToken(null)).toEqual({ isSuccess: true, url: callbackUrl });
  });
});
