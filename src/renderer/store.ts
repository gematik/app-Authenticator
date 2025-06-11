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

import { createStore } from 'vuex';
import { connectorStore } from '@/renderer/modules/connector/store/connector-store';
import { TConnectorStore } from '@/renderer/modules/connector/type-definitions';
import { TIdpServiceStore } from '@/renderer/modules/gem-idp/store/idp-service-store.d';
import { idpServiceStore } from '@/renderer/modules/gem-idp/store/idp-service-store';

export type TRootStore = {
  connectorStore: TConnectorStore;
  idpServiceStore: TIdpServiceStore;
  settingsIsSet: boolean;
  showLoadingSpinner: boolean;
};

export default createStore({
  state: (): TRootStore => {
    return {
      showLoadingSpinner: false,
    } as TRootStore;
  },
  mutations: {
    setShowLoadingSpinner(state, newState: boolean) {
      state.showLoadingSpinner = newState;
    },
  },
  actions: {},
  modules: {
    connectorStore,
    idpServiceStore,
  },
});
