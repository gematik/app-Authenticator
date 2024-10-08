/*
 * Copyright 2024 gematik GmbH
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

module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{js,jsx,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Apercu'],
      },
      fontSize: {
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
      },
      colors: {
        baseText: '#3E4784',
        primary: '#F8F9FC',
        border: '#E4E7EC',
        inputBorder: '#D0D5DD',
        light: '#FCFCFD',
        neutral: '#F2F4F7',
        inputBgFocus: '#F9FAFB',
        inputBorderFocus: '#717BBC',
        btDefault: '#3E4784',
        btHover: '#000E52',
        btSecHover: '#000E52',
        error: '#D92D20',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
};
