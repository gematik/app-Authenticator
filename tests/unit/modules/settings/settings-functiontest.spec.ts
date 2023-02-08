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

import dot from 'dot-object';

import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import * as pathProvider from '@/renderer/service/path-provider';
import { getHomedir } from '@/renderer/modules/connector/common/utils';
import { SAMPLE_CONFIG_DATA } from '../../../utils/config-sample-data';
import { CONTEXT_PARAMETERS_CONFIG_GROUP, ENTRY_OPTIONS_CONFIG_GROUP, TLS_AUTH_TYPE_CONFIG } from '@/config';
import { getConfig } from '@/renderer/utils/get-configs';

describe('settings function test', () => {
  pathProvider.PathProvider.setSystemUserTempPath(getHomedir());

  it('test FileStorageRepository', async () => {
    const fsr = new FileStorageRepository();

    fsr.clear();
    expect(fsr.exist()).toBeFalsy();

    fsr.save(SAMPLE_CONFIG_DATA);
    expect(fsr.exist()).toBeTruthy();

    expect(fsr.load()).toStrictEqual(dot.dot(SAMPLE_CONFIG_DATA));

    // clear it after tests
    fsr.clear();
  });

  it('settings.vue saveConfigValues', async () => {
    const fsr = new FileStorageRepository();
    fsr.save(SAMPLE_CONFIG_DATA);

    expect(fsr.load()).toStrictEqual(SAMPLE_CONFIG_DATA);

    fsr.clear();
    fsr.save(SAMPLE_CONFIG_DATA);

    expect(getConfig(CONTEXT_PARAMETERS_CONFIG_GROUP.MANDANT_ID).value).toBe('Mandant-y');
    expect(getConfig(ENTRY_OPTIONS_CONFIG_GROUP.HOSTNAME).value).toBe('127.1.1.1');
    expect(getConfig(TLS_AUTH_TYPE_CONFIG).value).toBe('ServerCertAuth');
  });
});
