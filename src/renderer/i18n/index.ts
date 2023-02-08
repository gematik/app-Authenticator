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

import { createI18n } from 'vue-i18n';
import de from './translations/de';
// import en from './translations/en';

// Ready translated locale messages
const messages = {
  // en,
  de,
};

// Create VueI18n instance with options
export default createI18n({
  locale: 'de', // navigator.language.substr(0, 2),
  fallbackLocale: 'de',
  messages, // set locale messages
});
