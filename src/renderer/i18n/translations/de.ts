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

import { ERROR_CODES } from '@/error-codes';

export default {
  enabled: 'Aktiviert',
  disabled: 'Deaktiviert',
  registration: 'Anmeldung',
  settings: 'Einstellungen',
  settings_please_enter_valid_data: 'Bitte geben Sie einen korrekten Eingabewert ein!',
  imprint: 'Impressum',
  imprint_no_support_hint: 'Wir bieten keinen telefonischen Support an. ',
  imprint_support_hint:
    'Bei technischen Problemen wenden Sie sich bitte an Ihren IT-Dienstleister oder direkt an den Hersteller bzw. Anbieter.',
  version: 'Version { version }',
  managing_director: 'Geschäftsführer',
  save: 'Speichern',
  file_selected: 'Datei Ausgewählt',
  welcome_to_our_authenticator_app: 'Sichere Anmeldung in der Telematikinfrastruktur',
  cancel: 'Abbrechen',
  login_via_smart_card_successful: 'Anmeldung mittels Smart Card erfolgreich!',
  login_not_successful: 'Anmeldung mittels Smart Card nicht erfolgreich!',
  login_cancelled_by_user: 'Sie haben den Vorgang abgebrochen',
  no_settings_found: 'Es wurden noch keine Einstellungen vorgenommen.',
  open_settings: 'Einstellungen öffnen',
  remove_settings: 'Einstellungen entfernen',
  connection_test: 'Funktionstest (inkl. Speichern)',
  connector_settings: 'Konnektor-Einstellungen',
  host: 'Host',
  port: 'Port',
  merchant_id: 'Mandant-ID',
  client_id: 'Client-ID',
  work_space_id: 'Arbeitsplatz-ID',
  tls_authentication: 'TLS Authentisierung',
  username_password: 'Benutzername/Passwort',
  certificate: 'Zertifikat',
  no_authentication: 'Keine Authentisierung',
  username_from_connector: 'Benutzername (vom Konnektor)',
  password_from_connector: 'Passwort (vom Konnektor)',
  reject_unauthorized: 'Konnektor Zertifikat prüfen',
  private_key: 'Privater Schlüssel im PEM-Format',
  client_certificate: 'Client-Zertifikat im PEM-Format',
  settings_saved_info: 'Die Änderungen sind erst wirksam nach dem Speichern',
  settings_saved_successfully: 'Einstellungen wurden erfolgreich gespeichert',
  funktion_test: 'Funktionstest',
  funktion_test_processing: 'Einen Moment warten, Funktionstests werden nun durchgeführt...',
  function_test_finished: 'Funktionstest abgeschlossen',
  close_dlg: 'Schließen',
  error_info: 'Fehler: ',
  faq_info: 'Informationen bei Problemen',
  accessibility_of_the_connector: 'Erreichbarkeit des Konnektors',
  accessibility_of_the_connector_successful: 'Verbindung zum Konnektor war erfolgreich',
  smcb_availability: 'SMC-B Verfügbarkeit',
  certs_validity: 'Validität der Zertifikate',
  certs_validity_successful: 'Es wurden insgesamt {totalCerts} valide Zertifikate gefunden.',
  certs_validity_failure: 'Es wurden insgesamt {totalCerts} Zertifikate gefunden, davon {notValidCerts} fehlerhaft.',
  accessibility_of_the_idp: 'Erreichbarkeit des {name}',
  accessibility_of_the_idp_result: 'Der IDP mit der URL {url} liefert den Statuscode {statusCode}',
  accessibility_of_the_idp_error: 'Fehler: {message} mit der URL {url}',
  missing_idp_test_case_config_file: 'Fehlende Datei',
  please_put_the_config_file_to: 'Bitte legen Sie die Konfigurationsdatei hier ab: {filePath}',
  license: 'Lizenz',
  vat_number: 'Umsatzsteuer-Identifikationsnummer (USt-ID)',
  warning: 'Achtung',
  selected_file_is_not_compatible_with: 'Ausgewählte Datei {filePath} ist nicht richtig für {fieldName}',
  settings_will_be_saved: 'Einstellungen werden gespeichert!',
  are_you_sure: 'Sind Sie sicher?',
  automatic_updates: 'Automatische Updates',
  check_updates_automatically: 'Updates automatisch durchführen',
  selected_cert_file_is_not_valid: 'Ausgewählte Zertifikatsdatei ist falsch formatiert.',
  mock_version_hint:
    'Nutzen Sie die Mock-Version nicht in der Produktivumgebung, da sonst vertrauliche Informationen geloggt werden. ' +
    'Die Produktiv-Version finden Sie im {url}.',
  proxy_settings: 'Proxy Einstellungen',
  proxy_authentication_type: 'Proxy-Authentifizierung',
  no_proxy_authentication: 'Keine Proxy-Authentifizierung',
  proxy_basic_authentication: 'Basic Authentifizierung',
  proxy_certificate_authentication: 'Zertifikats-Authentifizierung',
  proxy_username: 'Benutzername',
  proxy_password: 'Passwort',
  proxy_client_certificate: 'Client-Zertifikat',
  proxy_ignore_list: 'kein Proxy für:',

  errors: {
    technical_error: 'Technischer Fehler',
    technical_error_code: 'Bitte kontaktieren Sie Ihren Support. Fehlercode ({code})',
    technical_error_details: '{error} \nFehlercode ({code})',
    technical_error_wiki_link: 'Lösungsweg zu diesem Fehlercode',

    [ERROR_CODES.AUTHCL_1105]: {
      title: 'Mehrere {cardType}-Karten gefunden.',
      text: `Bitte stellen Sie sicher, dass nur eine {cardType}-Karte im Kartenterminal gesteckt ist. Fehlercode (${ERROR_CODES.AUTHCL_1105})`,
    },

    [ERROR_CODES.AUTHCL_0008]: {
      title: 'Konfigurationsdatei konnte nicht gespeichert werden!',
      text: 'Bitte stellen Sie sicher, dass das Konfigurationsverzeichnis ({configPath}) existiert und es beschreibbar ist.',
    },

    [ERROR_CODES.AUTHCL_1104]: {
      title: 'Remote PIN-Eingabe für {cardType}-Karte nicht möglich.',
      text: `Fehlercode (${ERROR_CODES.AUTHCL_1104})`, // todo explain how user can fix this problem
    },

    [ERROR_CODES.AUTHCL_1103]: {
      title: 'PIN-Eingabe',
      text: `Entweder ist die {cardType}-Karte gesperrt oder die PIN-Eingabe ist fehlgeschlagen. Fehlercode (${ERROR_CODES.AUTHCL_1103})`, // todo explain how user can fix this problem
    },

    // prompts begin with 2XXX
    [ERROR_CODES.AUTHCL_2001]: {
      title: 'Keine Karte vorgefunden',
      text: 'Bitte {cardType}-Karte in das dafür vorgesehene Kartenterminal stecken',
    },

    [ERROR_CODES.AUTHCL_2002]: {
      title: 'PIN-Eingabe',
      text: 'Bitte PIN für {cardType}-Karte im zugehörigen Kartenterminal eingeben.',
    },

    [ERROR_CODES.AUTHCL_0002]: {
      title: 'Fehler beim Zugriff auf IDP',
      text: `Entweder ist der IDP nicht erreichbar oder die Parameter sind fehlerhaft. Fehlercode: (${ERROR_CODES.AUTHCL_0002})`,
    },
  },
};
