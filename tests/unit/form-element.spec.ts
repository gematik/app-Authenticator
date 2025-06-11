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
import FormElement from '@/renderer/components/FormElement.vue';
import i18n from '@/renderer/i18n';
import { IFormInputColumnTypes, IFormInputDropDownOptions, IFormInputDropDownOptionType } from '@/@types/common-types';

type IFormElementProps = {
  model: Record<string, unknown>;
  required: boolean;
  name: string;
  label: string;
  placeholder: string;
  type: IFormInputColumnTypes;
  options?: IFormInputDropDownOptions[];
  optionsType?: IFormInputDropDownOptionType;
};

describe('form element', () => {
  const props: IFormElementProps = {
    model: {},
    required: true,
    name: 'name',
    label: 'Awesome Label',
    type: 'text',
    placeholder: 'Awesome Value',
  };

  const renderFormElementForProps = (props: IFormElementProps) => {
    return mount(FormElement, { props, global: { plugins: [i18n] } });
  };

  it('renders input field', async function () {
    props.type = 'input';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders text field', async function () {
    props.type = 'text';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders number field', async function () {
    props.type = 'number';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders drop-down for standard options', async function () {
    props.type = 'drop-down';
    props.optionsType = 'standardBool';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders drop-down for custom options', async function () {
    props.type = 'drop-down';
    props.options = [{ text: 'Awesome', value: 'awesome' }];
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders email field', async function () {
    props.type = 'email';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders file field', async function () {
    props.type = 'file';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders file-path field', async function () {
    props.type = 'file-path';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });

  it('renders file-path field', async function () {
    props.type = 'password';
    expect(renderFormElementForProps(props).element).toMatchSnapshot();
  });
});
