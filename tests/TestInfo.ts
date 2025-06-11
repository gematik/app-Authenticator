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
  [ETerminalTypes.LOCAL]: `${CONNECTOR_TEST_ENTRY_OPTIONS.hostname}/${CONNECTOR_TEST_ENTRY_OPTIONS.localKT}/config/card/insert`,
  [ETerminalTypes.REMOTE]: `${CONNECTOR_TEST_ENTRY_OPTIONS.hostname}/${CONNECTOR_TEST_ENTRY_OPTIONS.remoteKT}/config/card/insert`,
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
  logger.info('--Testsystem: \n' + 'Konnektor-Test-Konnektor-Farm' + ', -Host: ' + entryOptions.hostname);
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
