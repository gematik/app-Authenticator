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
  log_to_zip: 'Log-Daten als ZIP-Datei exportieren',
  create_zip_file_successful: 'Log-Daten wurden erfolgreich als ZIP-Datei exportiert',
  connector_settings: 'Konnektor-Einstellungen',
  host: 'Host',
  port: 'Port',
  mandant_id: 'Mandant-ID',
  client_id: 'Client-ID',
  info_text_status:
    'Durch diese Option wird die Hardware, wie der Konnektor, das Kartenterminal und die Smartcards simuliert und ist nur für Entwickler und Tester vorgesehen',
  info_text_smcb_certificate:
    'Das Zertifikat, welches für die SMC-B Authentisierung bei der Verbindung zum Fachdienst, mittels IDP-Dienst verwendet wird (Pem-Format)',
  info_text_smcb_private_key:
    'Der private Schlüssel, der zum SMC-B Client-Zertifikat passt und zur Authentisierung bei der Verbindung zum Fachdienst, mittles IDP-Dienst verwendet wird. (Pem-Format)',
  info_text_hba_certificate:
    'Das Zertifikat, welches für die HBA Authentisierung bei der Verbindung zum Fachdienst, mittles IDP-Dienst verwendet wird. (Pem-Format)',
  info_text_hba_private_key:
    'Der private Schlüssel, der zum HBA Client-Zertifikat passt und zur Authentisierung bei der Verbindung zum Fachdienst, mittles IDP-Dienst verwendet wird. (Pem-Format)',
  info_text_host:
    'Die IP-Adresse oder der Hostname des Konnektors, zu dem Sie eine Verbindung herstellen möchten. Zu finden im Installationsblatt der Praxis (z.B. 127.0.0.1).',
  info_text_port: 'Die Portnummer, über die der Konnektor erreichbar ist. Standardmäßig ist dies Port 443 für HTTPS.',
  info_text_mandant_id:
    'Die ID des Infomodels, dass der Konnektor für den Mandanten verwendet. Zu finden in der administrativen Oberfläche des Konnektors oder im Installationsblatt der Praxis.',
  info_text_client_id:
    'Die ID des Infomodels, dass der Konnektor für die Client-ID verwendet.  Zu finden in der administrativen Oberfläche des Konnektors oder im Installationsblatt der Praxis.',
  info_text_work_space_id:
    'Die ID des Infomodels, dass der Konnektor für den Arbeitsplatz verwendet.  Zu finden in der administrativen Oberfläche des Konnektors oder im Installationsblatt der Praxis.',
  info_text_tls_authentication:
    'Die Methode, die zur Authentisierung verwendet wird, um eine sichere Verbindung zum Konnektor aufzubauen. Dies kann beispielsweise "Zertifikat" oder "Benutzername/Passwort" sein.',
  info_text_reject_unauthorized:
    'Diese Option prüft, ob das Serverzertifikat des Konnektors valide ist und ob es in dem Vertrauensbereich des Truststores liegt.',
  info_text_username_con:
    'Der Benutzername, der zur Authentifizierung bei der Verbindung zum Konnektor verwendet wird. Zu finden in der administrativen Oberfläche des Konnektors.',
  info_text_password_con:
    'Das Passwort, welches zur Authentifizierung bei der Verbindung zum Konnektor verwendet wird. Zu finden in der administrativen Oberfläche des Konnektors.',
  info_text_private_key:
    'Der private Schlüssel, der zum Client-Zertifikat passt und zur Authentifizierung bei der Verbindung zum Konnektor verwendet wird. Zu finden in der administrativen Oberfläche des Konnektors.',
  info_text_client_certificate:
    'Das Zertifikat, welches für die Authentifizierung bei der Verbindung zum Konnektor verwendet wird. Zu finden in der administrativen Oberfläche des Konnektors.',
  info_text_proxy_auth_type:
    'Wenn ein Proxy eingesetzt wird und dieser eine Authentisierung vorsieht, dann können die Einstellung dazu hinterlegt werden. Diese können beispielsweise "Basic Authentifizierung" oder "Zertifikats-Authentifizierung" sein.',
  info_text_proxy_username:
    'Der Benutzername, der zur Authentisierung bei einem Proxy verwendet wird. Zu finden in dem Infoblatt der Praxis oder Fragen Sie ihren Administrator.',
  info_text_proxy_password:
    'Das Passwort, welches zur Authentisierung bei einem Proxy verwendet wird. Zu finden in dem Infoblatt der Praxis oder Fragen Sie ihren Administrator.',
  info_text_proxy_client_certificate:
    'Das Zertifikat, welches für die zertifaktsbasierte Authentisierung bei einem Proxy verwendet wird. (Pem-Format)',
  info_text_proxy_ignore_list:
    'Per Default laufen alle IP-Adressen über die Windows-Standarteinstellungen der Proxies. Mit dieser Option kann man einstellen, dass bestimmte Adressen nicht über den Standart-Proxy laufen. (Trennzeichen: ";").',
  info_text_check_updates_automatically:
    'Ist diese Option "Aktiviert", dann prüft der Authenticator regelmäßig , ob es Updates gibt und führt diese eigenständig durch',
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
  select_smcb_header: 'Bitte wählen Sie eine SMC-B aus:',
  select_smcb: '( Es befinden sich mehrere SMC-Bs in den verbundenen Kartenterminals )',
  readability_test_Multi_SMCBs: 'Mehrere SMC-Bs im Karten-Terminal gefunden',
  value_is_not_valid: 'Wert ist nicht gültig!',
  errors: {
    technical_error: 'Technischer Fehler',
    technical_error_code: 'Bitte kontaktieren Sie Ihren Support. Fehlercode ({code})',
    technical_error_details: '{error} \nFehlercode ({code})',
    technical_error_wiki_link: 'Lösungsweg zu diesem Fehlercode',

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

    [ERROR_CODES.AUTHCL_1120]: {
      title: 'Transport-Pin',
      text: `Sie haben Ihre {cardType}-Karte noch nicht entsperrt. Aktivieren Sie zunächst Ihre {cardType}-Karte mit Hilfe Ihres Praxis- bzw. Krankenhausinformationssystems in dem Sie die Transport-PIN Ihres Ausweises in einen selbstgewählten PIN umwandeln. Fehlercode (${ERROR_CODES.AUTHCL_1120})`, // todo explain how user can fix this problem
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
