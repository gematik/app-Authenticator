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
6. [FAQ](#faq)
7. [Support and Feedback](#support-and-feedback)

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
see [here](credential-distribution/README.md)

## License EUPL

Copyright 2024 gematik GmbH

The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
Sourcecode must be in compliance with the EUPL.

You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl

Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
language governing permissions and limitations under the License.ee the Licence for the specific language governing
permissions and limitations under the Licence.

