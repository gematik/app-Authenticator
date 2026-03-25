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
import CardExpiredWarning from '@/renderer/components/CardExpiredWarning.vue';
import ToastNotification from '@/renderer/components/ToastNotification.vue';

// Mock the ToastNotification component to avoid dealing with its internal logic
jest.mock('@/renderer/components/ToastNotification.vue', () => ({
  name: 'ToastNotification',
  template: '<div class="toast-notification-mock"><slot /></div>',
  props: ['title', 'message', 'position', 'key'],
}));

describe('CardExpiredWarning component', () => {
  let wrapper: VueWrapper<any>;

  // A simple mock for the vue-i18n $t function
  const mockT = (key: string, options?: any): string => {
    if (options) {
      // Creates a string like "key with { cardType: 'SMC-B', ... }"
      return `${key} with ${JSON.stringify(options)}`;
    }
    return key;
  };

  beforeEach(() => {
    wrapper = mount(CardExpiredWarning, {
      global: {
        mocks: {
          $t: mockT, // Provide the mock $t function to the component
        },
      },
    });
  });

  it('should not render any warnings on initial mount', () => {
    expect(wrapper.findComponent(ToastNotification).exists()).toBe(false);
  });

  it('should display a warning when newCardExpirationWarning is called', async () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 25); // Expires in 25 days

    // Access the component's exposed method
    await wrapper.vm.newCardExpirationWarning({
      cardType: 'SMC-B',
      iccsn: '1234567890',
      expirationDate: expirationDate.toISOString(),
    });

    const toasts = wrapper.findAllComponents(ToastNotification);
    expect(toasts.length).toBe(1);

    const toastProps = toasts[0].props();
    expect(toastProps.title).toBe('warning');
    expect(toastProps.message).toContain('warning_card_expire'); // Message for a card that is about to expire
    expect(toastProps.message).toContain('"cardType":"SMC-B"');
    expect(toastProps.message).toContain('"iccsn":"1234567890"');
  });

  it('should display an "expired" message for a card that has already expired', async () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 5); // Expired 5 days ago

    await wrapper.vm.newCardExpirationWarning({
      cardType: 'HBA',
      iccsn: '0987654321',
      expirationDate: expirationDate.toISOString(),
    });

    const toast = wrapper.findComponent(ToastNotification);
    expect(toast.props().message).toContain('warning_card_expired'); // Message for an already expired card
  });

  it('should handle and display multiple warnings correctly', async () => {
    const expirationDate1 = new Date();
    expirationDate1.setDate(expirationDate1.getDate() + 10); // About to expire

    const expirationDate2 = new Date();
    expirationDate2.setDate(expirationDate2.getDate() - 10); // Already expired

    await wrapper.vm.newCardExpirationWarning({
      cardType: 'SMC-B',
      iccsn: '1111',
      expirationDate: expirationDate1.toISOString(),
    });

    await wrapper.vm.newCardExpirationWarning({
      cardType: 'HBA',
      iccsn: '2222',
      expirationDate: expirationDate2.toISOString(),
    });

    const toasts = wrapper.findAllComponents(ToastNotification);
    expect(toasts.length).toBe(2);

    // Check first toast message
    expect(toasts[0].props().message).toContain('warning_card_expire');
    expect(toasts[0].props().message).toContain('"iccsn":"1111"');

    // Check second toast message
    expect(toasts[1].props().message).toContain('warning_card_expired');
    expect(toasts[1].props().message).toContain('"iccsn":"2222"');
  });

  it('should not add a warning for a card that expires in more than 90 days', async () => {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 100); // Expires far in the future

    await wrapper.vm.newCardExpirationWarning({
      cardType: 'SMC-B',
      iccsn: '3333',
      expirationDate: expirationDate.toISOString(),
    });

    expect(wrapper.findComponent(ToastNotification).exists()).toBe(false);
  });
});
