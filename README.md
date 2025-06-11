<img src="https://raw.githubusercontent.com/gematik/app-Authenticator/master/docs/Gematik_Logo_Flag.png" alt="Gematik_Logo" width="200" height="37" align="right"> <br>

# Authenticator

[![Quality Gate Status](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=alert_status&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Coverage](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=coverage&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Security Rating](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=security_rating&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Vulnerabilities](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=vulnerabilities&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Code Smells](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=code_smells&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)

## Table of Contents

1. [About The Project](#about-the-project)
    - [Release Notes](#release-notes)
2. [Development](#development)
    - [Getting Started](#getting-started)
    - [Test-Repositories](#test-repositories)
    - [Building the application](#building-the-application)
    - [Unittests](#unittests)
    - [Stack](#stack)
3. [Secure Credentials Storage](#storing-credentials-securely)
4. [Contributing](#contributing)
5. [License EUPL](#license-eupl)

## About The Project

The Authenticators main task is to securely authenticate users for login to digital health applications. It
authenticates authorized
doctors or medical staff and grants them access to the respective application. This provides a secure authentication
option for a variety of IT applications.

Visit our [Fachportal-Page](https://fachportal.gematik.de/hersteller-anbieter/komponenten-dienste/authenticator) for
more information.

### Release Notes

See [ReleaseNotes.md](./ReleaseNotes.md) for all information regarding the (newest) releases.

## Development

You can find detailed documentation on the requirements, the installation and the preparation in our knowledge
database: [Documentation](https://wiki.gematik.de/x/4jxCH)

### Getting Started

Clone this repository and run `npm install` to install all necessary dependencies.

Then run  `npm run dev` to start the Authenticator locally.

### Test-Repositories

This repository contain the resources to set up the development environment for the authenticator app.

Clone the following repository at the same level of the authenticator repository:

`git clone https://github.com/gematik/Vue-Oidcauth-Sample`

### Building the application

Run `npm run electron:build` for the production build or `npm run mock:build` for the *mock-version-build*.

#### Mock-Version

Within the *mock-version* of the Authenticator a mock mode is integrated, which can simulate the use of a connector.
This allows functional tests to be carried out without a
physically present connector. This feature is intended to simplify the development with the Authenticator, as it
provides not only a special mock mode but also more logging options.

Visit our knowledge database for more information: [Mock-Version](https://wiki.gematik.de/x/cRqdHQ)

### Unittests

Run `npm run test` or `npm run test:watch` to start the unittests.

### Stack

We use our own Webpack/Vue3 stack, to keep the App flexible and secure we do not use any framework like vue-cli or
vue electron plugin. They have too many vulnerabilities and this is not acceptable in our case.
Using the own webpack stack also brings us the real flexibility. We can change the configuration and the whole
stack smoothly.
This stack based on those technologies:

* Language: Typescript
* UI Framework: VueJS
* CSS Framework: TailwindCSS
* Bundler: Webpack
* JS Compiler: Babel
* Unit Testing: Jest
* Electron Compiler:  Electron Builder
* Linter: ESLint
* Formatter: Prettier

## Storing Credentials Securely

For detailed documentation of usage of the Windows Credential Manager in the context of the Authenticator,
see [here](credential-management/README.md)

## Contributing

We 💖 contributions. You can find detailed information in [CONTRIBUTING](.github/CONTRIBUTING.md)

## License

EUROPEAN UNION PUBLIC LICENCE v. 1.2

EUPL © the European Union 2007, 2016

## Additional Notes and Disclaimer from gematik GmbH

1. Copyright notice: Each published work result is accompanied by an explicit statement of the license conditions for
   use. These are regularly typical conditions in connection with open source or free software. Programs
   described/provided/linked here are free software, unless otherwise stated.
2. Permission notice: Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
   associated documentation files (the "Software"), to deal in the Software without restriction, including without
   limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
   Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions::
    1. The copyright notice (Item 1) and the permission notice (Item 2) shall be included in all copies or substantial
       portions of the Software.
    2. The software is provided "as is" without warranty of any kind, either express or implied, including, but not
       limited to, the warranties of fitness for a particular purpose, merchantability, and/or non-infringement. The
       authors or copyright holders shall not be liable in any manner whatsoever for any damages or other claims arising
       from, out of or in connection with the software or the use or other dealings with the software, whether in an
       action of contract, tort, or otherwise.
    3. The software is the result of research and development activities, therefore not necessarily quality assured and
       without the character of a liable product. For this reason, gematik does not provide any support or other user
       assistance (unless otherwise stated in individual cases and without justification of a legal obligation).
       Furthermore, there is no claim to further development and adaptation of the results to a more current state of
       the art.
3. Gematik may remove published results temporarily or permanently from the place of publication at any time without
   prior notice or justification.
4. Please note: Parts of this code may have been generated using AI-supported technology.’ Please take this into
   account, especially when troubleshooting, for security analyses and possible adjustments.
