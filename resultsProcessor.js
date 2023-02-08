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

/*
 * In this file, multiple test result processors can be defined, e.g. sonar specific reporting
 * or jest-junit for a better test result overview in Jenkins.
 */

module.exports = function () {
  require('./node_modules/jest-sonar-reporter').apply(this, arguments);
  return require('./node_modules/jest-junit').apply(this, arguments);
  // add any other processor you need
};
