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
