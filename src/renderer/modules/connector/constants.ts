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

/**
 * Standard Cart Types
 */

/**
 * Standard Cart Pin Types
 */
export const CARD_PIN_TYPES = {
  HBA_PIN_CH: 'PIN.CH',
  SMCB_PIN_SM: 'PIN.SMC',
};

export const XML_ERROR_TAG_NAMES = {
  TAG_ERROR_SEVERITY: 'Severity',
  TAG_ERROR_CODE: 'Code',
  TAG_ERROR_TYPE: 'ErrorType',
  TAG_ERROR_MESSAGE: 'ErrorText',
  TAG_ERROR_FAULT: 'Fault',
  TAG_ERROR_FAULT_STRING: 'faultstring',
  TAG_STATUS_ERROR: 'Error',
};

export const XML_TAG_NAMES = {
  //services
  TAG_AUTH_SIGNATURE_SERVICE: 'AuthSignatureService',
  TAG_CERTIFICATE_SERVICE: 'CertificateService',
  TAG_EVENT_SERVICE: 'EventService',
  TAG_CARD_SERVICE: 'CardService',
  //soap
  TAG_X509_CERTIFICATE: 'X509Certificate',
  TAG_BASE64SIGNATURE: 'Base64Signature',
  TAG_CARD_HANDLE: 'CardHandle',
  TAG_CARD_TERMINAL_ID: 'CtId',
  TAG_CARD_WORK_PLACE_ID: 'WorkplaceId',
  TAG_CARD_TERMINAL_WORKPLACES: 'WorkplaceIds',
  TAG_CARD_TERMINAL_NAME: 'Name',
  TAG_CARD_TERMINAL: 'CardTerminal',
  TAG_ITEM_CARD: 'Card',
  TAG_CARD_ICCSN: 'Iccsn',
  TAG_CARD_SLOT: 'SlotId',
  TAG_ENDPOINT_TLS: 'EndpointTLS',
  TAG_PINSTATUS: 'PinStatus',
  TAG_VERIFY_RESULT: 'Result',
  TAG_GETCARD_STATUS_RESULT: 'Result',
  // TAG_USERAGENT: 'node-soap/0.40.0',
  TAG_PRODUCT_TYPE_VERSION: 'ProductTypeVersion',
};

export const SOAP_ACTION_CONTENT_TYPE = 'text/xml;charset=UTF-8';

export const SOAP_ACTION = {
  ExternalAuthenticate: 'http://ws.gematik.de/conn/SignatureService/v7.4#ExternalAuthenticate',
  VerifyPin: 'http://ws.gematik.de/conn/CardService/v8.1#VerifyPin',
  GetPinStatus: 'http://ws.gematik.de/conn/CardService/v8.1#GetPinStatus',
  ReadCardCertificate: 'http://ws.gematik.de/conn/CertificateService/v6.0#ReadCardCertificate',
  GetCards: 'http://ws.gematik.de/conn/EventService/v7.2#GetCards',
  GetCardTerminals: 'http://ws.gematik.de/conn/EventService/v7.2#GetCardTerminals',
};
