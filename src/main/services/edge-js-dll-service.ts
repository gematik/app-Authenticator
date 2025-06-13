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
 *
 * *******

For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

import { IS_DEV } from '@/constants';
import path from 'path';

const typeName = 'WinCertStoreLib.Methods';

export function callEdgeMethod(methodName: string) {
  const edge = require('electron-edge-js');
  let assemblyFile: string = 'resources/WinCertStoreLib.dll';
  // #!if MOCK_MODE === 'ENABLED'
  if (IS_DEV) {
    assemblyFile = path.join(__dirname, 'WinCertStoreLib.dll');
  }
  // #!endif
  return edge.func({
    assemblyFile,
    typeName: typeName,
    methodName: methodName,
  });
}
