/*
 * Copyright 2025 gematik GmbH
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

using System;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace WinCertStoreLib
{
    public class Methods
    {
        public async Task<object> GetCertificates(object input)
        {
            string pemCerts = GetCertificatesInPemFormat();
            return await Task.FromResult<object>(pemCerts);
        }

        private string GetCertificatesInPemFormat()
        {
            StringBuilder sb = new StringBuilder();
            var stores = new StoreName[] { StoreName.My, StoreName.Root };

            foreach (var storeName in stores)
            {
                using (X509Store store = new X509Store(storeName, StoreLocation.LocalMachine))
                {
                    store.Open(OpenFlags.ReadOnly);
                    foreach (X509Certificate2 cert in store.Certificates)
                    {
                        sb.AppendLine(ConvertToPem(cert));
                    }
                }
            }

            return sb.ToString();
        }

        private string ConvertToPem(X509Certificate2 cert)
        {
            StringBuilder pem = new StringBuilder();
            pem.AppendLine("-----BEGIN CERTIFICATE-----");
            pem.AppendLine(Convert.ToBase64String(cert.RawData, Base64FormattingOptions.InsertLineBreaks));
            pem.AppendLine("-----END CERTIFICATE-----");
            return pem.ToString();
        }
    }
}
