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
 */

import opeSys from 'os';
import { PathProvider } from '@/renderer/service/path-provider';
import path from 'path';
import fs from 'fs';
import { CA_CONNECTOR_DIR_PATH, CA_IDP_DIR_PATH } from '@/constants';
import { buildCaChainsConnector } from '@/renderer/modules/connector/common/utils';
import getIdpTlsCertificates from '@/renderer/utils/get-idp-tls-certificates';
import { logger } from '@/renderer/service/logger';

const connCaPath = process.cwd() + '/tests/resources/certs/example/conn-ca.pem';
const idpCaPath = process.cwd() + '/tests/resources/certs/example/tu-ca.crt';
const appAsar = path.sep + 'aPp.asaR';

beforeAll(() => {
  PathProvider.setAppPath('undefined');
  PathProvider.setSystemUserTempPath(opeSys.tmpdir() + '\\portable');
  return setUp();
});

async function setUp() {
  let testProgramFileFor = path.join(opeSys.tmpdir(), 'Program File Test');
  !fs.existsSync(testProgramFileFor) && fs.mkdirSync(testProgramFileFor);

  testProgramFileFor = path.join(testProgramFileFor, 'resources');
  !fs.existsSync(testProgramFileFor) && fs.mkdirSync(testProgramFileFor);

  await fs.writeFile(testProgramFileFor + appAsar, '1234567890', function (err) {
    if (err) throw err;
    logger.info('File is created successfully.', testProgramFileFor + appAsar);
  });
  PathProvider.setAppPath(testProgramFileFor + appAsar);

  const testProgramFileCaConnectorDir = path.join(testProgramFileFor, CA_CONNECTOR_DIR_PATH);
  !fs.existsSync(testProgramFileCaConnectorDir) && fs.mkdirSync(testProgramFileCaConnectorDir);

  await fs.copyFile(connCaPath, testProgramFileCaConnectorDir + '/conn-ca.pem', (err) => {
    if (err) {
      logger.error('Error Found:', err);
    } else {
      logger.info('connCa copied:', connCaPath);
    }
  });

  const testProgramFileCaIdpDir = path.join(testProgramFileFor, CA_IDP_DIR_PATH);
  !fs.existsSync(testProgramFileCaIdpDir) && fs.mkdirSync(testProgramFileCaIdpDir);
  await fs.copyFile(idpCaPath, testProgramFileCaIdpDir + '/idp.crt', (err) => {
    if (err) {
      logger.error('Error Found:', err);
    } else {
      logger.info('IdpCa copied nach:', testProgramFileCaIdpDir + '/idp.crt');
    }
  });
}

describe('Test die vordefinierte Struktur von Setup', () => {
  it('Wenn authenticator durch setup in Program File ist', async () => {
    const caConnectorCerts = buildCaChainsConnector();

    const caIdpCerts = getIdpTlsCertificates();
    expect(caConnectorCerts).toBeTruthy();
    expect((caConnectorCerts?.length || 0) > 0).toBeTruthy();

    expect(caIdpCerts).toBeTruthy();
    expect(caIdpCerts?.length).toBe(0);
  });
});
