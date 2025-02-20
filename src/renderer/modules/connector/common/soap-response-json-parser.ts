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

import { UserfacingError } from '@/renderer/errors/errors';
import { logger } from '@/renderer/service/logger';
import { ERROR_CODES } from '@/error-codes';

const { Parser, processors } = require('xml2js');
const parser = new Parser({
  explicitArray: false,
  trim: true,
  tagNameProcessors: [processors.stripPrefix],
});

interface SoapEnvelope {
  Envelope: {
    Header?: any;
    Body: SoapBody;
  };
}

interface SoapBody {
  [key: string]: any;
}

type SoapResponse = SoapEnvelope;

export async function findSpecificElementInResponseProperties<T>(xml: string, tagName: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    parser.parseString(xml, (err: Error, res: SoapResponse) => {
      if (err) {
        const error = new UserfacingError('XML Response parsing error', err.message, ERROR_CODES.AUTHCL_1110);
        reject(error);
        return;
      }
      let result: unknown = getTagNameValue(res.Envelope.Body, tagName);

      if (Array.isArray(result) && result.length > 1) {
        result = result[1];
      } else {
        logger.warn(`Cannot find ${tagName} in SOAP response.`);
      }
      resolve(result as T | null);
    });
  });
}

const getTagNameValue = (soapJsonResponse: SoapBody, prop: string): [string, unknown] | null => {
  for (const key in soapJsonResponse) {
    const value = soapJsonResponse[key];
    if (prop === key) {
      return [prop, value];
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; ++i) {
        const x = getTagNameValue(value[i], prop);
        if (x && x[0] === prop) return x;
      }
    } else if (typeof value === 'object' && value !== null) {
      const y = getTagNameValue(value, prop);
      if (y && y[0] === prop) return y;
    }
  }
  return null;
};
