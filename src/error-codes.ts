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

export const ERROR_CODES = {
  AUTHCL_0001: 'AUTHCL_0001',
  AUTHCL_0002: 'AUTHCL_0002',
  AUTHCL_0003: 'AUTHCL_0003',
  AUTHCL_0004: 'AUTHCL_0004',
  AUTHCL_0005: 'AUTHCL_0005',
  AUTHCL_0006: 'AUTHCL_0006',
  AUTHCL_0007: 'AUTHCL_0007',
  AUTHCL_0008: 'AUTHCL_0008',
  AUTHCL_0009: 'AUTHCL_0009',
  AUTHCL_0010: 'AUTHCL_0010',
  AUTHCL_0011: 'AUTHCL_0011',
  AUTHCL_0012: 'AUTHCL_0012',
  AUTHCL_0013: 'AUTHCL_0013',

  // connector errors begin with 1XXX
  AUTHCL_1000: 'AUTHCL_1000',
  AUTHCL_1001: 'AUTHCL_1001',
  AUTHCL_1003: 'AUTHCL_1003',
  AUTHCL_1004: 'AUTHCL_1004',
  AUTHCL_1005: 'AUTHCL_1005',
  AUTHCL_1006: 'AUTHCL_1006',
  AUTHCL_1010: 'AUTHCL_1010',
  AUTHCL_1011: 'AUTHCL_1011',
  AUTHCL_1012: 'AUTHCL_1012',
  AUTHCL_1014: 'AUTHCL_1014',
  AUTHCL_1015: 'AUTHCL_1015',
  AUTHCL_1016: 'AUTHCL_1016',
  AUTHCL_1018: 'AUTHCL_1018',
  AUTHCL_1020: 'AUTHCL_1020',
  AUTHCL_1021: 'AUTHCL_1021',
  AUTHCL_1047: 'AUTHCL_1047',
  AUTHCL_1049: 'AUTHCL_1049',
  AUTHCL_1204: 'AUTHCL_1204',

  // Internal Connector-Module errors start with 11XX
  AUTHCL_1100: 'AUTHCL_1100',
  AUTHCL_1101: 'AUTHCL_1101',
  AUTHCL_1102: 'AUTHCL_1102',
  AUTHCL_1103: 'AUTHCL_1103',
  AUTHCL_1104: 'AUTHCL_1104',
  AUTHCL_1105: 'AUTHCL_1105',
  AUTHCL_1106: 'AUTHCL_1106',
  AUTHCL_1107: 'AUTHCL_1107',
  AUTHCL_1108: 'AUTHCL_1108',
  AUTHCL_1110: 'AUTHCL_1110',
  AUTHCL_1111: 'AUTHCL_1111',
  AUTHCL_1113: 'AUTHCL_1113',
  AUTHCL_1114: 'AUTHCL_1114',
  AUTHCL_1115: 'AUTHCL_1115',
  AUTHCL_1116: 'AUTHCL_1116',
  AUTHCL_1117: 'AUTHCL_1117',
  AUTHCL_1119: 'AUTHCL_1119',
  AUTHCL_1120: 'AUTHCL_1120',
  /**
   * @deprecated
   */
  AUTHCL_1118: 'AUTHCL_1118',

  // prompts start with 2XXX
  AUTHCL_2001: 'AUTHCL_2001',
  AUTHCL_2002: 'AUTHCL_2002',
  AUTHCL_2003: 'AUTHCL_2003',
};

/**
 * Connector Error Code list
 */
export const CONNECTOR_ERROR_CODES = {
  E4004: '4004', // Ungültige Mandanten-ID
  E4005: '4005', // Ungültige Clientsystem-ID
  E4006: '4006', // Ungültige Arbeitsplatz-ID
  E4010: '4010', // Clientsystem ist dem Mandanten nicht zugeordnet
  E4011: '4011', // Arbeitsplatz ist dem Mandanten nicht zugeordnet
  E4012: '4012', // Kartenterminal ist dem Mandanten nicht zugeordnet
  E4014: '4014', // Für den Mandanten ist der Arbeitsplatz nicht dem Clientsystem zugeordnet
  E4015: '4015', // Kartenterminal ist weder lokal noch entfernt vom Arbeitsplatz aus zugreifbar
  E4016: '4016', // Kartenterminal ist nicht lokal vom Arbeitsplatz aus zugreifbar
  E4018: '4018', // Smart card Session already in use
  E4020: '4020', // Kartenterminal ist weder lokal noch entfernt über irgendeinen dem Clientsystem zugeordneten Arbeitsplatz aus zugreifbar
  E4021: '4021', // Es sind nicht alle Pflichtparameter mandantId, clientSystemId, workplaceId gefüllt
  E4047: '4047', // Card handle ungültig, wrong card or missing pin vs.
  E4049: '4049', // User cancelled the PIN enter process
  E4092: '4092', // RemotePin not supported
  E4204: '4204', // Clientsystem aus dem Aufrufkontext konnte nicht authentifiziert werden.
};

/**
 * List of Connector's own Error codes
 * All of these errors are fatal errors, for non-fatal errors implement custom handling
 */
export const MAPPED_CONNECTOR_FATAL_ERRORS = {
  [CONNECTOR_ERROR_CODES.E4004]: ERROR_CODES.AUTHCL_1004,
  [CONNECTOR_ERROR_CODES.E4005]: ERROR_CODES.AUTHCL_1005,
  [CONNECTOR_ERROR_CODES.E4006]: ERROR_CODES.AUTHCL_1006,
  [CONNECTOR_ERROR_CODES.E4010]: ERROR_CODES.AUTHCL_1010,
  [CONNECTOR_ERROR_CODES.E4011]: ERROR_CODES.AUTHCL_1011,
  [CONNECTOR_ERROR_CODES.E4012]: ERROR_CODES.AUTHCL_1012,
  [CONNECTOR_ERROR_CODES.E4014]: ERROR_CODES.AUTHCL_1014,
  [CONNECTOR_ERROR_CODES.E4015]: ERROR_CODES.AUTHCL_1015,
  [CONNECTOR_ERROR_CODES.E4016]: ERROR_CODES.AUTHCL_1016,
  [CONNECTOR_ERROR_CODES.E4018]: ERROR_CODES.AUTHCL_1018,
  [CONNECTOR_ERROR_CODES.E4020]: ERROR_CODES.AUTHCL_1020,
  [CONNECTOR_ERROR_CODES.E4021]: ERROR_CODES.AUTHCL_1021,
  [CONNECTOR_ERROR_CODES.E4049]: ERROR_CODES.AUTHCL_1049,
  [CONNECTOR_ERROR_CODES.E4204]: ERROR_CODES.AUTHCL_1204,
};

/**
 * Problems that customer can solve by himself.
 * We have more explanation in translation file about error codes for such kind of errors
 */
export const USER_FACING_WARNINGS = [
  ERROR_CODES.AUTHCL_1000,
  ERROR_CODES.AUTHCL_1018,
  ERROR_CODES.AUTHCL_1101,
  ERROR_CODES.AUTHCL_1105,
  ERROR_CODES.AUTHCL_1104,
  ERROR_CODES.AUTHCL_1103,
  ERROR_CODES.AUTHCL_1120,
  ERROR_CODES.AUTHCL_1106,
];

/**
 * Fatal Errors List
 * User Should call Admin to solve the Problem
 */
export const INTERNAL_FATAL_ERRORS = [
  ERROR_CODES.AUTHCL_0003,
  ERROR_CODES.AUTHCL_0004,
  ERROR_CODES.AUTHCL_1100,
  ERROR_CODES.AUTHCL_1110,
  ERROR_CODES.AUTHCL_1111,
  ERROR_CODES.AUTHCL_1113,
  ERROR_CODES.AUTHCL_1114,
  ERROR_CODES.AUTHCL_1115,
  ERROR_CODES.AUTHCL_1116,
  ERROR_CODES.AUTHCL_1117,
  ERROR_CODES.AUTHCL_1118,
  ERROR_CODES.AUTHCL_1119,
];

/**
 * If you update this list, please also update following documentations
 * NOTE: These explanations are only for developers. They do not appear in the app
 * https://wiki.gematik.de/pages/viewpage.action?pageId=442574778
 * https://wiki.gematik.de/display/AUTHCL/Fehlercodes+des+Authenticators
 */
export const ERROR_CODE_EXPLANATIONS = {
  [ERROR_CODES.AUTHCL_0001]: 'Invalid launcher parameter received',
  [ERROR_CODES.AUTHCL_0002]: 'IdP returned error or Undefined IdP error',
  [ERROR_CODES.AUTHCL_0003]: 'JWS hashing failed',
  [ERROR_CODES.AUTHCL_0004]: 'JWS signature missing or invalid',
  [ERROR_CODES.AUTHCL_0005]: 'Auth Response validation failed',
  [ERROR_CODES.AUTHCL_0006]: 'Sie haben den Vorgang abgebrochen',
  [ERROR_CODES.AUTHCL_0007]: 'Invalid Redirect uri or protocol',
  [ERROR_CODES.AUTHCL_0008]: 'You do not have permission to save config file!',
  [ERROR_CODES.AUTHCL_0009]: 'Auto redirect request failed',
  [ERROR_CODES.AUTHCL_0010]: 'Failed to save to credentials manager',
  [ERROR_CODES.AUTHCL_0011]: 'User declined the consent',
  [ERROR_CODES.AUTHCL_0012]: 'Config.json is not valid!',
  [ERROR_CODES.AUTHCL_0013]: 'Creating JWE Signature failed',

  [ERROR_CODES.AUTHCL_1000]: 'Could not connect to connector',
  [ERROR_CODES.AUTHCL_1001]: 'Can not get card handle',
  [ERROR_CODES.AUTHCL_1003]: 'Could not read the terminals',
  [ERROR_CODES.AUTHCL_1004]: 'ConErr: 4004 => Ungültige Mandanten-ID',
  [ERROR_CODES.AUTHCL_1005]: 'ConErr: 4005 => Ungültige Clientsystem-ID',
  [ERROR_CODES.AUTHCL_1006]: 'ConErr: 4006 => Ungültige Arbeitsplatz-ID',
  [ERROR_CODES.AUTHCL_1010]: 'ConErr: 4010 => Clientsystem ist dem Mandanten nicht zugeordnet',
  [ERROR_CODES.AUTHCL_1011]: 'ConErr: 4011 => Arbeitsplatz ist dem Mandanten nicht zugeordnet',
  [ERROR_CODES.AUTHCL_1012]: 'ConErr: 4012 => Kartenterminal ist dem Mandanten nicht zugeordnet',
  [ERROR_CODES.AUTHCL_1014]: 'ConErr: 4014 => Für den Mandanten ist der Arbeitsplatz nicht dem Clientsystem zugeordnet',
  [ERROR_CODES.AUTHCL_1015]:
    'ConErr: 4015 => Kartenterminal ist weder lokal noch entfernt vom Arbeitsplatz aus zugreifbar',
  [ERROR_CODES.AUTHCL_1016]: 'ConErr: 4016 => Kartenterminal ist nicht lokal vom Arbeitsplatz aus zugreifbar',
  [ERROR_CODES.AUTHCL_1018]: 'Smart card Session already in use',
  [ERROR_CODES.AUTHCL_1020]:
    'ConErr: 4020 => Kartenterminal ist weder lokal noch entfernt über irgendeinen dem Clientsystem zugeordneten Arbeitsplatz aus zugreifbar',
  [ERROR_CODES.AUTHCL_1021]:
    'ConErr: 4021 => Es sind nicht alle Pflichtparameter mandantId, clientSystemId, workplaceId gefüllt',
  [ERROR_CODES.AUTHCL_1047]: 'ConErr: 4047 => Card handle ungültig, wrong card or missing pin vs.',
  [ERROR_CODES.AUTHCL_1049]: 'ConErr: 4049 => User cancelled the PIN process from the connector',
  [ERROR_CODES.AUTHCL_1204]: 'ConErr: 4204 => Clientsystem aus dem Aufrufkontext konnte nicht authentifiziert werden',

  [ERROR_CODES.AUTHCL_1100]: 'Could not connect to connector',
  [ERROR_CODES.AUTHCL_1101]: 'Check Pin Status error',
  [ERROR_CODES.AUTHCL_1102]: 'Pin verify error. User entered a wrong PIN or cancelled the process',
  [ERROR_CODES.AUTHCL_1103]: 'Invalid PIN status: REJECTED or BLOCKED',
  [ERROR_CODES.AUTHCL_1104]: 'ConErr: 4092 or Remote pin verify is not possible',
  [ERROR_CODES.AUTHCL_1105]: 'Several card found for single card type',
  [ERROR_CODES.AUTHCL_1106]: 'SMC-B Pin verify failed',
  [ERROR_CODES.AUTHCL_1108]: 'Error occurred while signing challenge',
  [ERROR_CODES.AUTHCL_1107]: 'Get card certificate failed',
  [ERROR_CODES.AUTHCL_1110]: "Connector Response couldn't be parsed properly",
  [ERROR_CODES.AUTHCL_1111]: 'Card Certificate not found or invalid',
  [ERROR_CODES.AUTHCL_1113]: 'No Card Terminals found',
  [ERROR_CODES.AUTHCL_1114]: 'Invalid Private Key Certificate for Connector',
  [ERROR_CODES.AUTHCL_1115]: 'Invalid Certificate for Connector',
  [ERROR_CODES.AUTHCL_1116]: 'Unknown Connector Error',
  [ERROR_CODES.AUTHCL_1117]: 'Invalid Base64 Signature received from Connector',
  [ERROR_CODES.AUTHCL_1118]: 'Connector returned wrong HTTP Status',
  [ERROR_CODES.AUTHCL_1119]: 'Read Config File failed for Function Test',
  [ERROR_CODES.AUTHCL_1120]: 'You have not unlocked your HBA-Card yet, which means the Transport-Pin is still active',

  [ERROR_CODES.AUTHCL_2001]: 'Please place the Cards',
  [ERROR_CODES.AUTHCL_2002]: 'Please enter the HBA PIN',
  [ERROR_CODES.AUTHCL_2003]: 'Please enter the SMC-B PIN',
};
