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

import { mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import CardExpirationWarner from '@/renderer/modules/gem-idp/components/CardExpirationWarner.vue';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { X509Certificate } from '@peculiar/x509';

// Mock the @peculiar/x509 library
jest.mock('@peculiar/x509', () => ({
  X509Certificate: jest.fn(),
}));

// Mock useSettings with configurable return value
let mockSettingsData = {};
jest.mock('@/renderer/modules/settings/useSettings', () => ({
  useSettings: () => ({
    load: jest.fn(() => mockSettingsData),
    save: jest.fn(),
    clear: jest.fn(),
    exist: jest.fn(() => true),
    setWithoutSave: jest.fn(),
  }),
}));

// Mock the child component to isolate the component under test
const CardExpiredWarningMock = {
  name: 'CardExpiredWarning',
  template: '<div class="card-expired-warning-stub" />',
  methods: {
    newCardExpirationWarning: jest.fn(),
  },
};

describe('CardExpirationWarner.vue', () => {
  // reset all mocks after all tests
  afterAll(() => {
    jest.resetAllMocks();
  });

  let store: any;
  let mockNewCardExpirationWarning: jest.Mock;

  // Helper function to create a mounted wrapper with a specific store state
  const createWrapper = (cardsState: any): VueWrapper<any> => {
    mockNewCardExpirationWarning = jest.fn();
    store = createStore({
      state: {
        connectorStore: {
          cards: cardsState,
        },
      },
    });

    return mount(CardExpirationWarner, {
      global: {
        plugins: [store],
        stubs: {
          // Replace the real component with our mock and inject the spy
          CardExpiredWarning: {
            ...CardExpiredWarningMock,
            methods: {
              newCardExpirationWarning: mockNewCardExpirationWarning,
            },
          },
        },
      },
    });
  };

  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation
    jest.clearAllMocks();
    // Reset settings to default
    mockSettingsData = {};
  });

  describe('when card expiration warning is enabled', () => {
    beforeEach(() => {
      // Enable card expiration warning in settings
      mockSettingsData = {
        'connector.entryOption.warnCardExpiration': true,
      };
    });

    it('should trigger warning for a card with a valid certificate', async () => {
      const cardType = ECardTypes.SMCB;
      const iccsn = '1234567890';
      const certificate = '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----';
      const expirationDate = new Date('2025-12-31T23:59:59.000Z');
      const expectedExpirationString = '2025-12-31Z';

      // Mock the X509Certificate constructor to return a valid expiration date
      (X509Certificate as unknown as jest.Mock).mockImplementation(() => ({
        notAfter: expirationDate,
      }));

      const wrapper = createWrapper({
        [cardType]: { iccsn, certificate },
      });

      await wrapper.vm.checkCardExpirationWarning(cardType);

      expect(mockNewCardExpirationWarning).toHaveBeenCalledTimes(1);
      expect(mockNewCardExpirationWarning).toHaveBeenCalledWith({
        cardType,
        iccsn,
        expirationDate: expectedExpirationString,
      });
    });

    it('should not trigger a warning if the card has no certificate', async () => {
      const cardType = ECardTypes.HBA;
      const iccsn = '0987654321';

      // State for a card that is present but has no certificate data
      const wrapper = createWrapper({
        [cardType]: { iccsn, certificate: null },
      });

      await wrapper.vm.checkCardExpirationWarning(cardType);

      expect(mockNewCardExpirationWarning).not.toHaveBeenCalled();
    });

    it('should not trigger a warning if the certificate parsing fails', async () => {
      const cardType = ECardTypes.SMCB;
      const iccsn = '1111222233';
      const certificate = 'invalid-certificate-data';

      // Mock the X509Certificate constructor to throw an error
      (X509Certificate as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid certificate format');
      });

      const wrapper = createWrapper({
        [cardType]: { iccsn, certificate },
      });

      await wrapper.vm.checkCardExpirationWarning(cardType);

      expect(mockNewCardExpirationWarning).not.toHaveBeenCalled();
    });

    it('should not trigger a warning if the certificate has no expiration date', async () => {
      const cardType = ECardTypes.HBA;
      const iccsn = '4455667788';
      const certificate = '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----';

      // Mock the X509Certificate to return no `notAfter` date
      (X509Certificate as unknown as jest.Mock).mockImplementation(() => ({
        notAfter: null,
      }));

      const wrapper = createWrapper({
        [cardType]: { iccsn, certificate },
      });

      await wrapper.vm.checkCardExpirationWarning(cardType);

      expect(mockNewCardExpirationWarning).not.toHaveBeenCalled();
    });
  });

  describe('when card expiration warning is disabled', () => {
    beforeEach(() => {
      // Disable card expiration warning in settings
      mockSettingsData = {
        'connector.entryOption.warnCardExpiration': false,
      };
    });

    it('should not trigger warning even for a smc-b card with a valid certificate', async () => {
      const cardType = ECardTypes.SMCB;
      const iccsn = '1234567890';
      const certificate = '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----';
      const expirationDate = new Date('2025-12-31T23:59:59.000Z');

      // Mock the X509Certificate constructor to return a valid expiration date
      (X509Certificate as unknown as jest.Mock).mockImplementation(() => ({
        notAfter: expirationDate,
      }));

      const wrapper = createWrapper({
        [cardType]: { iccsn, certificate },
      });

      await wrapper.vm.checkCardExpirationWarning(cardType);

      // Should not trigger warning because setting is disabled and card is smc-b
      expect(mockNewCardExpirationWarning).not.toHaveBeenCalled();
    });

    it('should trigger warning for HBA card type even when disabled', async () => {
      const cardTypes = [ECardTypes.SMCB, ECardTypes.HBA];
      const certificate = '-----BEGIN CERTIFICATE-----...-----END CERTIFICATE-----';
      const expirationDate = new Date('2025-12-31T23:59:59.000Z');

      // Mock the X509Certificate constructor to return a valid expiration date
      (X509Certificate as unknown as jest.Mock).mockImplementation(() => ({
        notAfter: expirationDate,
      }));

      const cardsState: Record<ECardTypes, { iccsn: string; certificate: string }> = {} as any;
      cardTypes.forEach((cardType, index) => {
        cardsState[cardType] = {
          iccsn: `iccsn-${index}`,
          certificate,
        };
      });

      const wrapper = createWrapper(cardsState);

      // Test each card type
      for (const cardType of cardTypes) {
        await wrapper.vm.checkCardExpirationWarning(cardType);
      }

      // Should only trigger once for HBA card type
      expect(mockNewCardExpirationWarning).toHaveBeenCalledTimes(1);
    });
  });
});
