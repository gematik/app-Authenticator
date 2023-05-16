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

const webpack = require('webpack');
const { resolve } = require('path');
const path = require('path');

const IS_DEV = process.env.NODE_ENV === 'development';

module.exports = {
  mode: IS_DEV ? 'development' : 'production',
  target: 'electron-main',
  entry: {
    main: resolve(__dirname, 'src/main/main.ts'),
    preload: resolve(__dirname, 'src/main/preload.ts'),
  },
  watchOptions: {
    ignored: '**/node_modules',
  },
  node: { global: true },
  output: {
    path: resolve(__dirname, 'dist_electron'),
    filename: '[name].js',
    clean: false,
  },
  devtool: 'cheap-module-source-map',
  resolve: {
    modules: [resolve(process.cwd(), 'src'), 'node_modules'],
    extensions: ['.ts', '.js'],
    symlinks: false,
    cacheWithContext: false,
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'ES2020',
        },
      },
      {
        test: /\.[ts|vue]/,
        loader: 'preprocess-loader',
        exclude:
          process.env.MOCK_MODE === 'ENABLED'
            ? []
            : [path.resolve(__dirname, './src/modules/connector/connector-mock/')],
        options: { DEBUG: false, ppOptions: { type: 'vue' } },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      window: false,
    }),
  ],
};
