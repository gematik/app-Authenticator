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

import { createStore } from 'vuex';
import { connectorStore } from '@/renderer/modules/connector/store/connector-store';
import { authServiceStore } from '@/renderer/modules/auth-service/store/auth-service-store';
import { IAuthServiceStore } from '@/renderer/modules/auth-service/store/auth-service-store.d';
import { TConnectorStore } from '@/renderer/modules/connector/type-definitions';
import { TGemIdpServiceStore } from '@/renderer/modules/gem-idp/store/gem-idp-service-store.d';
import { gemIdpServiceStore } from '@/renderer/modules/gem-idp/store/gem-idp-service-store';

export type TRootStore = {
  connectorStore: TConnectorStore;
  authServiceStore: IAuthServiceStore;
  gemIdpServiceStore: TGemIdpServiceStore;
  settingsIsSet: boolean;
  showLoadingSpinner: boolean;
};

export default createStore({
  state: (): TRootStore =>
    ({
      showLoadingSpinner: false,
    } as TRootStore),
  mutations: {
    setShowLoadingSpinner(state, newState: boolean) {
      state.showLoadingSpinner = newState;
    },
  },
  actions: {},
  modules: {
    connectorStore,
    authServiceStore,
    gemIdpServiceStore,
  },
});
