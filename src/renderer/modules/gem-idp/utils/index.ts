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
 */
import { logger } from '@/renderer/service/logger';

/**
 * Send a fetch request with auto-redirects enabled
 * @param url
 */
export async function sendAutoRedirectRequest(url: string): Promise<void> {
  const response = await fetch(url);

  // Throw an error if the response status is not in the 200-399 range
  if (response.status < 200 || response.status >= 400) {
    // Customize the error message
    const error = new Error(
      `HTTP error! Status: ${response.status || 'No Status Code'}. Message: ${response.statusText || 'No Message'}`,
    );
    Object.assign(error, { response });
    logger.error(error);
    throw error;
  }
}

export function logStep(log: string) {
  logger.info('\n### ' + log + ' ###');
}
