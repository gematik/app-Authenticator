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
