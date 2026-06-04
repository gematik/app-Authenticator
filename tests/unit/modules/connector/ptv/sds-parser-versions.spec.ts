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
import sdsParser, {
  flattenToEndpointMap,
  pickHighestSupportedVersion,
} from '@/renderer/modules/connector/common/sds-parser';
import { WSDL_VERSION_CAPS } from '@/renderer/modules/connector/constants';

describe('sds-parser version inventory', () => {
  it('keeps every <Version> entry with TargetNamespace and EndpointTLS for ks2-PTV4', () => {
    const sds = readResourceFile('connSds', 'ks2-PTV4.xml');
    const services = sdsParser(sds);

    const sig = services.get('SignatureService');
    expect(sig).toBeDefined();
    expect(sig!.versions.length).toBe(3);
    expect(sig!.versions.map((v) => v.version).sort()).toEqual(['7.4.0', '7.4.2', '7.5.4']);

    const v75 = sig!.versions.find((v) => v.version === '7.5.4')!;
    expect(v75.targetNamespace).toBe('http://ws.gematik.de/conn/SignatureService/WSDL/v7.5');
    expect(v75.endpointTls).toBe('https://localhost:9106/soap-api/SignatureService/7.5.4');
  });

  it('picks the highest semver, not the lexically highest', () => {
    const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="SignatureService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/SignatureService/WSDL/v7.10" Version="7.10.0">
          <si:EndpointTLS Location="https://example/SignatureService/7.10.0"/>
        </si:Version>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/SignatureService/WSDL/v7.9" Version="7.9.5">
          <si:EndpointTLS Location="https://example/SignatureService/7.9.5"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;

    const chosen = pickHighestSupportedVersion(sdsParser(inlineSds).get('SignatureService'));
    expect(chosen?.version).toBe('7.10.0');
    expect(chosen?.endpointTls).toBe('https://example/SignatureService/7.10.0');
  });

  it('does not confuse <ServiceInformation> wrapper with a <Service> entry', () => {
    const services = sdsParser(readResourceFile('connSds', 'koco-PTV4.xml'));
    expect(services.has('ServiceInformation')).toBe(false);
    expect(services.has('SignatureService')).toBe(true);
  });

  it('skips CardService 8.2.x when cap is 8.1', () => {
    const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.2" Version="8.2.0">
          <si:EndpointTLS Location="https://konn/webservices/cardservice/v8.2"/>
        </si:Version>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.1" Version="8.1.2">
          <si:EndpointTLS Location="https://konn/webservices/cardservice"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;

    const chosen = pickHighestSupportedVersion(sdsParser(inlineSds).get('CardService'), '8.1');
    expect(chosen?.version).toBe('8.1.2');
    expect(chosen?.endpointTls).toBe('https://konn/webservices/cardservice');
  });

  it('falls back to the highest available when nothing fits the cap', () => {
    // Graceful degradation: keeps the downstream SOAP call from silently routing to undefined.
    const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v9.0" Version="9.0.0">
          <si:EndpointTLS Location="https://konn/cardservice/v9.0"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;

    const chosen = pickHighestSupportedVersion(sdsParser(inlineSds).get('CardService'), '8.1');
    expect(chosen?.version).toBe('9.0.0');
  });

  it('without a cap, picks the unbounded highest', () => {
    const sds = readResourceFile('connSds', 'ks2-PTV4.xml');
    const services = sdsParser(sds);
    expect(pickHighestSupportedVersion(services.get('SignatureService'))?.version).toBe('7.5.4');
  });

  it('skips <Version> entries without an EndpointTLS', () => {
    const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.2" Version="8.2.1">
        </si:Version>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.1" Version="8.1.2">
          <si:EndpointTLS Location="https://example/CardService/8.1.2"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;

    const card = sdsParser(inlineSds).get('CardService');
    expect(card?.versions.length).toBe(1);
    expect(card?.versions[0].version).toBe('8.1.2');
  });

  it('returns an empty map for non-string or empty input (boundary guard)', () => {
    expect(sdsParser('').size).toBe(0);
    expect(sdsParser(undefined as unknown as string).size).toBe(0);
    expect(sdsParser(null as unknown as string).size).toBe(0);
  });

  describe('example-PTV6 (real-world fixture, sanitized)', () => {
    const ptv6 = () => readResourceFile('connSds', 'example-PTV6.xml');

    it('handles the ns3: namespace prefix used by real Konnektoren', () => {
      const services = sdsParser(ptv6());
      expect(services.has('CardService')).toBe(true);
      expect(services.has('SignatureService')).toBe(true);
      expect(services.has('CertificateService')).toBe(true);
      expect(services.has('AuthSignatureService')).toBe(true);
      expect(services.has('EventService')).toBe(true);
      expect(services.has('ServiceInformation')).toBe(false);
    });

    it('keeps the full SignatureService inventory across v7.4 and v7.5', () => {
      const sig = sdsParser(ptv6()).get('SignatureService');
      expect(sig!.versions.map((v) => v.version).sort()).toEqual([
        '7.4.0',
        '7.4.2',
        '7.4.3',
        '7.5.5',
        '7.5.6',
        '7.5.7',
      ]);
    });

    it('keeps both 6.0.x CertificateService entries sharing one TargetNamespace', () => {
      // Selection cannot rely on TargetNamespace alone — both entries share v6.0.
      const cert = sdsParser(ptv6()).get('CertificateService');
      expect(cert?.versions.map((v) => v.version).sort()).toEqual(['6.0.0', '6.0.1']);
      expect(new Set(cert?.versions.map((v) => v.targetNamespace)).size).toBe(1);
    });

    it('applies each WSDL_VERSION_CAPS entry', () => {
      const services = sdsParser(ptv6());
      const pick = (name: string) => pickHighestSupportedVersion(services.get(name), WSDL_VERSION_CAPS[name]);
      expect(pick('AuthSignatureService')?.version).toBe('7.4.1');
      expect(pick('CardService')?.version).toBe('8.1.2');
      expect(pick('CertificateService')?.version).toBe('6.0.1');
      expect(pick('EventService')?.version).toBe('7.2.0');
    });

    it('without a cap, SignatureService picks 7.5.7 (the highest semver in the SDS)', () => {
      expect(pickHighestSupportedVersion(sdsParser(ptv6()).get('SignatureService'))?.version).toBe('7.5.7');
    });

    it('flattenToEndpointMap returns one TLS endpoint per service', () => {
      const flat = flattenToEndpointMap(sdsParser(ptv6()));
      expect(flat.get('CardService')).toBe('https://konnektor.example/kon00/service/cardservice');
      expect(flat.get('CertificateService')).toBe('https://konnektor.example/kon00/service/certificateservice');
      // SignatureService v7.5 endpoint differs from v7.4 — flatten follows pickHighestSupportedVersion (highest semver).
      expect(flat.get('SignatureService')).toBe('https://konnektor.example/kon00/service/v75/signservice');
    });
  });

  describe('pickHighestSupportedVersion edge cases', () => {
    it('returns undefined for an unknown service', () => {
      const services = sdsParser(readResourceFile('connSds', 'example-PTV6.xml'));
      expect(pickHighestSupportedVersion(services.get('NoSuchService'), '1.0')).toBeUndefined();
    });

    it('returns undefined when every <Version> lacks an EndpointTLS', () => {
      const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.1" Version="8.1.0"/>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.1" Version="8.1.1"/>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;
      const services = sdsParser(inlineSds);
      expect(services.get('CardService')?.versions.length).toBe(0);
      expect(pickHighestSupportedVersion(services.get('CardService'), '8.1')).toBeUndefined();
    });

    it('rejects same-major-higher-minor (8.2.0 over cap 8.1) but accepts 8.0.x', () => {
      const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.0" Version="8.0.5">
          <si:EndpointTLS Location="https://example/CardService/8.0.5"/>
        </si:Version>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.2" Version="8.2.0">
          <si:EndpointTLS Location="https://example/CardService/8.2.0"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;
      expect(pickHighestSupportedVersion(sdsParser(inlineSds).get('CardService'), '8.1')?.version).toBe('8.0.5');
    });

    it('treats double-digit minors numerically (8.10 > 8.2)', () => {
      const inlineSds = `<?xml version="1.0" encoding="UTF-8"?>
<ConnectorServices xmlns:si="http://ws.gematik.de/conn/ServiceInformation/v2.0">
  <si:ServiceInformation>
    <si:Service Name="CardService">
      <si:Versions>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.2" Version="8.2.0">
          <si:EndpointTLS Location="https://example/CardService/8.2.0"/>
        </si:Version>
        <si:Version TargetNamespace="http://ws.gematik.de/conn/CardService/WSDL/v8.10" Version="8.10.0">
          <si:EndpointTLS Location="https://example/CardService/8.10.0"/>
        </si:Version>
      </si:Versions>
    </si:Service>
  </si:ServiceInformation>
</ConnectorServices>`;
      // Both exceed cap 8.1 → fallback to highest; highest must be 8.10 (numeric), not 8.2 (lexical).
      expect(pickHighestSupportedVersion(sdsParser(inlineSds).get('CardService'), '8.1')?.version).toBe('8.10.0');
    });
  });
});
