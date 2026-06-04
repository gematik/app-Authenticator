/*
 * Copyright 2026, gematik GmbH
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
import { TSdsService, TSdsServiceMap, TSdsServiceVersion } from '../type-definitions';
import { compareSemver, parseSemver } from '../ptv/semver';

function localName(qualifiedName: string): string {
  const colonIdx = qualifiedName.indexOf(':');
  return colonIdx === -1 ? qualifiedName : qualifiedName.slice(colonIdx + 1);
}

// Returns every <Version> the Konnektor advertises per service; the caller picks one.
export default function parse(xmlStr: string): TSdsServiceMap {
  const serviceMap: TSdsServiceMap = new Map<string, TSdsService>();
  if (typeof xmlStr !== 'string' || !xmlStr) return serviceMap;

  const parser = saxParser.parser(true);
  let currentService: TSdsService | null = null;
  let currentVersion: TSdsServiceVersion | null = null;

  parser.onopentag = function (tag: { name: string; attributes: Record<string, string> }) {
    const name = localName(tag.name);

    if (name === 'Service' && tag.attributes.Name) {
      currentService = { name: tag.attributes.Name, versions: [] };
      serviceMap.set(currentService.name, currentService);
      return;
    }

    if (name === 'Version' && tag.attributes.Version) {
      currentVersion = {
        version: tag.attributes.Version,
        targetNamespace: tag.attributes.TargetNamespace || '',
        endpointTls: '',
      };
      return;
    }

    if (name === 'EndpointTLS' && currentVersion && tag.attributes.Location) {
      currentVersion.endpointTls = tag.attributes.Location;
    }
  };

  parser.onclosetag = function (qualifiedName: string) {
    const name = localName(qualifiedName);

    if (name === 'Version' && currentService && currentVersion && currentVersion.endpointTls) {
      currentService.versions.push(currentVersion);
      currentVersion = null;
      return;
    }
    if (name === 'Version') {
      currentVersion = null;
      return;
    }
    if (name === 'Service') {
      currentService = null;
    }
  };

  parser.write(xmlStr).end();
  return serviceMap;
}

// Highest-semver version with a TLS endpoint, optionally capped at `maxMajorMinor` (e.g. '8.1').
// When nothing fits the cap, falls back to the highest available — downstream then fails loudly
// instead of silently routing to undefined.
export function pickHighestSupportedVersion(
  service: TSdsService | undefined,
  maxMajorMinor?: string,
): TSdsServiceVersion | undefined {
  if (!service || service.versions.length === 0) return undefined;
  const usable = service.versions.filter((v) => v.endpointTls);
  if (usable.length === 0) return undefined;

  const sortedDesc = [...usable].sort((a, b) => compareSemver(b.version, a.version));
  if (!maxMajorMinor) return sortedDesc[0];

  const [maxMajor, maxMinor] = parseSemver(maxMajorMinor);
  const withinCap = sortedDesc.find((v) => {
    const [major, minor] = parseSemver(v.version);
    return major < maxMajor || (major === maxMajor && minor <= maxMinor);
  });
  return withinCap ?? sortedDesc[0];
}

// Convenience used by legacy callers: serviceName → highest TLS endpoint, no cap.
export function flattenToEndpointMap(services: TSdsServiceMap): Map<string, string> {
  const out = new Map<string, string>();
  for (const [name, svc] of services.entries()) {
    const chosen = pickHighestSupportedVersion(svc);
    if (chosen) out.set(name, chosen.endpointTls);
  }
  return out;
}
