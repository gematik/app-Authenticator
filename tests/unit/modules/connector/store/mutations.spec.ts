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

import store from '@/renderer/store';

const terminals = {
  CtId: 'T-N-LOC',
  WorkplaceIds: '',
  Name: 'Terminal Tests',
  Slots: '4',
};
describe('connector module mutations', () => {
  it('sets hbaCardHandle and resets', () => {
    // set anc check hbaCardHandle
    store.commit('connectorStore/setHbaCardData', 'hba-cardHandle');
    expect(store.state.connectorStore.cards['HBA']).toBeTruthy();

    // reset store and check
    store.commit('connectorStore/resetStore');
    expect(store.state.connectorStore.cards['HBA']).toBe(undefined);
  });

  it('sets smcbCardHandle and resets', () => {
    // set anc check smcbCardHandle
    store.commit('connectorStore/setSmcbCardData', 'smcb-cardHandle');
    expect(store.state.connectorStore.cards['SMC-B']).toBeTruthy();

    // reset store and check
    store.commit('connectorStore/resetStore');
    expect(store.state.connectorStore.cards['SMC-B']).toBe(undefined);
  });
  it('sets hbaPinStatus and resets', () => {
    // set anc check hbaPinStatus
    store.commit('connectorStore/setTerminals', terminals);
    expect(store.state.connectorStore.terminals).toStrictEqual(terminals);

    // reset store and check
    store.commit('connectorStore/resetStore');
    expect(store.state.connectorStore.terminals).toBe(undefined);
  });
});
