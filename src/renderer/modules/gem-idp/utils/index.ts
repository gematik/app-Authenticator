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
