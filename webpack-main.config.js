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
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

const webpack = require('webpack');
const { resolve } = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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
  node: {
    global: true,
    __dirname: false,
    __filename: false,
  },
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
  externals: {
    keytar: 'commonjs keytar',
    'electron-edge-js': 'commonjs2 electron-edge-js',
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
        test: /\.node$/,
        use: 'node-loader',
      },
      {
        test: /\.[ts|vue]/,
        loader: 'webpack-preprocessor-loader',
        options: {
          debug: process.env.MOCK_MODE === 'ENABLED',
          directives: {
            // if you add "// #!no_prod" to the above of the line, it will be removed in the production build
            no_prod: false,
          },
          params: {
            MOCK_MODE: process.env.MOCK_MODE,
          },
          verbose: false,
        },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      window: false,
    }),
    new CopyPlugin({
      patterns: [{ from: 'winCertStoreLib/WinCertStoreLib.dll', to: '' }],
    }),
  ],
};
