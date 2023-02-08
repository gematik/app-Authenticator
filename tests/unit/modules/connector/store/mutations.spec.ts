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
