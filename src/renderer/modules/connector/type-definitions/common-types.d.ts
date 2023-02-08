/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
 */

import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';

export type TAuthSignParameter = {
  signatureType: string;
  signatureKeycloackSchemes: string;
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
  parent: { children: TTag[] };
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

export type TConfigObject = {
  [key: string]: string | number | boolean;
};

export type TCardData = {
  cardType: ECardTypes;
  ctId: string;
  slotNr: string;
  cardHandle: string;
  pinStatus: string;
  certificate: string;
  iccsn: string;
};

export type TPinStatusTypes = 'VERIFIED' | 'VERIFIABLE' | 'BLOCKED' | 'REJECTED';

export type TPinStatusResponse = {
  statusResult: string;
  pinStatus: IPinStatusTypes;
};

export type TConnectorStore = {
  cards: {
    HBA?: TCardData;
    'SMC-B'?: TCardData;
  };
  flowType?: string;
  terminals?: any;
};
