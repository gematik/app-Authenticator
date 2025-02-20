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
import 'vue-i18n';

declare module 'vue-i18n' {
  interface DefineLocaleMessage {
    [key: string]: string;
  }
}

const messages = await import('@/renderer/i18n/translations/de.json');

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: keyof typeof messages, data?: Record<any, any>) => string;
    $router: import('vue-router').Router;
  }
}
