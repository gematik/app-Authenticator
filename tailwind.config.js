/*
 * Copyright (c) 2023 gematik GmbH
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the Licence);
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * 
 *     https://joinup.ec.europa.eu/software/page/eupl
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 * 
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
