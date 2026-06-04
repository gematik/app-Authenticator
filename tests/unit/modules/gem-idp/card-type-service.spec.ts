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
import { getCardTypeFromScope } from '@/renderer/utils/card-type-service';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { TOidcProtocol2UrlSpec } from '@/@types/common-types';
import { logger } from '@/renderer/service/logger';

jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
jest.spyOn(logger, 'info').mockImplementation(() => undefined);

describe('getCardTypeFromScope – multi-card queueing', () => {
  const challengePath = 'http://x.de/sign?scope=openid%20gem-auth&nonce=abc&cardType=multi';

  it('queues the second card (SMC-B) for a multi flow in legacy mode', async () => {
    const createQueue = jest.fn();
    const args = { challenge_path: challengePath } as TOidcProtocol2UrlSpec;

    const cardType = await getCardTypeFromScope('multi' as ECardTypes, args, createQueue);

    // first card is HBA, SMC-B is enqueued for the Authenticator to run next
    expect(cardType).toBe(ECardTypes.HBA);
    expect(createQueue).toHaveBeenCalledTimes(1);
  });

  it('does NOT queue the second card in server mode (the RP drives it)', async () => {
    const createQueue = jest.fn();
    const args = { challenge_path: challengePath, serverMode: true } as TOidcProtocol2UrlSpec;

    const cardType = await getCardTypeFromScope('multi' as ECardTypes, args, createQueue);

    // still starts with HBA, but SMC-B is left to the RP's second GET /authorize
    expect(cardType).toBe(ECardTypes.HBA);
    expect(createQueue).not.toHaveBeenCalled();
  });
});
