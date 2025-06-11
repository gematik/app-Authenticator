/*
 * Copyright 2025, gematik GmbH
 *
 * Licensed under the EUPL, Version 1.2 or - as soon they will be approved by the
 * European Commission – subsequent versions of the EUPL (the "Licence").
 * You may not use this work except in compliance with the Licence.
 *
 * You find a copy of the Licence in the "Licence" file or at
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the Licence is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either expressed or implied.
 * In case of changes by gematik find details in the "Readme" file.
 *
 * See the Licence for the specific language governing permissions and limitations under the Licence.

 *******

 For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */

using System;
using System.Runtime.InteropServices;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Win32;

namespace WinCertStoreLib
{
    public class Methods
    {
        public async Task<object> GetCertificates(object input)
        {
            string pemCerts = RetrieveCertificatesInPemFormat();
            return await Task.FromResult<object>(pemCerts);
        }

        public async Task<object> GetKeyFromRegistry(object input)
        {
            string key = input.ToString();
            string registryValue = RetrieveKeyFromRegistry(key);
            return await Task.FromResult<object>(registryValue);
        }

        public async Task<object> GetCurrentSessionId(object input)
        {
            string sessionId = RetrieveCurrentSessionId();
            return await Task.FromResult<object>(sessionId);
        }

        // Retrieves certificates in PEM format from specified certificate stores.
        private string RetrieveCertificatesInPemFormat()
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
                        sb.AppendLine(FormatCertificateToPem(cert));
                    }
                }
            }
            return sb.ToString();
        }

        // Converts a certificate to PEM format.
        private string FormatCertificateToPem(X509Certificate2 cert)
        {
            StringBuilder pem = new StringBuilder();
            pem.AppendLine("-----BEGIN CERTIFICATE-----");
            pem.AppendLine(Convert.ToBase64String(cert.RawData, Base64FormattingOptions.InsertLineBreaks));
            pem.AppendLine("-----END CERTIFICATE-----");
            return pem.ToString();
        }

        // Retrieves registry key values from the given registry path.
        private string RetrieveKeyFromRegistry(string fullRegistryPath)
        {
            try
            {
                // Split the registry path into hive and subkey.
                string[] pathParts = fullRegistryPath.Split(new[] { '\\' }, 2);
                if (pathParts.Length < 2)
                {
                    Console.WriteLine("Invalid registry path: " + fullRegistryPath);
                    return null;
                }

                string hive = pathParts[0];
                string subKeyPath = pathParts[1];

                // Open the corresponding hive.
                RegistryKey baseKey = RetrieveRegistryHive(hive);
                if (baseKey == null)
                {
                    Console.WriteLine("Unknown registry hive: " + hive);
                    return null;
                }

                using (RegistryKey key = baseKey.OpenSubKey(subKeyPath))
                {
                    if (key != null)
                    {
                        // Read all values from the key.
                        StringBuilder result = new StringBuilder();
                        foreach (string valueName in key.GetValueNames())
                        {
                            object value = key.GetValue(valueName);
                            result.AppendLine($"{valueName}: {value}");
                        }
                        return result.ToString();
                    }
                    else
                    {
                        return null;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"An error occurred: {ex.Message}");
                return null;
            }
        }

        // Retrieves the current session ID using the process ID.
        private string RetrieveCurrentSessionId()
        {
            int processId = GetCurrentProcessId();

            if (ProcessIdToSessionId(processId, out int sessionId))
            {
                return sessionId.ToString();
            }
            else
            {
                throw new Exception("Error retrieving current session id!");
            }
        }

        [DllImport("kernel32.dll")]
        private static extern int GetCurrentProcessId();

        [DllImport("kernel32.dll")]
        private static extern bool ProcessIdToSessionId(int processId, out int sessionId);

        // Retrieves the registry hive based on the provided string.
        private RegistryKey RetrieveRegistryHive(string hive)
        {
            switch (hive.ToUpper())
            {
                case "HKEY_LOCAL_MACHINE":
                    return Registry.LocalMachine;
                case "HKEY_CURRENT_USER":
                    return Registry.CurrentUser;
                case "HKEY_CLASSES_ROOT":
                    return Registry.ClassesRoot;
                case "HKEY_USERS":
                    return Registry.Users;
                case "HKEY_CURRENT_CONFIG":
                    return Registry.CurrentConfig;
                default:
                    return null;
            }
        }
    }
}

