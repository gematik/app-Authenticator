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

import { inject, InjectionKey } from 'vue';
import { ISettingsRepository } from '@/renderer/modules/settings/repository';

export type ConfigStore = ISettingsRepository;

export const SETTINGS_STORE_KEY: InjectionKey<ConfigStore> = Symbol('SETTINGS_STORE');

interface ConfigStoreProps {
  repository: ISettingsRepository;
}

export const useSettings = (): ConfigStore => {
  const providedSettingsStore = inject(SETTINGS_STORE_KEY, undefined);

  if (providedSettingsStore) {
    return providedSettingsStore;
  }

  throw new Error("Settings store not initialized. Please use 'SettingsProvider' component to initialize");
};

export const createSettingsStore = ({ repository }: ConfigStoreProps): ConfigStore => {
  const save = repository.save;
  const clear = repository.clear;
  const load = repository.load;
  const exist = repository.exist;
  return { save, clear, load, exist };
};
