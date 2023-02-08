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
