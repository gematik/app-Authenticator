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
