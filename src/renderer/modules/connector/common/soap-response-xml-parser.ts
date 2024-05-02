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

const sax = require('sax');
import { TTag } from '../type-definitions';

/**
 * This parser is suitable for extracting value from xml text tag
 * @param xmlStr
 * @param tagSoapResp
 */
export default function parse(xmlStr: string, tagSoapResp: string): string {
  const parser = sax.parser(true);
  let textFound = '';
  let entry: TTag | null = null;
  let currentTag: any = null;
  let result;

  parser.onclosetag = function (tagName: string) {
    if (tagName.indexOf(tagSoapResp) > -1) {
      currentTag = entry = null;
      return;
    }
  };

  parser.onopentag = function (tag: TTag) {
    if (tag.name.indexOf(tagSoapResp) < 0 && !entry) {
      return;
    }
    if (tag.name === tagSoapResp || tag.name.includes(':' + tagSoapResp)) {
      entry = tag;
    }
    tag.parent = currentTag;
    tag.children = [];
    tag.parent && tag.parent.children.push(tag);
    currentTag = tag;
  };

  parser.ontext = function (text: string) {
    if (currentTag) {
      result = text;
      if (currentTag.name === tagSoapResp || currentTag.name.includes(':' + tagSoapResp)) {
        textFound = result;
      }
    }
  };

  parser.write(xmlStr).end();
  return textFound;
}
