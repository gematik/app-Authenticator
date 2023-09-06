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
import { logger } from '@/renderer/service/logger';
import path from 'path';
import { TEntryOptions } from '@/renderer/modules/connector/type-definitions';
import fs from 'fs';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

export const CONNECTOR_PATHS = {
  KOCO: '/kon10',
  RISE: '/kon12',
  SECUNET: '/kon23',
};

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

export enum ETerminalTypes {
  LOCAL = 'LOCAL',
  REMOTE = 'REMOTE',
}

export enum ESlotActions {
  INSERT = 'INSERT',
  EJECT = 'EJECT',
}

export const CONNECTOR_URLS = {
  [ETerminalTypes.LOCAL]: `${CONNECTOR_TEST_ENTRY_OPTIONS.protocol}://${CONNECTOR_TEST_ENTRY_OPTIONS.hostname}/${CONNECTOR_TEST_ENTRY_OPTIONS.localKT}/config/card/insert`,
  [ETerminalTypes.REMOTE]: `${CONNECTOR_TEST_ENTRY_OPTIONS.protocol}://${CONNECTOR_TEST_ENTRY_OPTIONS.hostname}/${CONNECTOR_TEST_ENTRY_OPTIONS.remoteKT}/config/card/insert`,
};

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
