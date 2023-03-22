/*
 * Copyright 2023 gematik GmbH
 *
 * The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
 * Sourcecode must be in compliance with the EUPL.
 *
 * You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
 * language governing permissions and limitations under the License.ee the Licence for the specific language governing
 * permissions and limitations under the Licence.
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
