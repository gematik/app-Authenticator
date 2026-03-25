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

import {
  getBaseDomain,
  resolveApplicationName,
  renderLoginConsentHtml,
  fetchFaviconUrl,
} from '@/renderer/modules/gem-idp/utils/login-consent-dialog';
import { REDIRECT_URI_APP_NAME_MAPPING } from '@/constants';

// Simple $t mock that returns the key or interpolates {appUrl}
const $t = (key: string, params?: Record<string, string>): string => {
  const translations: Record<string, string> = {
    login_consent_intro: 'Sie möchten sich für folgende Anwendung anmelden:',
    login_consent_security_hint:
      'Bitte stellen Sie sicher, dass Sie die Anmeldung selbst über {appUrl} gestartet haben und die URL nicht von Dritten erhalten haben.',
    login_consent_security_hint_warning: 'Falls Sie unsicher sind, brechen Sie den Vorgang ab.',
  };
  let text = translations[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
};

describe('login-consent-dialog', () => {
  // ── getBaseDomain ──────────────────────────────────────────────────────

  describe('getBaseDomain', () => {
    it('extracts base domain from a URL with subdomain', () => {
      expect(getBaseDomain('https://login.ti-score.de')).toBe('ti-score.de');
    });

    it('returns the hostname as-is when there are only two parts', () => {
      expect(getBaseDomain('https://ti-score.de')).toBe('ti-score.de');
    });

    it('handles deeper subdomains', () => {
      expect(getBaseDomain('https://a.b.c.example.com')).toBe('example.com');
    });

    it('returns empty string for empty input', () => {
      expect(getBaseDomain('')).toBe('');
    });

    it('returns the original string for an invalid URL', () => {
      expect(getBaseDomain('not-a-url')).toBe('not-a-url');
    });

    it('handles URL with port', () => {
      expect(getBaseDomain('https://login.ti-score.de:8443')).toBe('ti-score.de');
    });

    it('handles URL with path', () => {
      expect(getBaseDomain('https://sub.domain.org/some/path')).toBe('domain.org');
    });
  });

  // ── resolveApplicationName ─────────────────────────────────────────────

  describe('resolveApplicationName', () => {
    it('returns the mapped name and url for a known redirect_uri', () => {
      const redirectUri = 'https://www.ti-score.de/authenticate/redirect';
      const result = resolveApplicationName(redirectUri, 'https://www.ti-score.de', 'some-client-id');
      expect(result.name).toBe('TI Score');
      expect(result.url).toBe('ti-score.de');
    });

    it('returns all known mappings correctly', () => {
      for (const [uri, expected] of Object.entries(REDIRECT_URI_APP_NAME_MAPPING)) {
        const result = resolveApplicationName(uri, 'https://example.com', 'client');
        expect(result.name).toBe(expected.name);
        expect(result.url).toBe(expected.url);
      }
    });

    it('falls back to base domain when redirect_uri is not in the mapping', () => {
      const result = resolveApplicationName(
        'https://unknown.example.com/callback',
        'https://login.example.com',
        'my-client-id',
      );
      expect(result.name).toBe('example.com');
      expect(result.url).toBe('Unbekannt');
    });

    it('falls back to clientId when no relyingPartyOrigin is available', () => {
      const result = resolveApplicationName('https://unknown.example.com/callback', '', 'my-client-id');
      expect(result.name).toBe('my-client-id');
      expect(result.url).toBe('Unbekannt');
    });

    it('falls back to "Unbekannt" when nothing is available', () => {
      const result = resolveApplicationName('', '', '');
      expect(result.name).toBe('Unbekannt');
      expect(result.url).toBe('Unbekannt');
    });

    it('falls back to "Unbekannt" when redirectUri is empty', () => {
      const result = resolveApplicationName('', 'https://some.origin.de', 'client');
      expect(result.name).toBe('origin.de');
      expect(result.url).toBe('Unbekannt');
    });
  });

  // ── renderLoginConsentHtml ─────────────────────────────────────────────

  describe('renderLoginConsentHtml', () => {
    it('contains the application name', () => {
      const html = renderLoginConsentHtml('TI Score', 'https://example.com', $t);
      expect(html).toContain('TI Score');
    });

    it('contains the application URL', () => {
      const html = renderLoginConsentHtml('TI Score', 'https://example.com', $t);
      expect(html).toContain('https://example.com');
    });

    it('contains the intro text', () => {
      const html = renderLoginConsentHtml('Test App', 'https://test.de', $t);
      expect(html).toContain('Sie möchten sich für folgende Anwendung anmelden:');
    });

    it('contains the security warning text', () => {
      const html = renderLoginConsentHtml('Test App', 'https://test.de', $t);
      expect(html).toContain('Falls Sie unsicher sind, brechen Sie den Vorgang ab.');
    });

    it('contains the hint text parts (before and after appUrl)', () => {
      const html = renderLoginConsentHtml('Test App', 'https://test.de', $t);
      expect(html).toContain('Bitte stellen Sie sicher, dass Sie die Anmeldung selbst über');
      expect(html).toContain('gestartet haben und die URL nicht von Dritten erhalten haben.');
    });

    it('escapes HTML entities in the application name', () => {
      const html = renderLoginConsentHtml('<script>alert("xss")</script>', 'https://evil.com', $t);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('escapes HTML entities in the URL', () => {
      const html = renderLoginConsentHtml('App', 'https://evil.com/<img onerror=alert(1)>', $t);
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });

    it('renders the URL inside a nowrap span for non-breaking display', () => {
      const html = renderLoginConsentHtml('App', 'https://example.com', $t);
      expect(html).toContain('white-space: nowrap');
    });
  });

  // ── fetchFaviconUrl ────────────────────────────────────────────────────

  describe('fetchFaviconUrl', () => {
    // The fallback image is require('@/assets/lock.png') which jest-transform-stub
    // turns into a stub value (not a real string). We capture it for comparison.
    let fallbackImage: unknown;

    beforeAll(async () => {
      fallbackImage = await fetchFaviconUrl('');
    });

    it('returns fallback image for empty origin', async () => {
      const result = await fetchFaviconUrl('');
      expect(result).toBe(fallbackImage);
    });

    it('returns fallback image when fetch fails (network error)', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await fetchFaviconUrl('https://unreachable.example.com');
      expect(result).toBe(fallbackImage);

      global.fetch = originalFetch;
    });

    it('returns fallback image when fetch returns non-ok response', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      const result = await fetchFaviconUrl('https://no-favicon.example.com');
      expect(result).toBe(fallbackImage);

      global.fetch = originalFetch;
    });

    it('returns fallback image when response blob is empty', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({ size: 0, type: 'image/x-icon' }),
      });

      const result = await fetchFaviconUrl('https://empty-favicon.example.com');
      expect(result).toBe(fallbackImage);

      global.fetch = originalFetch;
    });

    it('returns fallback image when blob is not an image type', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: jest.fn().mockResolvedValue({ size: 100, type: 'text/html' }),
      });

      const result = await fetchFaviconUrl('https://wrong-type.example.com');
      expect(result).toBe(fallbackImage);

      global.fetch = originalFetch;
    });
  });
});
