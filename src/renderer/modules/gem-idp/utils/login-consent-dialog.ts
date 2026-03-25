/*
 * Copyright 2026, gematik GmbH
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
 *
 * ******
 *
 * For additional notes and disclaimer from gematik and in case of changes by gematik find details in the "Readme" file.
 */
import Swal from 'sweetalert2';

import { alertLoginResultWithIconAndTimer, escapeHTML } from '@/renderer/utils/utils';
import { LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION, REDIRECT_URI_APP_NAME_MAPPING } from '@/constants';
import { ERROR_CODES } from '@/error-codes';
import { OAUTH2_ERROR_TYPE } from '@/renderer/modules/gem-idp/type-definitions';
import { AuthFlowError } from '@/renderer/errors/errors';

const fallbackLoginImage = require('@/assets/lock.png');

/**
 * Renders the HTML body for the login consent dialog.
 * Displays the application name prominently and a single amber hint box
 * that includes the app name and its expected URL.
 */
export function renderLoginConsentHtml(appName: string, appUrl: string, $t: any): string {
  let html = '<div style="text-align: center; padding: 4px 0 0">';

  // Intro text
  html += `<p style="margin: 0 0 16px; font-size: 1em; color: #444">${escapeHTML($t('login_consent_intro'))}</p>`;

  // Application name – prominent, pill-style badge
  html += '<div style="margin: 0 0 20px">';
  html += `<span style="display: inline-block; padding: 8px 24px; font-size: 1.25em; font-weight: 700; color: #1a1a1a; background: #f0f0f0; border-radius: 8px; letter-spacing: 0.02em">${escapeHTML(appName)}</span>`;
  html += '</div>';

  // Security hint – amber box, fully centered
  html +=
    '<div style="background: #fffbeb; border: 1px solid #f5d880; border-radius: 10px; padding: 16px 20px; text-align: center">';
  const rawHint = $t('login_consent_security_hint', { appUrl: '{appUrl}' });
  const [before, after] = rawHint.split('{appUrl}');
  html += `<p style="margin: 0 0 10px; font-size: 0.82em; color: #78640a; line-height: 1.55">${escapeHTML(before).trim()}</p>`;
  html += `<p style="margin: 0 0 10px"><span style="display: inline-block; font-size: 0.85em; font-weight: 700; color: #92600a; background: #fef3c7; padding: 5px 14px; border-radius: 6px; white-space: nowrap">${escapeHTML(appUrl)}</span></p>`;
  html += `<p style="margin: 0 0 6px; font-size: 0.82em; color: #78640a; line-height: 1.55">${escapeHTML(after).trim()}</p>`;
  html += `<p style="margin: 0; font-size: 0.78em; color: #9a7d20; line-height: 1.5; font-style: italic">${escapeHTML($t('login_consent_security_hint_warning'))}</p>`;
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * Extracts the base domain from a full hostname by removing the first subdomain level.
 * e.g. "login.ti-score.de" → "ti-score.de", "ti-score.de" → "ti-score.de"
 * Returns the hostname as-is if it has two or fewer parts.
 */
export function getBaseDomain(origin: string): string {
  if (!origin) return '';
  try {
    const hostname = new URL(origin).hostname;
    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;
    return parts.slice(-2).join('.');
  } catch {
    return origin;
  }
}

/**
 * Tries to fetch the favicon of the given redirect_uri (e.g. https://example.com).
 * Downloads the image and converts it to a data: URL to comply with the
 * Content Security Policy (img-src 'self' data:).
 * Returns a data URL of the favicon if it exists, otherwise returns the fallback image.
 */
export async function fetchFaviconUrl(origin: string): Promise<string> {
  if (!origin) return fallbackLoginImage;

  const faviconUrl = `${origin}/favicon.ico`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(faviconUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return fallbackLoginImage;

    const blob = await response.blob();
    if (!blob.size || !blob.type.startsWith('image/')) return fallbackLoginImage;

    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(fallbackLoginImage);
      reader.readAsDataURL(blob);
    });
  } catch {
    // network error or other issue – use fallback
  }
  return fallbackLoginImage;
}

function getRedirectUri(challengePath: string): string {
  if (!challengePath) return '';
  try {
    const url = new URL(challengePath);
    return url.searchParams.get('redirect_uri') ?? '';
  } catch {
    return '';
  }
}

function getRelyingPartyOrigin(challengePath: string): string {
  const redirectUri = getRedirectUri(challengePath);
  if (!redirectUri) return '';
  try {
    return new URL(redirectUri).origin;
  } catch {
    return '';
  }
}

/**
 * Resolves a human-readable application name and URL for the given redirect_uri
 * using the REDIRECT_URI_APP_NAME_MAPPING from constants.
 * Falls back to 'Unbekannt' for both name and url if no match is found.
 */
export function resolveApplicationName(
  redirectUri: string,
  relyingPartyOrigin: string,
  clientId: string,
): { name: string; url: string } {
  const fallbackName = relyingPartyOrigin ? getBaseDomain(relyingPartyOrigin) : clientId || 'Unbekannt';

  if (!redirectUri) return { name: fallbackName, url: 'Unbekannt' };

  const mapped = REDIRECT_URI_APP_NAME_MAPPING[redirectUri];
  if (mapped) {
    return { name: mapped.name, url: mapped.url };
  }

  return { name: fallbackName, url: 'Unbekannt' };
}

/**
 * Shows a user consent dialog before the actual authentication flow continues.
 * The user must confirm that they want to log in to the given application via the given IdP.
 *
 * @throws AuthFlowError if the user declines
 */
export async function showLoginConsentDialog($store: any, $t: any): Promise<void> {
  const clientId: string = $store.state.idpServiceStore.clientId ?? '';
  const challengePath: string = $store.state.idpServiceStore.challengePath ?? '';
  const redirectUri = getRedirectUri(challengePath);
  const relyingPartyOrigin = getRelyingPartyOrigin(challengePath);

  // Resolve a human-readable application name from the mapping, fall back to base domain / clientId
  const { name: applicationName, url: applicationUrl } = resolveApplicationName(
    redirectUri,
    relyingPartyOrigin,
    clientId,
  );

  // bring the app to the front so the dialog is visible
  window.api.focusToApp();

  // Try to load the favicon of the relying party (calling application), fall back to a generic login image
  const imageUrl = await fetchFaviconUrl(relyingPartyOrigin);

  const result = await Swal.fire({
    title: $t('login_consent_title'),
    html: renderLoginConsentHtml(applicationName, applicationUrl, $t),
    imageUrl,
    imageWidth: 96,
    imageHeight: 96,
    imageAlt: relyingPartyOrigin || $t('login_consent_title'),
    showCancelButton: true,
    confirmButtonText: $t('login_consent_confirm'),
    cancelButtonText: $t('login_consent_decline'),
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    width: '60%',
  });

  if (!result.isConfirmed) {
    await alertLoginResultWithIconAndTimer('error', LOGIN_CANCELLED_BY_USER, SHOW_DIALOG_DURATION);
    throw new AuthFlowError(
      `User declined login consent (${ERROR_CODES.AUTHCL_0011})`,
      '',
      '',
      true,
      OAUTH2_ERROR_TYPE.ACCESS_DENIED,
    );
  }
}
