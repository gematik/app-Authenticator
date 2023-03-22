/*
 * Copyright 2023 gematik GmbH
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

process.env.VUE_APP_VERSION = process.env.npm_package_version;
if (process.env.BUILD_NUMBER) process.env.VUE_APP_BUILD_NUMBER = process.env.BUILD_NUMBER;
if (process.env.BRANCH_NAME) process.env.VUE_APP_BRANCH_NAME = process.env.BRANCH_NAME;
if (process.env.TAG_NAME) process.env.VUE_APP_TAG_NAME = process.env.TAG_NAME;

const builderConfig = require('./builder.config.js');

module.exports = {
  configureWebpack: {
    devtool: 'source-map',
  },
  chainWebpack: (config) => {
    config.module
      .rule('xml')
      .test(/\.xml$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();

    config.module
      .rule('raw')
      .test(/\.txt$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();

    config.module
      .rule('preprocess-loader')
      .test(/\.[ts|vue]/)
      .use('preprocess-loader')
      .loader('preprocess-loader')
      .options({ DEBUG: false, ppOptions: { type: 'vue' } })
      .end();
  },
  pluginOptions: {
    electronBuilder: builderConfig,
  },
};
