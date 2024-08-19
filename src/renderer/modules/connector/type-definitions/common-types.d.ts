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

import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

export type TAuthSignParameter = {
  signatureType: string;
  // @deprecated
  signatureCidpSchemes: string;
  base64data: string;
};

export type TContextParameter = {
  mandantId: string;
  clientId: string;
  workplaceId: string;
  userId: string;
};

export type TGetCardsParameter = {
  cardType: ECardTypes;
  pinType: string;
};

export type TTag = {
  name: string;
  parent?: { children: TTag[] } | null;
  children: TTag[];
  attributes: { Location: string; Name: string; Version: string };
};

export type TEntryOptions = {
  hostname: string;
  port: number;
  path: string;
  method: string;
  rejectUnauthorized?: boolean;
  secureProtocol?: string;
  keyFile?: string;
  certFile?: string;
  pfxFile?: string;
  pfxPassword?: string;
  username?: string;
  password?: string;
  protocol?: string;
  remoteKT?: string;
  localKT?: string;
};

export type TCertReaderParameter = {
  certificateRef: string;
  crypt: string;
};

export type TConfigObject = Record<string, string>;

export type TCardData = {
  cardType: ECardTypes;
  ctId: string;
  slotNr: string;
  cardHandle: string;
  pinStatus: string;
  certificate: string;
  iccsn: string;
};

export type TCardTerminal = {
  Connected: string;
  CtId: string;
  IPAddress: { IPV4Address: string };
  IS_PHYSICAL: string;
  MacAddress: string;
  Name: string;
  ProductInformation: {
    InformationDate: string;
    ProductTypeInformation: Record<string, any>;
    ProductIdentification: Record<string, any>;
    ProductMiscellaneous: Record<string, any>;
  };
  Slots: string;
  WorkplaceIds: { WorkplaceId: string };
  [key: string]: any;
};

export type TPinStatusTypes = 'VERIFIED' | 'VERIFIABLE' | 'BLOCKED' | 'REJECTED' | 'TRANSPORT_PIN';

export type TPinStatusResponse = {
  statusResult: string;
  pinStatus: IPinStatusTypes;
};

export type TConnectorStore = {
  cards: {
    HBA?: TCardData;
    'SMC-B'?: TCardData;
  };
  terminals?: TCardTerminal;
};
