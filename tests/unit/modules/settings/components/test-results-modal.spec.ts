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
import TestResultModal from '@/renderer/modules/settings/components/TestResultModal.vue';
import { TestResult, TestStatus } from '@/renderer/modules/settings/services/test-runner';

// Mock the translation function
const t = (key: string) => key;

// Mock window.api.openExternal
const mockOpenExternal = jest.fn();

// Ensure window.api exists and mock openExternal
(global as any).window = {
  ...global.window,
  api: {
    openExternal: mockOpenExternal,
  },
};

describe('TestResultModal.vue', () => {
  const baseProps = {
    closeFunctionTestModal: jest.fn(),
    saveSettings: jest.fn(),
  };

  beforeEach(() => {
    // Clear mock history before each test
    mockOpenExternal.mockClear();
  });

  it('should not display the solution link button if solutionLink is undefined', () => {
    const functionTestResults: TestResult[] = [
      {
        title: 'Test Title',
        name: 'Test Name',
        status: TestStatus.failure,
        details: 'Some error details',
        solutionLink: undefined,
      },
    ];

    const wrapper = mount(TestResultModal, {
      props: {
        ...baseProps,
        functionTestResults,
      },
      global: {
        mocks: {
          $t: t,
        },
      },
    });

    const solutionButton = wrapper.findAll('button').find((b) => b.text() === 'Lösungsvorschläge');
    expect(solutionButton).toBeUndefined();
  });

  it('should not display the solution link button if solutionLink is an empty string', () => {
    const functionTestResults: TestResult[] = [
      {
        title: 'Test Title',
        name: 'Test Name',
        status: TestStatus.failure,
        details: 'Some error details',
        solutionLink: '',
      },
    ];

    const wrapper = mount(TestResultModal, {
      props: {
        ...baseProps,
        functionTestResults,
      },
      global: {
        mocks: {
          $t: t,
        },
      },
    });

    const solutionButton = wrapper.findAll('button').find((b) => b.text() === 'Lösungsvorschläge');
    expect(solutionButton).toBeUndefined();
  });

  it('should display the solution link button if solutionLink is a valid string', () => {
    const functionTestResults: TestResult[] = [
      {
        title: 'Test Title',
        name: 'Test Name',
        status: TestStatus.failure,
        details: 'Some error details',
        solutionLink: 'https://example.com/solution',
      },
    ];

    const wrapper = mount(TestResultModal, {
      props: {
        ...baseProps,
        functionTestResults,
      },
      global: {
        mocks: {
          $t: t,
        },
      },
    });

    const solutionButton = wrapper.findAll('button').find((b) => b.text() === 'Lösungsvorschläge');
    expect(solutionButton).toBeDefined();
    expect(solutionButton!.exists()).toBe(true);
  });
});
