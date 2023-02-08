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

const webpack = require('webpack');
const { resolve } = require('path');

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
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      window: false,
    }),
  ],
};
