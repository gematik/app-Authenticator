/*
 * Copyright 2024 gematik GmbH
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

const saxParser = require('sax');
import { TTag } from '../type-definitions';

/**
 * This parser is suitable for extracting value from xml tag parameters
 * @param xmlStr
 */
export default function parse(xmlStr: string) {
  const parser = saxParser.parser(true);
  const serviceMap = new Map<string, string>();
  let versionMap = new Map<string, string>();
  let entry: TTag | null = null;
  let serviceName: string;
  let serviceVersion: string;

  parser.onclosetag = function (tagName: string) {
    if (tagName.indexOf('EndpointTLS') > -1 && entry) {
      const currentVersion = versionMap.keys().next().value;
      if (versionMap.size === 0 || (currentVersion && serviceVersion > currentVersion)) {
        versionMap.clear();
        versionMap.set(serviceVersion, entry.attributes.Location);
        serviceMap.set(serviceName, entry.attributes.Location);
      }
    }
  };

  parser.onopentag = function (tag: TTag) {
    entry = tag;
    if (tag.name.indexOf('Service') > -1) {
      serviceName = entry.attributes.Name;
      versionMap = new Map<string, string>();
    }
    if (tag.name.indexOf('Version') > -1 && entry.attributes.Version) {
      serviceVersion = entry.attributes.Version;
    }
  };

  parser.write(xmlStr).end();
  return serviceMap;
}
