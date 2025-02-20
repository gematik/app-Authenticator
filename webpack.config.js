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
 */

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackShellPlugin = require('webpack-shell-plugin-next');
const { VueLoaderPlugin } = require('vue-loader');
const { resolve } = require('path');
const appConfigFactory = require('./app-config');
const fs = require('fs');
const appConfig = appConfigFactory();

const IS_DEV = process.env.NODE_ENV === 'development';

// set VERSION to show in the app
process.env.VERSION = process.env.npm_package_version;

/**
 * Set MOCK_MODE value
 * If it is defined take the defined value, if isn't defined set by IS_DEV var
 * @type {string}
 */
process.env.MOCK_MODE = process.env.MOCK_MODE || IS_DEV ? 'ENABLED' : 'DISABLED';

let shellPluginConfig = {
  safe: true,
  // bundle main.ts
  onBuildStart: {
    scripts: [
      'rimraf -rf ./dist_electron',
      'rimraf -rf ./release',
      'set NODE_ENV=' + process.env.NODE_ENV,
      'mkdir dist_electron',
      'webpack --config webpack-main.config.js',
    ],
    blocking: true,
    parallel: false,
  },
};

if (IS_DEV) {
  shellPluginConfig = {
    ...shellPluginConfig,
    // start electron after webpack finishes
    onBuildEnd: {
      scripts: [
        'set NODE_ENV=development',
        'electron .',
        'webpack --config webpack-main.config.js  --watch', // watch preload&main changes in DEV mode
      ],
      blocking: false,
      parallel: true,
    },
  };
}

module.exports = {
  mode: IS_DEV ? 'development' : 'production',
  target: ['web'],
  entry: {
    renderer: resolve(__dirname, 'src/renderer/renderer.ts'),
  },
  output: {
    path: resolve(__dirname, 'dist_electron'),
    filename: '[name].js',
    clean: false,
    assetModuleFilename: '[name][ext]',
  },
  devtool: 'cheap-module-source-map',
  devServer: {
    static: {
      directory: resolve(__dirname, 'dist_electron'),
    },
    port: 3000,
    open: false,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  resolve: {
    modules: [resolve(process.cwd(), 'src'), 'node_modules'],
    extensions: ['.ts', '.js', '.vue'],
    symlinks: false,
    cacheWithContext: false,
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    fallback: {
      fs: false,
      path: false,
      stream: require.resolve('stream-browserify'),
      timers: false,
      os: false,
      util: require.resolve('util'),
      url: false,
      https: false,
      http: false,
      buffer: require.resolve('buffer/'),
      crypto: require.resolve('crypto-browserify'),
      vm: require.resolve('vm-browserify'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(json5?|ya?ml)$/, // target json, json5, yaml and yml files
        type: 'javascript/auto',
        loader: '@intlify/vue-i18n-loader',
        include: resolve(__dirname, 'src/renderer/i18n/translations'),
      },
      {
        test: /\.(scss|css)$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['postcss-preset-env']],
              },
            },
          },
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.ts?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'ts',
          target: 'ES2020',
        },
      },
      {
        test: /\.(png|ico|svg|jpg|jpeg|gif|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(xml|pem|crt|cer|txt)$/i,
        type: 'asset/source',
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
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      title: appConfig.title,
      filename: 'index.html',
      template: 'src/renderer/template.html',
    }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: JSON.stringify(true),
      __VUE_PROD_DEVTOOLS__: JSON.stringify(true),
    }),
    new WebpackShellPlugin(shellPluginConfig),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
};

/**
 * Put custom environment variables in to .env file
 * Electron can not define and write env variables in the exe file.
 * That's why we save them here manually in the .env file and read them in the main.ts
 */
const CUSTOM_ENVIRONMENT_VARIABLES = [
  'NODE_ENV',
  'BRANCH_NAME',
  'TAG_NAME',
  'BUILD_NUMBER',
  'VERSION',
  'MOCK_MODE',
  'CONNECTOR_NAME',
];

// start creating .env file after dist_electron created
setTimeout(() => {
  const filePath = './dist_electron/.env';
  CUSTOM_ENVIRONMENT_VARIABLES.forEach((variableName) => {
    fs.appendFile(filePath, variableName + '=' + process.env[variableName] + '\n', function (err) {
      if (err) throw err;
    });
  });
}, 1000);
