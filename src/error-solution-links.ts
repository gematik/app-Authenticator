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

/*
 * This file contains links to possible solutions for common errors encountered during function test.
 */
import { logger } from '@/renderer/service/logger';

export const ERROR_SOLUTION_LINKS = {
  KONNEKTOR: {
    SSLV3_ALERT_BAD_CERTIFICATE:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung%3ABeiKonnektor-VerbindungenerscheintderFehlerSSLV3_ALERT_BAD_CERTIFICATEoderSSLV3_ALERT_CERTIFICATE_UNKNOWN%3A',
    ALERT_CERTIFICATE_UNKNOWN:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung%3ABeiKonnektor-VerbindungenerscheintderFehlerSSLV3_ALERT_BAD_CERTIFICATEoderSSLV3_ALERT_CERTIFICATE_UNKNOWN%3A',
    UNRESOLVABLE_HOST:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestdesgematikAuthenticatorszeigtan,dasserkeineVerbindungzumKonnektoraufbauenkann.',
    HOSTNAME_CERT_ALTNAME_MISMATCH:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenKonnektor-VerbindungstestdieMeldung%22Fehler:Hostname/IPdoesnotmatchcertificate%C2%B4saltnames:IP:XXX.XX.X.XXisnotinthecert%C2%B4slist:%22an.',
    SELF_SIGNED_CERTIFICATE:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenIDP-VerbindungstestdieMeldung%22Fehler:selfsignedcertificateincertificatechain%22',
    UNVERIFIABLE_CERTIFICATE_CHAIN:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenIDP-VerbindungstestdieMeldung%22Fehler:selfsignedcertificateincertificatechain%22',
    BRAINPOOL_UNKNOWN_GROUP:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung%3AFehler%E2%80%9EErreichbarkeitdesKonnektors%E2%80%93writeEPROTO%E2%80%A6UNKNOWN_GROUP%E2%80%9C',
  },
  HBA: {
    NO_CARD_FOUND:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembescheibung:DerFunktionstestzeigtf%C3%BCrdenKonnektor-VerbindungstestdieMeldung%22Hinweis:EswurdekeineHBAimKartenterminalgefunden.Siek%C3%B6nnendiesignorieren,wennSief%C3%BCrdieFachanwendungkeinenHBAben%C3%B6tigen%22an.',
  },
  SMCB: {
    NOT_VERIFIED:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenKonnektor-VerbindungstestdieMeldung%22IhreSMC-BKarteinSlotXvomKartenterminalXXXistnichtfreigeschaltet.BitteschaltenSiedieseinIhremKartenverwaltungssystemfreiundstartenSiedenFunktion',
  },
  IDP: {
    SELF_SIGNED_CERTIFICATE:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenIDP-VerbindungstestdieMeldung%22Fehler:selfsignedcertificateincertificatechain%22',
    PROXY_AUTHENTICATION_REQUIRED_407:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenIDP-VerbindungstestdieMeldung%22Fehler:Badresponse:407mitderURL....%22an.',
    UNVERIFIABLE_CERTIFICATE_CHAIN:
      'https://wiki.gematik.de/spaces/GAKB/pages/606550590/F%C3%BCr+Nutzer+oder+Administratoren#F%C3%BCrNutzeroderAdministratoren-Problembeschreibung:DerFunktionstestzeigtf%C3%BCrdenIDP-VerbindungstestdieMeldung%22Fehler:selfsignedcertificateincertificatechain%22',
  },
  CERTIFICATES: {},
};

const ERROR_PATTERNS_TO_SOLUTION_LINKS = {
  KONNEKTOR: {
    SSLV3_ALERT_BAD_CERTIFICATE: ERROR_SOLUTION_LINKS.KONNEKTOR.SSLV3_ALERT_BAD_CERTIFICATE,
    ALERT_CERTIFICATE_UNKNOWN: ERROR_SOLUTION_LINKS.KONNEKTOR.ALERT_CERTIFICATE_UNKNOWN,
    ENOTFOUND: ERROR_SOLUTION_LINKS.KONNEKTOR.UNRESOLVABLE_HOST,
    ECONNREFUSED: ERROR_SOLUTION_LINKS.KONNEKTOR.UNRESOLVABLE_HOST,
    "Cannot read properties of undefined (reading 'hostname')": ERROR_SOLUTION_LINKS.KONNEKTOR.UNRESOLVABLE_HOST,
    "Cannot read properties of undefined (reading 'body')": ERROR_SOLUTION_LINKS.KONNEKTOR.UNRESOLVABLE_HOST,
    'does not match certificate': ERROR_SOLUTION_LINKS.KONNEKTOR.HOSTNAME_CERT_ALTNAME_MISMATCH,
    'self signed certificate in certificate chain': ERROR_SOLUTION_LINKS.KONNEKTOR.SELF_SIGNED_CERTIFICATE,
    'unable to verify the first certificate': ERROR_SOLUTION_LINKS.KONNEKTOR.UNVERIFIABLE_CERTIFICATE_CHAIN,
    'OPENSSL_internal:UNKNOWN_GROUP': ERROR_SOLUTION_LINKS.KONNEKTOR.BRAINPOOL_UNKNOWN_GROUP,
  },
  SMCB: {
    'Ihre SMC-B Karte in Slot': ERROR_SOLUTION_LINKS.SMCB.NOT_VERIFIED,
  },
  HBA: {
    'Hinweis: Es wurde keine HBA im Kartenterminal gefunden': ERROR_SOLUTION_LINKS.HBA.NO_CARD_FOUND,
  },
  IDP: {
    'self signed certificate in certificate chain': ERROR_SOLUTION_LINKS.IDP.SELF_SIGNED_CERTIFICATE,
    'Bad response 407': ERROR_SOLUTION_LINKS.IDP.PROXY_AUTHENTICATION_REQUIRED_407,
    'unable to verify the first certificate': ERROR_SOLUTION_LINKS.IDP.UNVERIFIABLE_CERTIFICATE_CHAIN,
  },
  CERTIFICATES: {},
} as const;

type TSolutionLinksScope = keyof typeof ERROR_PATTERNS_TO_SOLUTION_LINKS;

// Helper to find the semantic key (e.g., "KONNEKTOR.UNRESOLVABLE_HOST") for a given URL.
function findKeyForValue(obj: Record<string, any>, value: string, currentPath = ''): string | undefined {
  for (const key in obj) {
    const newPath = currentPath ? `${currentPath}.${key}` : key;
    const currentValue = obj[key];
    if (typeof currentValue === 'object' && currentValue !== null) {
      const foundPath = findKeyForValue(currentValue, value, newPath);
      if (foundPath) return foundPath;
    } else if (currentValue === value) {
      return newPath;
    }
  }
  return undefined;
}

/**
 * Finds a solution link for a given error message.
 * If a scope is provided, it searches only within that scope.
 * If no scope is provided, it searches across all scopes.
 *
 * @param errorMessage The error message to search for.
 * @param scope Optional scope ('KONNEKTOR', 'IDP', 'HBA', 'SMCB' or CERTIFICATES) to limit the search.
 * @returns The found solution link as a string, or undefined if no match is found.
 */
export function findSolutionLinkByError(errorMessage: string, scope?: TSolutionLinksScope): string | undefined {
  if (errorMessage === '200' && (scope === 'IDP' || scope === 'KONNEKTOR')) return undefined; // this is not an error
  const result = scope
    ? findSolutionLinkInOneScope(errorMessage, scope)
    : findSolutionLinkByErrorInAllScopes(errorMessage);

  if (result) {
    const solutionKey = findKeyForValue(ERROR_SOLUTION_LINKS, result);
    logger.info(`Found a possible FAQ Solution: ${solutionKey}`);
  } else {
    logger.debug(`Could not find a possible FAQ solution for the error: "${errorMessage}" in scope: ${scope}`);
  }
  return result;
}

function findSolutionLinkInOneScope(errorMessage: string, scope: TSolutionLinksScope): string | undefined {
  const patternsForScope = ERROR_PATTERNS_TO_SOLUTION_LINKS[scope];
  return Object.entries(patternsForScope).find(([pattern]) => errorMessage.includes(pattern))?.[1];
}

function findSolutionLinkByErrorInAllScopes(errorMessage: string): string | undefined {
  for (const scope of Object.keys(ERROR_PATTERNS_TO_SOLUTION_LINKS) as TSolutionLinksScope[]) {
    const link = findSolutionLinkInOneScope(errorMessage, scope);
    if (link) {
      return link;
    }
  }
  return undefined;
}
