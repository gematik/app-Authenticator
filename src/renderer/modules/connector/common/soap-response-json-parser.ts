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

import { UserfacingError } from '@/renderer/errors/errors';
import { logger } from '@/renderer/service/logger';
import { ERROR_CODES } from '@/error-codes';

const { Parser, processors } = require('xml2js');
const parser = new Parser({
  explicitArray: false,
  trim: true,
  tagNameProcessors: [processors.stripPrefix],
});

export async function findSpecificElementInResponseProperties(
  xml: string,
  tagName: string,
): Promise<{ [name: string]: any } | null> {
  return new Promise((resolve, reject) => {
    let result;
    parser.parseString(xml, (err: Error, res: Array<unknown>) => {
      if (err) {
        const error = new UserfacingError('XML Response parsing error', err.message, ERROR_CODES.AUTHCL_1110);
        reject(error);
      }
      result = getTagNameValue(res, tagName);
      if (Array.isArray(result) && result.length > 1) {
        result = result[1];
      } else {
        logger.warn(`Cannot find ${tagName} in SOAP response.`);
      }
      resolve(result);
    });
  });
}

const getTagNameValue = (soapJsonResponse: Array<any>, prop: string): Array<any> | null => {
  for (const key in soapJsonResponse) {
    const value = soapJsonResponse[key];
    if (prop == key) {
      return [prop, value];
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; ++i) {
        const x = getTagNameValue(value[i], prop);
        if (x && x[0] == prop) return x;
      }
    } else if (typeof value === 'object') {
      const y = getTagNameValue(value, prop);
      if (y && y[0] == prop) return y;
    }
  }
  return null;
};
