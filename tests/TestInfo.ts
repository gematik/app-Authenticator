/*
 * Copyright 2023 gematik GmbH
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

import ConnectorConfig from '@/renderer/modules/connector/connector_impl/connector-config';
import { getCallerInfo, logger } from '@/renderer/service/logger';
import path from 'path';
import { TEntryOptions } from '@/renderer/modules/connector/type-definitions';
import fs from 'fs';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { HTTP_METHODS, httpClient } from '../src/main/services/http-client';
import { httpReqConfig } from '../src/renderer/modules/connector/services';
import { TlsAuthType } from '../src/@types/common-types';

export const CONNECTOR_TEST_ENTRY_OPTIONS = {
  hostname: process.env.HOST_NAME ?? '',
  protocol: process.env.PROTOCOL,
  port: Number(process.env.PORT_NUMBER),
  path: '/connector.sds',
  method: 'GET',
  username: process.env.USER_NAME,
  password: process.env.PASSWORD_CONNECTOR_ENTRY,
  remoteKT: process.env.REMOTE_KT,
  localKT: process.env.LOCAL_KT,
};

export const CONNECTOR_TEST_CONTEXT_PARAMETERS = {
  mandantId: process.env.MANDANT_ID ?? '',
  clientId: process.env.CLIENT_ID ?? '',
  workplaceId: process.env.WORKPLACE_ID ?? '',
  userId: process.env.USER_ID ?? '',
};

export const CONNECTOR_TEST_REMOTE_KT_URL = `${CONNECTOR_TEST_ENTRY_OPTIONS.protocol}://${CONNECTOR_TEST_ENTRY_OPTIONS.hostname}/${CONNECTOR_TEST_ENTRY_OPTIONS.remoteKT}/config/card/insert`;
export const CONNECTOR_TEST_LOCAL_KT_URL = `${CONNECTOR_TEST_ENTRY_OPTIONS.protocol}://${CONNECTOR_TEST_ENTRY_OPTIONS.hostname}/${CONNECTOR_TEST_ENTRY_OPTIONS.localKT}/config/card/insert`;

export const smcbCardRemoved = JSON.stringify({
  slotNumber: 2, // SMC_B Karte in Slot 2
  inserted: false,
});

export const smcbCardSlot1Removed = JSON.stringify({
  slotNumber: 1, // SMC_B Karte in Slot 1
  inserted: false,
});

export const smcbCardSlot2Removed = JSON.stringify({
  slotNumber: 2, // SMC_B Karte in Slot 2
  inserted: false,
});

export const smcbCardSlot3Removed = JSON.stringify({
  slotNumber: 3, // SMC_B Karte in Slot 3
  inserted: false,
});
export const hbaTransportPinCardSlot3Removed = JSON.stringify({
  slotNumber: 3, // SMC_B Karte in Slot 2
  inserted: false,
});

export const smcbCardInserted = JSON.stringify({
  slotNumber: 2, // SMC_B Karte in Slot 2
  inserted: true,
});
export const smcbCardSlot1Inserted = JSON.stringify({
  slotNumber: 1, // SMC_B Karte in Slot 1
  inserted: true,
});
export const smcbCardSlot2Inserted = JSON.stringify({
  slotNumber: 2, // SMC_B Karte in Slot 2
  inserted: true,
});

export const hbaTransportPinCardSlot3Inserted = JSON.stringify({
  slotNumber: 3, // HBA mit Transport PIN in Slot 3
  inserted: true,
});

export const hbaCardInserted = JSON.stringify({
  slotNumber: 1, // HBA Karte in Slot 2
  inserted: true,
});
export const hbaCardRemoved = JSON.stringify({
  slotNumber: 1, // HBA Karte in Slot 2
  inserted: false,
});
export const TIME_OUT_VALUE_JEST = 90000;

export function printSimpleTestInfo(filename: string): void {
  printTestTitle(filename);
  logger.info('--Testsystem: \n' + getSystemInfo() + '\n--Expected configuration: \n' + getContextParametersInfo());
}

export function printTestInfo(filename: string, cardType: ECardTypes): void {
  printTestTitle(filename);
  logger.info(
    '--Testsystem: \n' +
      getSystemInfo() +
      '\n--Expected configuration: \n' +
      getContextParametersInfo() +
      '\n' +
      getCardsParametersInfo(cardType),
  );
}

export async function setCatsConfig(isRemoteKT: boolean) {
  try {
    ConnectorConfig.setTlsAuthType(TlsAuthType.BasicAuth.valueOf());
    //step1 Vorbedingung
    // Local KT
    const res = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),

      isRemoteKT ? smcbCardRemoved : smcbCardInserted,
    );
    expect(res).toBeDefined();
    expect(res?.status).toBe(200);
    // Remote KT
    const response = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      isRemoteKT ? smcbCardInserted : smcbCardRemoved,
    );
    expect(response).toBeDefined();
    expect(response?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function removeAllCardsFromLocalKT() {
  try {
    const smcbRes1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot1Removed,
    ); // Remote KT
    expect(smcbRes1).toBeDefined();
    expect(smcbRes1?.status).toBe(200);

    const smcbRes2 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Removed,
    ); // Remote KT
    expect(smcbRes2).toBeDefined();
    expect(smcbRes2?.status).toBe(200);

    const hbaTransportRes = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaTransportPinCardSlot3Removed,
    ); // Remote KT
    expect(hbaTransportRes).toBeDefined();
    expect(hbaTransportRes?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function removeCardFromLocalKT_Slot1() {
  try {
    const smcbRes1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot1Removed,
    ); // Remote KT
    expect(smcbRes1).toBeDefined();
    expect(smcbRes1?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function removeCardFromLocalKT_Slot2() {
  try {
    const smcbRes1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Removed,
    ); // Remote KT
    expect(smcbRes1).toBeDefined();
    expect(smcbRes1?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function removeCardFromLocalKT_Slot3() {
  try {
    const smcbRes1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot3Removed,
    ); // Remote KT
    expect(smcbRes1).toBeDefined();
    expect(smcbRes1?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function removeAllCardsFromRemoteKT() {
  try {
    const smcbRes1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardSlot1Removed,
    ); // Remote KT
    expect(smcbRes1).toBeDefined();
    expect(smcbRes1?.status).toBe(200);

    const smcbRes2 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Removed,
    ); // Remote KT
    expect(smcbRes2).toBeDefined();
    expect(smcbRes2?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function insertCardIntoLocalKT_Slot1_HBA() {
  try {
    const hbaResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaCardInserted,
    ); // Local KT
    expect(hbaResponse).toBeDefined();
    expect(hbaResponse?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function insertCardIntoLocalKT_Slot2_SMCB() {
  try {
    const hbaResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Inserted,
    ); // Local KT
    expect(hbaResponse).toBeDefined();
    expect(hbaResponse?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function insertCardIntoLocalKT_Slot3_HBATransportPin() {
  try {
    const hbaResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaTransportPinCardSlot3Inserted,
    ); // Local KT
    expect(hbaResponse).toBeDefined();
    expect(hbaResponse?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}
export async function insertAllCardsIntoLocalKT() {
  try {
    //step1 Vorbedingung
    const hbaRes = await httpClient(HTTP_METHODS.POST, CONNECTOR_TEST_REMOTE_KT_URL, httpReqConfig(), smcbCardRemoved); // Remote KT
    expect(hbaRes).toBeDefined();
    expect(hbaRes?.status).toBe(200);

    const smcbResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardInserted,
    );
    expect(smcbResponse).toBeDefined();
    expect(smcbResponse?.status).toBe(200);

    const hbaResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaCardInserted,
    ); // Local KT
    expect(hbaResponse).toBeDefined();
    expect(hbaResponse?.status).toBe(200);

    const smcbRes = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Inserted,
    ); // Local KT
    expect(smcbRes).toBeDefined();
    expect(smcbRes?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function insertAllCardsIntoLocalKTIncludingHBATransportPIN() {
  try {
    //step1 Vorbedingung
    const hbaRes = await httpClient(HTTP_METHODS.POST, CONNECTOR_TEST_REMOTE_KT_URL, httpReqConfig(), smcbCardRemoved); // Remote KT
    expect(hbaRes).toBeDefined();
    expect(hbaRes?.status).toBe(200);

    const smcbResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardInserted,
    );
    expect(smcbResponse).toBeDefined();
    expect(smcbResponse?.status).toBe(200);

    const hbaResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaCardInserted,
    ); // Local KT
    expect(hbaResponse).toBeDefined();
    expect(hbaResponse?.status).toBe(200);

    const smcbRes = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Inserted,
    ); // Local KT
    expect(smcbRes).toBeDefined();
    expect(smcbRes?.status).toBe(200);

    const hbaTransportRes = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaTransportPinCardSlot3Inserted,
    ); // Local KT
    expect(hbaTransportRes).toBeDefined();
    expect(hbaTransportRes?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export async function insertAllCardsIntoRemoteKT() {
  try {
    const smcbResRem1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardSlot1Inserted,
    ); // Local KT
    expect(smcbResRem1).toBeDefined();
    expect(smcbResRem1?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + e);
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e) + ', ' + e);
    fail('UNEXPECTED ERROR OCCURRED: ' + e);
  }

  try {
    const smcbResRem2 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Inserted,
    ); // Local KT
    expect(smcbResRem2).toBeDefined();
    expect(smcbResRem2?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + e);
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e) + ', ' + e);
    fail('UNEXPECTED ERROR OCCURRED: ' + e);
  }
}
export async function insertCardIntoRemoteKT_Slot1_SMCB() {
  try {
    const smcbResRem1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardSlot1Inserted,
    ); // Local KT
    expect(smcbResRem1).toBeDefined();
    expect(smcbResRem1?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + e);
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e) + ', ' + e);
    fail('UNEXPECTED ERROR OCCURRED: ' + e);
  }
}

export async function insertCardIntoRemoteKT_Slot2_SMCB() {
  try {
    const smcbResRem1 = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      smcbCardSlot2Inserted,
    ); // Local KT
    expect(smcbResRem1).toBeDefined();
    expect(smcbResRem1?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + e);
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e) + ', ' + e);
    fail('UNEXPECTED ERROR OCCURRED: ' + e);
  }
}

export async function unplugAllCards() {
  try {
    //step1 Vorbedingung
    const smcbRes = await httpClient(HTTP_METHODS.POST, CONNECTOR_TEST_LOCAL_KT_URL, httpReqConfig(), smcbCardRemoved); // Local KT
    expect(smcbRes).toBeDefined();
    expect(smcbRes?.status).toBe(200);
    const hbaRes = await httpClient(HTTP_METHODS.POST, CONNECTOR_TEST_REMOTE_KT_URL, httpReqConfig(), smcbCardRemoved); // Remote KT
    expect(hbaRes).toBeDefined();
    expect(hbaRes?.status).toBe(200);
    const smcbResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_REMOTE_KT_URL,
      httpReqConfig(),
      hbaCardRemoved,
    ); // Remote KT
    expect(smcbResponse).toBeDefined();
    expect(smcbResponse?.status).toBe(200);
    const hbaResponse = await httpClient(
      HTTP_METHODS.POST,
      CONNECTOR_TEST_LOCAL_KT_URL,
      httpReqConfig(),
      hbaCardRemoved,
    ); // Local KT
    expect(hbaResponse).toBeDefined();
    expect(hbaResponse?.status).toBe(200);
  } catch (e) {
    logger.error('UNEXPECTED ERROR OCCURRED: ' + getCallerInfo(e), e);
    fail('UNEXPECTED ERROR OCCURRED: ' + JSON.stringify(e));
  }
}

export function printEntryOptionsTest(filename: string, entryOptions: TEntryOptions): void {
  printTestTitle(filename);
  logger.info(
    '--Testsystem: \n' +
      'Konnektor-Test-Konnektor-Farm' +
      ', -Host: ' +
      entryOptions.hostname +
      ', -Port: ' +
      entryOptions.port +
      ', -Path: ' +
      entryOptions.path +
      ', -Method: ' +
      entryOptions.method,
  );
}

export function printWarningOnConfiguration(info: Error): void {
  logger.info(
    '!!! WARNING: This line should not visible. Test failed. (This test needs special configuration. Check why)\n' +
      info,
  );
}

export function printWarningByFailure(soapResp: string): void {
  logger.info('!!! WARNING: This line should not visible. Test failed. Check soapResp: \n' + soapResp);
}

export function printSpecialCardRequired(filename: string, info: string, cardType: ECardTypes): void {
  logger.info('\nTest: ' + filename);
  logger.info(
    '--Testsystem: \n' +
      getSystemInfo() +
      '\n--Expected configuration: \n' +
      getContextParametersInfo() +
      '\n' +
      getCardsParametersInfo(cardType) +
      '\n!!! SPECIAL CONFIGURATION REQUIRED: ' +
      info,
  );
}

export class TestCategory {
  static positivTest = 'Positivtest';
  static negativTest = 'Negativtest';
  static connectorTest = 'Konnektor-Test';
  static connectorTestKOPS = 'Konnektor-Test-KOPS';
  static connectorTestFARM = 'Konnektor-Test-Konnektor-Farm';
  static utilTest = 'Utils-Test';
}

export function getContextParametersInfo(): string {
  return (
    '-MandantId: ' +
    ConnectorConfig.contextParameters.mandantId +
    ', -ClientSystemId: ' +
    ConnectorConfig.contextParameters.clientId +
    ', -WorkplaceId: ' +
    ConnectorConfig.contextParameters.workplaceId
  );
}

export function getSystemInfo(): string {
  if (ConnectorConfig.tlsAuthType) {
    return (
      '-Konnektor-Simulator: KoPS' +
      ', -Host: ' +
      ConnectorConfig.tlsEntryOptions.hostname +
      ', -Port: ' +
      ConnectorConfig.tlsEntryOptions.port +
      ',\n-keyFile: ' +
      ConnectorConfig.tlsEntryOptions.keyFile +
      ',\n-certFile: ' +
      ConnectorConfig.tlsEntryOptions.certFile +
      ',\n-rejectUnauthorized: ' +
      ConnectorConfig.tlsEntryOptions.rejectUnauthorized
    );
  } else {
    return (
      '-Konnektor-Simulator: KoPS' +
      ', -Host: ' +
      ConnectorConfig.tlsEntryOptions.hostname +
      ', -Port: ' +
      ConnectorConfig.tlsEntryOptions.port
    );
  }
}

export function getCardsParametersInfo(cardType: ECardTypes): string {
  return ', -CardType: ' + ConnectorConfig.cardsParametersByType(cardType).cardType;
}

export function isXml(msg: string): boolean {
  return msg.includes('<?xml');
}

export function expectedFailure(msg: string): boolean {
  return (msg.includes('Expected') || msg.includes('expect')) && msg.includes('Received');
}

export function printTestTitle(filename: string): void {
  logger.info('§ Test: ' + filename + ' ');
}

export function determineSecureTestSourcePath(): string {
  return path.join(__dirname, '..', 'tests', 'resources', 'certs', 'kops');
}

export function readResourceFile(folder: string, filePath: string) {
  return fs.readFileSync(path.join(__dirname, 'resources', folder, filePath)).toString();
}
