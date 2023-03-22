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

import { readResourceFile, TestCategory } from '../../../../TestInfo';
import sdsParser from '@/renderer/modules/connector/common/sds-parser';

function determineMapServiceEndpointTls(sds: string) {
  return handleSds(sds);
}

describe(TestCategory.positivTest, () => {
  it(TestCategory.utilTest + ': koco-PTV3', async () => {
    const sdsSecunet = readResourceFile('connSds', 'koco-PTV3.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);
    const map = new Map()
      .set('EncryptionService', 'https://10.11.236.247:443/service/encryptionservice')
      .set('SignatureService', 'https://10.11.236.247:443/service/signservice')
      .set('AuthSignatureService', 'https://10.11.236.247:443/service/authsignatureservice')
      .set('CardService', 'https://10.11.236.247:443/service/cardservice')
      .set('EventService', 'https://10.11.236.247:443/service/systeminformationservice')
      .set('CertificateService', 'https://10.11.236.247:443/service/certificateservice')
      .set('CardTerminalService', 'https://10.11.236.247:443/service/cardterminalservice')
      .set('AMTSService', 'https://10.11.236.247:443/service/fm/amts/amtsservice')
      .set('DPEService', 'https://10.11.236.247:443/service/fm/nfdm/dpeservice')
      .set('NFDService', 'https://10.11.236.247:443/service/fm/nfdm/nfdservice')
      .set('VSDService', 'https://10.11.236.247:443/service/fmvsdm')
      .set('KVKService', 'https://10.11.236.247:443/service/kvkservice');
    expect(mapServiceEndpointTls).toEqual(map);
  });

  it(TestCategory.utilTest + ': koco-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'koco-PTV4.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);
    const map = new Map()
      .set('EncryptionService', 'https://eau.dev.top.local/kon1/service/encryptionservice')
      .set('SignatureService', 'https://eau.dev.top.local/kon1/service/v75/signservice')
      .set('AuthSignatureService', 'https://eau.dev.top.local/kon1/service/authsignatureservice')
      .set('CardService', 'https://eau.dev.top.local/kon1/service/cardservice')
      .set('EventService', 'https://eau.dev.top.local/kon1/service/systeminformationservice')
      .set('CertificateService', 'https://eau.dev.top.local/kon1/service/certificateservice')
      .set('CardTerminalService', 'https://eau.dev.top.local/kon1/service/cardterminalservice')
      .set('AMTSService', 'https://eau.dev.top.local/kon1/service/fm/amts/amtsservice')
      .set('DPEService', 'https://eau.dev.top.local/kon1/service/fm/nfdm/dpeservice')
      .set('NFDService', 'https://eau.dev.top.local/kon1/service/fm/nfdm/nfdservice')
      .set('VSDService', 'https://eau.dev.top.local/kon1/service/fmvsdm')
      .set('KVKService', 'https://eau.dev.top.local/kon1/service/kvkservice')
      .set('PHRManagementService', 'https://eau.dev.top.local/kon1/service/fm/epa/phrmanagementservice')
      .set('PHRService', 'https://eau.dev.top.local/kon1/service/fm/epa/phrservice');
    expect(mapServiceEndpointTls).toEqual(map);
  });

  it(TestCategory.utilTest + ': kops-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'kops-PTV4.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);
    const map = new Map()
      .set('EncryptionService', 'https://172.24.0.2:443/encryptionservice')
      .set('SignatureService', 'https://172.24.0.2:443/signatureservice')
      .set('AuthSignatureService', 'https://172.24.0.2:443/authsignatureservice')
      //.set('CardService', 'https://172.24.0.2:443/cardservice810')
      .set('CardService', 'https://172.24.0.2:443/cardservice')
      .set('EventService', 'https://172.24.0.2:443/eventservice')
      .set('CertificateService', 'https://172.24.0.2:443/certificateservice')
      .set('CardTerminalService', 'https://172.24.0.2:443/cardterminalservice')
      .set('AMTSService', 'https://172.24.0.2:443/amtsservice')
      .set('PHRService', 'https://172.24.0.2:443/phrservice')
      .set('PHRManagementService', 'https://172.24.0.2:443/phrmanagementservice')
      .set('DPEService', 'https://172.24.0.2:443/dpeservice')
      .set('NFDService', 'https://172.24.0.2:443/nfdmservice')
      .set('VSDService', 'https://172.24.0.2:443/vsdservice')
      .set('KVKService', 'https://172.24.0.2:443/kvkservice')
      .set('LocalIdpService', 'https://172.24.0.2:443/ilocalidpservice')
      .set('IdpServiceActiveRequestor', 'https://172.24.0.2:443/iidpauthactiveclientservice');
    expect(mapServiceEndpointTls).toEqual(map);
  });

  it(TestCategory.utilTest + ': ks2-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'ks2-PTV4.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);
    const map = new Map()
      .set('EncryptionService', 'https://localhost:9106/soap-api/EncryptionService/6.1.1')
      // .set('SignatureService', 'https://localhost:9106/soap-api/SignatureService/7.4.2')
      .set('SignatureService', 'https://localhost:9106/soap-api/SignatureService/7.5.4')
      .set('AuthSignatureService', 'https://localhost:9106/soap-api/AuthSignatureService/7.4.1')
      .set('CardService', 'https://localhost:9106/soap-api/CardService/8.1.2')
      .set('EventService', 'https://localhost:9106/soap-api/EventService/7.2.0')
      .set('CertificateService', 'https://localhost:9106/soap-api/CertificateService/6.0.1')
      .set('CardTerminalService', 'https://localhost:9106/soap-api/CardTerminalService/1.1.0');
    expect(mapServiceEndpointTls).toEqual(map);
  });

  it(TestCategory.utilTest + ': secunet-PTV4', async () => {
    const sdsSecunet = readResourceFile('connSds', 'secunet-PTV4.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);

    const map = new Map()
      .set('EncryptionService', 'https://10.11.217.160:443/ws/EncryptionService')
      .set('SignatureService', 'https://10.11.217.160:443/ws/SignatureService')
      .set('AuthSignatureService', 'https://10.11.217.160:443/ws/AuthSignatureService')
      .set('CardService', 'https://10.11.217.160:443/ws/CardService')
      .set('EventService', 'https://10.11.217.160:443/ws/EventService')
      .set('CertificateService', 'https://10.11.217.160:443/ws/CertificateService')
      .set('CardTerminalService', 'https://10.11.217.160:443/ws/CardTerminalService')
      .set('AMTSService', 'https://10.11.217.160:443/ws/AMTSService')
      .set('PHRService', 'https://10.11.217.160:443/ws/PHRService')
      .set('PHRManagementService', 'https://10.11.217.160:443/ws/PHRManagementService')
      .set('DPEService', 'https://10.11.217.160:443/ws/DPEService')
      .set('NFDService', 'https://10.11.217.160:443/ws/NFDService')
      .set('VSDService', 'https://10.11.217.160:443/ws/VSDService')
      .set('KVKService', 'https://10.11.217.160:443/ws/KVKService');
    expect(mapServiceEndpointTls).toEqual(map);
  });
  it(TestCategory.utilTest + ': secunet-PTV4-testOnly', async () => {
    const sdsSecunet = readResourceFile('connSds', 'secunet-PTV4-testOnly.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);

    const map = new Map()
      .set('EncryptionService', 'https://10.11.217.160:443/ws/EncryptionService')
      //https://10.11.217.160:443/ws/SignatureService
      .set('SignatureService', 'https://10.11.217.160:443/ws/SignatureService/7.4.2')
      .set('AuthSignatureService', 'https://10.11.217.160:443/ws/AuthSignatureService')
      //.set('CardService', 'https://10.11.217.160:443/ws/CardService')
      .set('CardService', 'https://10.11.217.160:443/ws/CardService/812')
      .set('EventService', 'https://10.11.217.160:443/ws/EventService')
      .set('CertificateService', 'https://10.11.217.160:443/ws/CertificateService')
      .set('CardTerminalService', 'https://10.11.217.160:443/ws/CardTerminalService')
      .set('AMTSService', 'https://10.11.217.160:443/ws/AMTSService')
      .set('PHRService', 'https://10.11.217.160:443/ws/PHRService')
      .set('PHRManagementService', 'https://10.11.217.160:443/ws/PHRManagementService')
      .set('DPEService', 'https://10.11.217.160:443/ws/DPEService')
      .set('NFDService', 'https://10.11.217.160:443/ws/NFDService')
      .set('VSDService', 'https://10.11.217.160:443/ws/VSDService')
      .set('KVKService', 'https://10.11.217.160:443/ws/KVKService');
    expect(mapServiceEndpointTls).toEqual(map);
  });
  it(TestCategory.utilTest + ': rise-PTV3', async () => {
    const sdsSecunet = readResourceFile('connSds', 'rise-PTV3.xml');
    const mapServiceEndpointTls = determineMapServiceEndpointTls(sdsSecunet);
    const map = new Map()
      .set('EncryptionService', 'https://10.11.236.249:443/webservices/encryptionservice')
      .set('SignatureService', 'https://10.11.236.249:443/webservices/signatureservice')
      .set('AuthSignatureService', 'https://10.11.236.249:443/webservices/authsignatureservice')
      .set('CardService', 'https://10.11.236.249:443/webservices/cardservice')
      .set('EventService', 'https://10.11.236.249:443/webservices/eventservice')
      .set('CertificateService', 'https://10.11.236.249:443/webservices/certificateservice')
      .set('CardTerminalService', 'https://10.11.236.249:443/webservices/cardterminalservice')
      .set('AMTSService', 'https://10.11.236.249:443/fm/amtsservice')
      .set('DPEService', 'https://10.11.236.249:443/fm/dpeservice')
      .set('NFDService', 'https://10.11.236.249:443/fm/nfdservice')
      .set('VSDService', 'https://10.11.236.249:443/fm/vsdservice')
      .set('KVKService', 'https://10.11.236.249:443/fm/kvkservice');
    expect(mapServiceEndpointTls).toEqual(map);
  });
});

function handleSds(sds: string) {
  return sdsParser(sds);
}
