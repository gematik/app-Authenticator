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

import { decodeURLRecursively, parseLauncherArguments, parseUrlFor } from '@/main/services/url-service';

const BASE_CHALLENGE = 'https://idp.example.test/sign_response?client_id=Demo&state=abc&nonce=xyz';

function buildDeeplink(challenge: string): string {
  return 'authenticator://?challenge_path=' + encodeURIComponent(challenge);
}

describe('parseLauncherArguments – legacy deeplinks', () => {
  it('parses a legacy deeplink (no server_port, no handshake_id)', () => {
    const result = parseLauncherArguments(buildDeeplink(BASE_CHALLENGE));
    expect(result).toBeDefined();
    expect(result!.challenge_path).toBe(BASE_CHALLENGE);
    expect(result!.serverMode).toBe(false);
    expect(result!.serverPort).toBeUndefined();
    expect(result!.handshakeId).toBeUndefined();
  });

  it('returns undefined for a totally malformed deeplink', () => {
    // `new URL` throws on this, the function logs and returns undefined.
    const result = parseLauncherArguments('not a url at all');
    expect(result).toBeUndefined();
  });
});

describe('parseLauncherArguments – server_port extraction', () => {
  it('extracts a valid server_port from inside challenge_path', () => {
    const challenge = BASE_CHALLENGE + '&server_port=28800';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverMode).toBe(true);
    expect(result!.serverPort).toBe(28800);
    // server_port stripped from challenge_path
    expect(result!.challenge_path).not.toContain('server_port');
    expect(result!.challenge_path).toContain('client_id=Demo');
  });

  it('treats a port below the privileged range as missing (legacy fallback)', () => {
    const challenge = BASE_CHALLENGE + '&server_port=80';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverMode).toBe(false);
    expect(result!.serverPort).toBeUndefined();
  });

  it('treats a port above 65535 as missing (legacy fallback)', () => {
    const challenge = BASE_CHALLENGE + '&server_port=99999';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverMode).toBe(false);
    expect(result!.serverPort).toBeUndefined();
  });

  it('treats a non-numeric port as missing', () => {
    const challenge = BASE_CHALLENGE + '&server_port=notaport';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverMode).toBe(false);
    expect(result!.serverPort).toBeUndefined();
  });

  it('accepts the lowest valid port (1024)', () => {
    const challenge = BASE_CHALLENGE + '&server_port=1024';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverPort).toBe(1024);
  });

  it('accepts the highest valid port (65535)', () => {
    const challenge = BASE_CHALLENGE + '&server_port=65535';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverPort).toBe(65535);
  });
});

describe('parseLauncherArguments – handshake_id extraction', () => {
  it('extracts handshake_id from inside challenge_path and strips it', () => {
    const id = 'd9f2c1a4-1234-4abc-9def-0123456789ab';
    const challenge = BASE_CHALLENGE + '&server_port=28800&handshake_id=' + id;
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.handshakeId).toBe(id);
    expect(result!.challenge_path).not.toContain('handshake_id');
    expect(result!.challenge_path).not.toContain('server_port');
  });

  it('returns undefined handshake_id when not present', () => {
    const challenge = BASE_CHALLENGE + '&server_port=28800';
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.handshakeId).toBeUndefined();
  });

  it('handles handshake_id without server_port (degraded but not broken)', () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const challenge = BASE_CHALLENGE + '&handshake_id=' + id;
    const result = parseLauncherArguments(buildDeeplink(challenge));
    expect(result!.serverMode).toBe(false);
    expect(result!.handshakeId).toBe(id);
  });
});

describe('parseLauncherArguments – top-level deeplink params (v5-style)', () => {
  it('accepts server_port + handshake_id as top-level deeplink params with no challenge_path', () => {
    const id = 'v5-handshake-id';
    const result = parseLauncherArguments(`authenticator://?server_port=28800&handshake_id=${id}`);
    expect(result!.serverMode).toBe(true);
    expect(result!.serverPort).toBe(28800);
    expect(result!.handshakeId).toBe(id);
    expect(result!.challenge_path).toBe('');
  });

  it('accepts server_port alone at top-level (handshake_id optional)', () => {
    const result = parseLauncherArguments('authenticator://?server_port=28800');
    expect(result!.serverMode).toBe(true);
    expect(result!.serverPort).toBe(28800);
    expect(result!.handshakeId).toBeUndefined();
  });

  it('ignores invalid top-level server_port (out-of-range), falls back to legacy', () => {
    const result = parseLauncherArguments('authenticator://?server_port=80&handshake_id=x');
    expect(result!.serverMode).toBe(false);
    expect(result!.serverPort).toBeUndefined();
  });

  it('prefers top-level server_port over the value embedded in challenge_path', () => {
    const challenge = BASE_CHALLENGE + '&server_port=29999&handshake_id=embedded';
    const link =
      'authenticator://?challenge_path=' + encodeURIComponent(challenge) + '&server_port=28800&handshake_id=toplevel';
    const result = parseLauncherArguments(link);
    expect(result!.serverPort).toBe(28800);
    expect(result!.handshakeId).toBe('toplevel');
  });
});

describe('decodeURLRecursively', () => {
  it('decodes a single layer of URL encoding', () => {
    expect(decodeURLRecursively('hello%20world')).toBe('hello world');
  });

  it('decodes nested encoding (percent-of-percent)', () => {
    // %2520 is the encoded form of %20 — needs two passes to become a space.
    expect(decodeURLRecursively('hello%2520world')).toBe('hello world');
  });

  it('returns the input unchanged when there are no escapes', () => {
    expect(decodeURLRecursively('https://example.test/foo?bar=1')).toBe('https://example.test/foo?bar=1');
  });

  it('does not throw on a malformed escape sequence', () => {
    // Stray `%` not followed by two hex digits — function must return what it has.
    expect(() => decodeURLRecursively('100%done')).not.toThrow();
  });

  it('terminates on pathological inputs (no infinite loop)', () => {
    // Just check it returns within the bounded iteration limit.
    const repeated = '%25'.repeat(20); // many layers of encoded `%`
    const result = decodeURLRecursively(repeated);
    expect(typeof result).toBe('string');
  });
});

describe('parseUrlFor', () => {
  it('extracts the challenge_path value when it is the leading parameter', () => {
    expect(parseUrlFor('challenge_path', '?challenge_path=https%3A%2F%2Ffoo')).toBe('https%3A%2F%2Ffoo');
  });

  it('returns null when the parameter is not the first one', () => {
    expect(parseUrlFor('challenge_path', '?other=1&challenge_path=foo')).toBeNull();
  });

  it('returns null when the search string is empty', () => {
    expect(parseUrlFor('challenge_path', '')).toBeNull();
  });
});
