<img align="right" width="200" height="37" src="docs/Gematik_Logo_Flag.png"/> <br/>

# Authenticator

[![Quality Gate Status](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=alert_status&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Coverage](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=coverage&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Security Rating](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=security_rating&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Vulnerabilities](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=vulnerabilities&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)
[![Code Smells](https://sonar.prod.ccs.gematik.solutions/api/project_badges/measure?project=authenticator&metric=code_smells&token=7b83ef28f0010bcf42e4223406311573dad4aca5)](https://sonar.prod.ccs.gematik.solutions/dashboard?id=authenticator)

<details>
    <summary>Table of Contents</summary>
        <ol>
            <li><a href="#about-the-project">About The Project</a>
                <ul>
                    <li><a href="#release-notes">Release Notes</a></li>
                </ul>
            </li>
            <li><a href="#development">Development</a>
                <ul>
                    <li><a href="#getting-started">Getting Started</a></li>
                    <li><a href="#test-Repositories">Test-Repositories</a></li>
                    <li><a href="#building-the-application">Building the application</a></li>
                    <li><a href="#unittests">Unittests</a></li>
                    <li><a href="#stack">Stack</a></li>
                </ul>
            </li>
            <li><a href="#contributing">Contributing</a></li>
            <li><a href="#license-eupl">License EUPL</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#support-and-feedback">Support and Feedback</a></li>
        </ol>
</details>

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

These repositories contain the resources to set up the development environment for the authenticator app.

Clone the following repositories at the same level of the authenticator repository:

`git clone https://github.com/gematik/Resource-Server-Example`

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

## Contributing

We plan to enable contribution to the Authenticator in the near future.

## License EUPL

Copyright 2023 gematik GmbH

The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
Sourcecode must be in compliance with the EUPL.

You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl

Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
language governing permissions and limitations under the License.ee the Licence for the specific language governing
permissions and limitations under the Licence.

## FAQ

Visit our [FAQ page](https://wiki.gematik.de/x/tjdCH) for more information.

## Support and Feedback

For inquiries from application developers regarding the API or suggestions, please use the following email address:
[authenticator@gematik.de](mailto:authenticator@gematik.de)


