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

import { mount } from '@vue/test-utils';
import ToastNotification from '@/renderer/components/ToastNotification.vue';
import { IToastNotificationProps } from '@/@types/common-types';

describe('ToastNotification.vue', () => {
  const defaultProps: IToastNotificationProps = {
    title: 'Test Title',
    message: 'Test Message',
  };

  it('renders the toast with title and message', () => {
    const wrapper = mount(ToastNotification, {
      props: defaultProps,
    });

    expect(wrapper.find('.font-semibold').text()).toBe(defaultProps.title);
    expect(wrapper.find('.font-normal').text()).toContain(defaultProps.message);
  });

  it('shows the primary button when showPrimaryButton is true', () => {
    const wrapper = mount(ToastNotification, {
      props: {
        ...defaultProps,
        showPrimaryButton: true,
        primaryButtonText: 'Accept',
      },
    });

    const primaryButton = wrapper.find('.bt');
    expect(primaryButton.exists()).toBe(true);
    expect(primaryButton.text()).toBe('Accept');
  });

  it('does not show the primary button by default', () => {
    const wrapper = mount(ToastNotification, {
      props: defaultProps,
    });

    expect(wrapper.find('.bt').exists()).toBe(false);
  });

  it('calls the primary button action on click', async () => {
    const primaryButtonAction = jest.fn();
    const wrapper = mount(ToastNotification, {
      props: {
        ...defaultProps,
        showPrimaryButton: true,
        primaryButtonAction,
      },
    });

    await wrapper.find('.bt').trigger('click');
    expect(primaryButtonAction).toHaveBeenCalled();
  });

  it('calls the secondary button action on click', async () => {
    const secondaryButtonAction = jest.fn();
    const wrapper = mount(ToastNotification, {
      props: {
        ...defaultProps,
        showSecondaryButton: true,
        secondaryButtonText: 'Klicken',
        secondaryButtonAction,
      },
    });

    const secondaryButton = wrapper.find('button.text-xs.min-w-\\[80px\\].h-\\[32px\\].px-3.py-1\\.5');
    await secondaryButton.trigger('click');
    expect(secondaryButtonAction).toHaveBeenCalled();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = jest.fn();
    const wrapper = mount(ToastNotification, {
      props: {
        ...defaultProps,
        showDismissButton: true,
        onDismiss,
      },
    });

    await wrapper.find('button[aria-label="Close"]').trigger('click');
    expect(onDismiss).toHaveBeenCalled();
  });

  it('starts auto-dismiss timer when autoDismiss is true', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    mount(ToastNotification, {
      props: {
        ...defaultProps,
        autoDismiss: true,
        autoDismissTime: 2,
        onDismiss,
      },
    });

    expect(onDismiss).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2000);
    expect(onDismiss).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
