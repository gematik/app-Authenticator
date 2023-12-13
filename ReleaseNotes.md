<img align="right" width="200" height="37" src="docs/Gematik_Logo_Flag.png"/> <br/>

# Release Authenticator

## Version 4.8.1

### bugfix

- Fixed Proxy Validation
- Fixed Logging issue

## Version 4.8.0

### added

- Deactivation of OS proxy settings now requires mandatory Proxy Address and Port fields entries
- IP Validation added for Proxy Ignore List in Settings Page
- Sensitive data is now stored using the Credential Manager
- New Help page with informative links for better understanding

### bugfix

- SMC-B flow crash after successful HBA flow issue fixed
- Improved URL parsing mechanism for accurate identification of host and path in IDP service
- Config.json storage path adjusted for specified ENV parameters
- Empty environment variable changes are now ignored
- Function tests now include only PU IDP endpoints
- Enhanced logic for IDP domain name definition

## Version 4.7.0

### added

- Introduced XenDesktop support
- Added asterisks support for the Proxy setting "kein Proxy für"
- Introduced manual proxy settings
- Integrated VueJs 3 across the entire project
- Introduced a Save button after functional tests
- Opted out of creating a desktop icon during installation
- Made the app MacOS compatible (for development only)
- Prevented auto-updates on mock-versions

### bugfix

- Streamlined "environment variables check" for more efficient handling
- Enhanced logic for retrieving the config path
- Refined deeplink validation mechanism
- Ensured case sensitivity handling for card types
- Correctly parsed string boolean values to actual booleans
- Removed redundant vue.config.js file from the project

### security

- Each HBA now has a unique UserID

## Version 4.6.0

added:

- Implemented a new card type "MULTI" to login via HBA & SMC-B with one click
- The Authenticator now handles multiple authentication requests properly
- User-friendly error messages with hints to solve the problem

bugfix:

- The deinstallation process now works in all known cases

security:

- Include a security.md file
- Updated the packages

## Version 4.5.0

added:

- Support of windows server ( >= 2016 )
- P12-Certificates support combination of ECC & RSA
- New error message, if HBA smart card is in use

bugfix:

- Clean deinstallation of authenticator
- Increased timeout of PU IDP TI

security:

- Updated packages

## Version 4.4.1

bugfix:

- Added CA Certificates for IDP internet and TI endpoint to Authenticator truststore (RU & PU)

## Version 4.4.0

added:

- Support for the new cardType parameter in Challenge Path
- Using the OS Truststore for auto redirect call

deprecated:

- Using the Person_ID and Institution_ID information for defining cardType in scope parameter of Challenge Path

bugfix:

- Solve Jest bug with node 18
- The Authenticator appears in the foreground when multiple cards are found
- Fixed multiple instance issue

## Version 4.3.0 (2023-06-08)

added:

- Packages and dependencies were updated

fixed:

- Bugfix in back- and foreground function of the Authenticator
- Bugfix function test while using TLS certificates

## Version 4.2.1 - HotFix (2023-05-25)

fixed:

- Defining Mock-Mode logic fixed
- Log level issue fixed
- Allowed Protocol types issue fixed

## Version 4.2.0 (2023-05-15)

added:

- Support P12-Files (RSA) for TLS-Authentication
- Log more necessary details on Mock Mode
- Read VMWare Env. Variables "VIEWCLIENT_MACHINE_NAME" from registry feature
- Cancel feature for the ongoing function test
- Make function tests without updating the config file on the fly

fixed:

- Logging for multi-card-scenarios reduced + bugfix
- Support for "wandernde session" repaired (Refresh)
- User-Agent added for auto-redirect calls
- Remove wrong error log on Multi-Card found event
- Construction of certificate path on upload process fixed
- Default values for Settings form
- The old auth flow process "OGR Flow" has been removed

## Version 4.1.0 (2023-04-07)

added:

- Implementation of the support for multiple HBAs being used simultaneously
- User-Dialog will appear, where the user is able to select the desired HBA for the auth. flow
- Repositories "resource-server" and "vue-example-app" were combined
- Decreased the amount of unnecessary logs significantly
- Packages and dependencies were updated
- Content Security Policy added and Electron security has been improved

fixed:

- Some parameters of a callback were not encoded correctly

## Version 4.0.0 (2023-03-22)

added:

- new Button to create a ZIP-File of the authenticator created log-files
- Multi-SMC-B support with User-Dialog for selecting the desired SMC-B for the Auth. Flow
- Improved handling of HBAs with active transport Pin. A new Error-Message will be displayed that should help with
  identifying active transport pins and what to do with them.
- Tooltips for Settings Dialog
- Localhost as interface / entry point removed
- Link to “Wissensdatenbank” in function test dialog
- Settings dialog error messages optimized
- Redirect to web application as an alternative to browser open
- OAuth2 conform handling of IDP errors
- sends an error_uri and the associated state in case of an error
- function test logging of not valid certificates

fixed:

- User Certificates get no longer lost after update
- UX : Spinner in connection tests + Insert Card + Pin
- citrix "wandernde sessions"
- fix for the installation process

## Version 3.1.0 (2023-02-06)

### added:

- Support own proxy ignore list
- Hide the release number info in the Authenticator App and show it only per tooltip
- Disable the deprecated local endpoint (port)
- Admininstrator
    - Function test to check if all certificates in certificate store *(C:\Program
      Files\gematik Authenticator\resources\certs-idp & C:\Program Files\gematik
      Authenticator\resources\certs-konnektor)*
      are valid and in the correct file format

### fixed:

- Citrix
    - App crashes if the config directory doesn't exist
    - If the save action fails because of missing Write Permission user receives no reaction
- UX
    - Konnektor settings in Authenticator are lost in a session if mock mode was enabled
- Error "self-signed certificate in certificate chain"
- Error logging fails on HTTP error cases
- Deep Link Uri - Conformity to RFC3986
- Cancel ongoing Auto-Update process if user changes the settings
- Faulty card handle processing with unplugged cards (HBA or SMC-B)
- Switching between the selection "Zertifikat" and "Benutername/Passwort" and vice-versa does not leave out the
  json-config
- Wrong error code when changing the settings ClientID
- The mock version should reach all known IDPs and the prod version the PU-IDP(s) in the function test
- Wrong flow after pressing the "Abbrechen" button in the "PIN-Eingabe" dialog at Z-IDP
- Proxy PAC Files with n proxies for one url → use the proxy with the highest priority
- Wrong ProxyAgent for destination address
- Disabled false http 302 redirect to browser

### security:

- Do not log sensitive data in the mock version
- Unauthenticated degradation of local availability (z.B.: DoS with CURL)

## Version 3.0.1 (2022-12-08)

### fixed:

- Added userAgent to request headers on IDP

## Version 3.0.0 (2022-11-30)

### added:

- Central configuration option for decentralized installations
- Configurable auto-update function
- Conformance check for certificate-based authentication

### fixed:

- Better protection against man-in-the-middle attacks
- Domain specific error management

## Version 2.4.0 (2022-10-17)

### added:

- UI/UX Optimization:
    - Removal the scroll function
    - Query via dialog before saving the settings
- Optimization and provision of the logs for the mock variant during communication between authenticator and
  Connector or IDP
- Optimized log output for the error log level
- Improvement of functional tests

### fixed:

- Disabled the option to open a new instance of the authenticator via hotkey

## Version 2.3.0 (2022-09-15)

### added:

- UI/UX Improvement for the function test and checking the input fields
- UI/UX Paths of the key and the certificate readable by mouseover
- Improved function test output for easier error analysis
- Supply a mock variant for developers and testers in addition to the previous productive version with a higher
  Log level (debug)
- Configuration of the certificates in mock mode via GUI
- Optimized log output: including ISO format for time stamps
- Add Tailwind to package.json

### fixed:

- No permanent caching of the connector.sds
- missing User-Agent
- further Bugfixes

### security:

- Scheme validation of the redirect_uri

## Version 2.2.0 (2022-07-29)

### added:

- Proxy-Agent
- User-Agent

### fixed:

- change of focus
- Code-Refactoring
- Error code display

## Version 2.1.0 (2022-07-08)

### added:

- *Organspenderegister-IDP* and central IDP mock mode for developers and testers
- Extension of the authenticator with a local web server endpoint as an alternative to the deep link
- The FQDN check of the authenticator against the connector certificate is deactivated in the current version
- Troubleshoot certificate processing
- Starting with this version, the authenticator uses the library GOT for network communication

## Version 2.0.0 (2022-06-20)

### added:

- Central IDP service support: https://idp-ref.app.ti-dienste.de
- Brainpool curve support (brainpoolP256r1)
- Optimization UI
- Update Dependencies
- General bugfixes

## Version 1.0.1 (2022-03-04)

### added:

- For OGR
    - Improved error handling related to connectors
    - List created for assigning error codes
    - A message now appears when saving the settings
    - Formatting of the imprint optimized
    - Sensitive user data no longer appear in the log
    - Unnecessary SOAP responses no longer appear in the log
    - Improved designations of the input fields in the settings menu

### fixed:

- Remote VerifyPIN

