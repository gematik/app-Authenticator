#
# Copyright 2025 gematik GmbH
#
# The Authenticator App is licensed under the European Union Public Licence (EUPL); every use of the Authenticator App
# Sourcecode must be in compliance with the EUPL.
#
# You will find more details about the EUPL here: https://joinup.ec.europa.eu/collection/eupl
#
# Unless required by applicable law or agreed to in writing, software distributed under the EUPL is distributed on an "AS
# IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the EUPL for the specific
# language governing permissions and limitations under the License.ee the Licence for the specific language governing
# permissions and limitations under the Licence.
#
# DISCLAIMER:
# This piece of software is an example to deploy credentials into the local Windows Credential Manager. It is not an
# official part of the Authenticator application. It is rather a helpful tool for administrators to assist the
# credentials distribution in a scaled environment. Hence, the gematik neither does offer support nor will the gematik
# be obliged to update this software.
# However, the gematik is free to do this voluntarily.

# Store credentials in Windows Credential Manager using cmdkey
# https://learn.microsoft.com/de-de/windows-server/administration/windows-commands/cmdkey

################################################################################
#       Choosing the Correct Credential Type
################################################################################

# Target name: 'Gematik_Authenticator/Connector_BasicAuth'
# Username and Password is required

# Target name: 'Gematik_Authenticator/Connector_ClientCert_Password'
# a generic (unused) username is required as well as the password of the pfx file. This is due to the fact, that the
# credential manager interface does not take password-only entries.

# Target name: 'Gematik_Authenticator/Proxy_BasicAuth'
# Username and Password is required

$validTargetNames = @(
"Gematik_Authenticator/Connector_BasicAuth",
"Gematik_Authenticator/Connector_ClientCert_Password",
"Gematik_Authenticator/Proxy_BasicAuth"
)

$targetName = ""

if ($targetName -notin $validTargetNames) {
    write-host "targetName only supports the following values:`n" ($validTargetNames -join "`n")
    return
}

################################################################################
#   Setting Up Credentials According to the Requirements for the Target
################################################################################
$userName = ""
$password = ""


# The following commented-out param command enables the parametrization of this script with a prompt.
# However, this only makes sense, if the script is run locally because the parameters are only usable on runtime.

#param ($userName, $password)


if ([string]::IsNullOrEmpty($userName)) {
    write-host "userName must be defined"
    return
}

if ([string]::IsNullOrEmpty($password)) {
    write-host "password must be defined"
    return
}

# This is the relevant command which is invoked.
$cmdkeyCommand = "cmdkey /generic:$targetName /user:$userName /pass:'$password'"
Invoke-Expression -Command $cmdkeyCommand;
