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

import { NavigationGuardNext, RouteLocationNormalized, RouteRecordRaw } from 'vue-router';
import { ConfigAssistant, ConfigAssistantLandingScreen } from './index';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import {
  confirmStartConfigAssistantWithDefaultConfig,
  confirmStartConfigAssistantWithInvalidCentralConfiguration,
} from '@/renderer/modules/settings/screens/modalDialogs';

const configAssistantGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  try {
    if (FileStorageRepository.isCentralConfigurationInvalid && FileStorageRepository.isNewInstallation) {
      const { isConfirmed } = await confirmStartConfigAssistantWithInvalidCentralConfiguration();
      return isConfirmed ? next() : next(false);
    } else if (FileStorageRepository.isDefaultConfigFile) {
      const { isConfirmed } = await confirmStartConfigAssistantWithDefaultConfig();
      return isConfirmed ? next() : next(false);
    }
    next();
  } catch (error) {
    next(false);
  }
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/config-assistant',
    name: 'config-assistant-landing',
    component: ConfigAssistantLandingScreen,
    beforeEnter: configAssistantGuard,
  },
  {
    path: '/config-assistant/:konnektor/:step',
    name: 'config-assistant',
    component: ConfigAssistant,
    props: (route) => ({ konnektor: route.params.konnektor, currentStep: +route.params.step }),
  },
];

export default routes;
