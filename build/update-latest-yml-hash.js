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
