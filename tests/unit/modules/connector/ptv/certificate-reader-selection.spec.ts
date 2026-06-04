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

import { selectReadCardCertificateEnvelope } from '@/renderer/modules/connector/connector_impl/certificate-reader';
import { PtvVersion } from '@/renderer/modules/connector/ptv';
import { CRYPT_TYPES } from '@/renderer/modules/connector/constants';

const ctx = {
  mandantId: 'M',
  clientId: 'C',
  workplaceId: 'W',
  userId: 'U',
};

const cert = {
  certificateRef: 'C.AUT',
  crypt: CRYPT_TYPES.ECC,
};

describe('selectReadCardCertificateEnvelope', () => {
  it('uses the PTV3 envelope (no <Crypt>) for PtvVersion.PTV3', () => {
    const xml = selectReadCardCertificateEnvelope(PtvVersion.PTV3, 'HANDLE-1', ctx, cert);
    expect(xml).toContain('<v6:ReadCardCertificate>');
    expect(xml).toContain('<v6:CertRef>C.AUT</v6:CertRef>');
    expect(xml).not.toContain('<v6:Crypt>');
  });

  it('uses the PTV4 envelope (with <Crypt>) for PtvVersion.PTV4', () => {
    const xml = selectReadCardCertificateEnvelope(PtvVersion.PTV4, 'HANDLE-1', ctx, cert);
    expect(xml).toContain('<v6:Crypt>ECC</v6:Crypt>');
  });

  it.each([PtvVersion.PTV5, PtvVersion.PTV5_PLUS, PtvVersion.PTV6])(
    'uses the PTV4-shape envelope (with <Crypt>) for %s',
    (ptv) => {
      const xml = selectReadCardCertificateEnvelope(ptv, 'HANDLE-1', ctx, cert);
      expect(xml).toContain('<v6:Crypt>ECC</v6:Crypt>');
    },
  );

  it('falls back to the PTV4-shape envelope for UNKNOWN PTV', () => {
    const xml = selectReadCardCertificateEnvelope(PtvVersion.UNKNOWN, 'HANDLE-1', ctx, cert);
    expect(xml).toContain('<v6:Crypt>ECC</v6:Crypt>');
  });
});
