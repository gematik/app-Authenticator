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
