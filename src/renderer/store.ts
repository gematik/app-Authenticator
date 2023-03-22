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
