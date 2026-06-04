/*
 * Copyright 2026, gematik GmbH
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

import { readResourceFile } from '@tests/TestInfo';
import {
  clearSdsCache,
  getEndpoint,
  getProductTypeVersion,
  getPtvVersion,
  getServiceEndpointTls,
} from '@/renderer/modules/connector/connector_impl/sds-request';
import { ERROR_CODES } from '@/error-codes';
import { PtvVersion } from '@/renderer/modules/connector/ptv';

describe('sds-request', () => {
  let httpGetSpy: jest.SpyInstance;

  beforeEach(() => {
    clearSdsCache();
  });

  afterEach(() => {
    httpGetSpy?.mockRestore();
    clearSdsCache();
  });

  function mockHttpGet(sds: string) {
    httpGetSpy = jest.spyOn(window.api, 'httpGet').mockResolvedValue({ data: sds } as never);
  }

  it('throws AUTHCL_1000 with the service name when not present in the SDS', async () => {
    mockHttpGet(readResourceFile('connSds', 'secunet-PTV4.xml'));
    await expect(getServiceEndpointTls('NoSuchService')).rejects.toMatchObject({
      code: ERROR_CODES.AUTHCL_1000,
      message: expect.stringContaining('NoSuchService'),
    });
  });

  it('getEndpoint throws directly when no service has been parsed', () => {
    expect(() => getEndpoint('AnyService')).toThrow(/No usable TLS endpoint/);
  });

  it('caches SDS even when ProductTypeVersion is absent — no refetch loop', async () => {
    const sdsWithoutPtv = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.1" Version="8.1.2">
          <si:EndpointTLS Location="https://example/CardService"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;
    mockHttpGet(sdsWithoutPtv);

    expect(await getServiceEndpointTls('CardService')).toBe('https://example/CardService');
    expect(await getServiceEndpointTls('CardService')).toBe('https://example/CardService');
    expect(httpGetSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches after clearSdsCache', async () => {
    mockHttpGet(readResourceFile('connSds', 'secunet-PTV4.xml'));

    await getServiceEndpointTls('CardService');
    clearSdsCache();
    await getServiceEndpointTls('CardService');

    expect(httpGetSpy).toHaveBeenCalledTimes(2);
  });

  it('refetches automatically when the previous response parsed to zero services (self-heal)', async () => {
    // Pre-fix regression: sdsLoaded was set to true even for an empty/garbled response, locking the cache.
    httpGetSpy = jest
      .spyOn(window.api, 'httpGet')
      .mockResolvedValueOnce({ data: '<not-an-sds/>' } as never)
      .mockResolvedValueOnce({ data: readResourceFile('connSds', 'secunet-PTV4.xml') } as never);

    await expect(getServiceEndpointTls('CardService')).rejects.toMatchObject({ code: ERROR_CODES.AUTHCL_1000 });
    // Second call must re-hit HTTP because the cache wasn't filled.
    await getServiceEndpointTls('CardService');
    expect(httpGetSpy).toHaveBeenCalledTimes(2);
  });

  it('preserves the original error inside the UserfacingError data slot', async () => {
    const networkError = new Error('ETIMEDOUT');
    httpGetSpy = jest.spyOn(window.api, 'httpGet').mockRejectedValue(networkError);

    await expect(getServiceEndpointTls('CardService')).rejects.toMatchObject({
      code: ERROR_CODES.AUTHCL_1000,
      data: networkError,
    });
  });

  describe('with the example-PTV6 fixture loaded', () => {
    beforeEach(() => {
      mockHttpGet(readResourceFile('connSds', 'example-PTV6.xml'));
    });

    it('extracts ProductTypeVersion 6.0.0 from the nested <ProductTypeInformation> block', async () => {
      await getServiceEndpointTls('CardService');
      expect(getProductTypeVersion()).toBe('6.0.0');
    });

    it('maps ProductTypeVersion 6.0.0 to PtvVersion.PTV6', async () => {
      await getServiceEndpointTls('CardService');
      expect(getPtvVersion()).toBe(PtvVersion.PTV6);
    });

    it.each([
      ['AuthSignatureService', 'https://konnektor.example/kon00/service/authsignatureservice'],
      ['CardService', 'https://konnektor.example/kon00/service/cardservice'],
      ['CertificateService', 'https://konnektor.example/kon00/service/certificateservice'],
      ['EventService', 'https://konnektor.example/kon00/service/systeminformationservice'],
    ])('picks the capped endpoint for %s', async (service, expectedUrl) => {
      expect(await getServiceEndpointTls(service)).toBe(expectedUrl);
    });

    it('SignatureService is uncapped and picks 7.5.7 (highest in the SDS)', async () => {
      // SignatureService has no entry in WSDL_VERSION_CAPS — it falls through to unbounded selection.
      // Change this expectation when the signature feature gets wired and pins a version.
      expect(await getServiceEndpointTls('SignatureService')).toBe(
        'https://konnektor.example/kon00/service/v75/signservice',
      );
    });

    it('caches across services — one HTTP call serves all four capped endpoints', async () => {
      await getServiceEndpointTls('AuthSignatureService');
      await getServiceEndpointTls('CardService');
      await getServiceEndpointTls('CertificateService');
      await getServiceEndpointTls('EventService');
      expect(httpGetSpy).toHaveBeenCalledTimes(1);
    });

    it('clearSdsCache resets ProductTypeVersion and forces a refetch', async () => {
      await getServiceEndpointTls('CardService');
      expect(getProductTypeVersion()).toBe('6.0.0');
      expect(getPtvVersion()).toBe(PtvVersion.PTV6);

      clearSdsCache();
      expect(getProductTypeVersion()).toBe('');
      expect(getPtvVersion()).toBe(PtvVersion.UNKNOWN);

      await getServiceEndpointTls('CardService');
      expect(httpGetSpy).toHaveBeenCalledTimes(2);
    });
  });
});
