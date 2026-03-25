/*
 * Copyright 2026, gematik GmbH
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
const sax = require('sax');
import { TTag } from '../type-definitions';

export interface IVerifyCertificateResponse {
  status: string;
  verificationResult: string;
  roleList: string[];
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Parses the VerifyCertificate SOAP response
 * @param xmlStr - The SOAP response XML string
 * @returns {IVerifyCertificateResponse} - Parsed response object
 */
export function parseVerifyCertificateResponse(xmlStr: string): IVerifyCertificateResponse {
  const parser = sax.parser(true);
  let currentTag: TTag | null = null;
  const response: IVerifyCertificateResponse = {
    status: '',
    verificationResult: '',
    roleList: [],
  };

  parser.onopentag = function (tag: TTag) {
    currentTag = tag;
  };

  parser.ontext = function (text: string) {
    if (!currentTag) return;

    const tagName = currentTag.name;

    // Parse status result
    if (tagName.includes(':Result') || tagName === 'Result') {
      response.status = text;
    }
    // Parse verification result
    else if (tagName.includes(':VerificationResult') || tagName === 'VerificationResult') {
      response.verificationResult = text;
    }
    // Parse role list items
    else if (tagName.includes(':Role') || tagName === 'Role') {
      response.roleList.push(text);
    }
    // Parse error code
    else if (tagName.includes(':Code') || tagName === 'Code') {
      if (!response.error) response.error = { code: '', message: '' };
      response.error.code = text;
    }
    // Parse error message
    else if (tagName.includes(':ErrorText') || tagName === 'ErrorText') {
      if (!response.error) response.error = { code: '', message: '' };
      response.error.message = text;
    }
  };

  parser.write(xmlStr).end();
  return response;
}
