<img align="right" width="200" height="37" src="docs/Gematik_Logo_Flag.png"/> <br/>

# Release Authenticator

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

