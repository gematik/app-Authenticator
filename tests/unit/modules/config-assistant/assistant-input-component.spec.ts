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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */
import { mount } from '@vue/test-utils';
import AssistantInput from '@/renderer/modules/config-assistant/components/AssistantInput.vue';
import i18n from '@/renderer/i18n';

class CustomKeyboardEvent extends KeyboardEvent {
  private _capsLock: boolean;

  constructor(type: string, eventInitDict: KeyboardEventInit & { capsLock?: boolean }) {
    super(type, eventInitDict);
    this._capsLock = eventInitDict.capsLock || false;
  }

  getModifierState(keyArg: string): boolean {
    if (keyArg === 'CapsLock') {
      return this._capsLock;
    }
    return super.getModifierState(keyArg);
  }
}

class DataTransferMock {
  files: File[] = [];

  items = {
    add: (file: File) => {
      this.files.push(file);
    },
    remove: (index: number) => {
      this.files.splice(index, 1);
    },
  };
}

describe('Assistant input component for keyboard and file inputs', () => {
  it('renders an input with the correct type', () => {
    const wrapper = mount(AssistantInput, {
      global: {
        plugins: [i18n],
      },
      props: {
        label: 'Username',
        type: 'text',
      },
    });

    const input = wrapper.find('input');
    expect(input.exists()).toBe(true);
    expect(input.attributes('type')).toBe('text');
  });

  it('limits input length to maxlength prop', async () => {
    const wrapper = mount(AssistantInput, {
      global: {
        plugins: [i18n],
      },
      props: {
        label: 'Username',
        type: 'text',
        maxlength: 5,
      },
    });

    const input = wrapper.find('input');
    await input.setValue('123456789');
    expect(input.element.value).toBe('12345');
  });

  it('validates number input correctly', async () => {
    const wrapper = mount(AssistantInput, {
      global: {
        plugins: [i18n],
      },
      props: {
        label: 'Age',
        type: 'number',
        max: 100,
      },
    });

    const input = wrapper.find('input');
    await input.setValue('150');
    expect(input.element.value).toBe('');
  });

  it('handles file input correctly', async () => {
    const mockFile = new File(['foo'], 'foo.txt', { type: 'text/plain' });

    const wrapper = mount(AssistantInput, {
      global: {
        plugins: [i18n],
      },
      props: {
        label: 'Upload File',
        type: 'file',
        fileCallback: (e: Event) => {
          const input = e.target as HTMLInputElement;
          const files = input.files;
          expect(files).toBeTruthy();
          if (files) expect(files[0]).toBe(mockFile);
        },
      },
    });
    const input = wrapper.find('input[type="file"]');
    expect(input.exists()).toBe(true);
    const inputElement = input.element as HTMLInputElement;
    const dataTransfer = new DataTransferMock();
    dataTransfer.items.add(mockFile);
    Object.defineProperty(inputElement, 'files', {
      value: dataTransfer.files,
      writable: false,
    });
    await input.trigger('change');
  });

  it('handles CapsLock detection', async () => {
    const wrapper = mount(AssistantInput, {
      global: {
        plugins: [i18n],
      },
      props: {
        label: 'Password',
        type: 'password',
      },
    });

    const event = new CustomKeyboardEvent('keydown', { capsLock: true });
    document.dispatchEvent(event);

    await wrapper.vm.$nextTick();
    expect(wrapper.find('.text-orange-500').exists()).toBe(true);
  });

  it('should update input value when model gets changed externally', async () => {
    const wrapper = mount(AssistantInput, {
      global: {
        plugins: [i18n],
      },
      props: {
        modelValue: 'initialValue',
        type: 'text',
        label: 'test',
      },
    });

    // Simuliere eine Änderung des Modells
    await wrapper.setProps({ modelValue: 'newValue' });

    const input = wrapper.find('input');

    // Überprüfe, ob der Input-Wert aktualisiert wurde
    expect(input.element.value).toBe('newValue');
  });
});
