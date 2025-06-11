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

const { parse, stringify } = require('yaml');
const fs = require('fs');
const crypto = require('crypto');

// args[0] is the path to the exe
const args = process.argv.slice(2);
const EXE_PATH = args[0];
const LATEST_YML_PATH = args[1];

console.info('update-latest-yml-hash.js EXE_PATH', EXE_PATH); // eslint-disable-line no-console
console.info('update-latest-yml-hash.js LATEST_YML_PATH', LATEST_YML_PATH); // eslint-disable-line no-console

function hashFile(file, algorithm = 'sha512', encoding = 'base64', options) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    hash.on('error', reject).setEncoding(encoding);
    fs.createReadStream(
      file,
      Object.assign({}, options, {
        highWaterMark: 1024 * 1024,
        /* better to use more memory but hash faster */
      }),
    )
      .on('error', reject)
      .on('end', () => {
        hash.end();
        resolve(hash.read());
      })
      .pipe(hash, {
        end: false,
      });
  });
}

/** a function to read yaml file and return the parsed object
 *
 * @param filePath
 * @returns {any}
 */
function readYamlFile(filePath) {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return parse(fileContents);
}

// save the yaml file
function saveYamlFile(filePath, data) {
  const yamlStr = stringify(data);
  fs.writeFileSync(filePath, yamlStr);
}

(async () => {
  const latestYml = readYamlFile(LATEST_YML_PATH);

  // get the hash of the exe
  const exeHash = await hashFile(EXE_PATH);

  // update the hash in the yaml
  latestYml.sha512 = exeHash;
  latestYml.files[0].sha512 = exeHash;

  // save the yaml
  saveYamlFile(LATEST_YML_PATH, latestYml);
})();
