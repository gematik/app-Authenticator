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

/**
 * @jest-environment jsdom
 */
import { MockJwsSignature } from '@/renderer/modules/connector/connector-mock/jws-jose-tools/mock-jws-signature';
import { ECardTypes } from '@/renderer/modules/connector/ECardTypes';
import { MockCIdpJWSOptions } from '@/renderer/modules/connector/connector-mock/jws-jose-tools/jws-tool-helper';
import { setSampleData } from '@tests/utils/config-sample-data';
import { MOCK_CONNECTOR_CERTS_CONFIG } from '@/renderer/modules/connector/connector-mock/mock-config';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import {
  BP256Curve,
  readECPrivateKey,
  scalarMult,
  signMessage,
  verifySignature,
} from '@/renderer/modules/connector/connector-mock/jws-jose-tools/sign-bp-256';

jest.spyOn(FileStorageRepository as any, 'saveToCm').mockReturnValue(true);

describe('bp256-jws', () => {
  const EXAMPLE_CHALLENGE =
    'eyJhbGciOiJCUDI1NlIxIiwidHlwIjoiSldUIiwia2lkIjoicHVrX2lkcF9zaWcifQ.eyJpc3MiOiJodHRwczovL2lkcC5kZXYuZ2VtYXRpay5zb2x1dGlvbnMiLCJyZXNwb25zZV90eXBlIjoiY29kZSIsInNuYyI6IkEzdmRFQ1QyUWZqNDJuRzNDd1ZOcjd5NmhEUXIwOFlKemh5Nm5SRUZnQlEiLCJjb2RlX2NoYWxsZW5nZV9tZXRob2QiOiJTMjU2IiwidG9rZW5fdHlwZSI6ImNoYWxsZW5nZSIsIm5vbmNlIjoibWl4UVdUTjAwSm9uQzZoNiIsImNsaWVudF9pZCI6IkF1dGhlbnRpY2F0b3JEZXZSZW1vdGUiLCJzY29wZSI6Im9wZW5pZCBnZW0tYXV0aCIsInN0YXRlIjoiQmNsbTdFaVFUNTE1dzJScyIsInJlZGlyZWN0X3VyaSI6Imh0dHBzOi8vYXV0aGVudGljYXRvci5leGFtcGxlLmFwcC5kZXYuZ2VtYXRpay5zb2x1dGlvbnMvY2FsbGJhY2siLCJleHAiOjE3MTk1Nzk0ODcsImlhdCI6MTcxOTU3OTMwNywiY29kZV9jaGFsbGVuZ2UiOiJQWi1ham1PTDNTdk9fbVZmejR1dkRnbGVORlBncDdKajY2dUlfbXZSS0RjIiwianRpIjoiYjNkZmE5MmRjOGFkNWJhZiJ9.kugXOzUuMuvG9ScuyiOTUiSR7_UyLOE_s3Nkhrrq2BaVDwMpD-fCbomMvbRHxTMzCxJfpsoqH4XIiFI63JteZg';
  it('check the header and payload parts', async function () {
    setSampleData({
      [MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY]: process.cwd() + '/tests/resources/certs/example/bp256/bp256.key',
      [MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT]: process.cwd() + '/tests/resources/certs/example/bp256/bp256.cer',
    });

    const jwsHelper = new MockCIdpJWSOptions(ECardTypes.HBA, EXAMPLE_CHALLENGE);
    const mockJwsSignature = new MockJwsSignature(ECardTypes.HBA);
    const isEccCert = mockJwsSignature.isEccCert(mockJwsSignature.getPrivateKey());
    const jwsSignature = await mockJwsSignature.createJws(
      isEccCert,
      jwsHelper.getPayload(),
      jwsHelper.getProtectedHeader(isEccCert),
    );

    // test the first 2 part of the JWS
    const jwsParts = jwsSignature.split('.');
    console.log('custom jwsParts', jwsParts);
    expect(jwsParts.length).toBe(3);
    expect(jwsParts[0]).toBe(
      'eyJ4NWMiOlsiTUlJRG9EQ0NBMGVnQXdJQkFnSUhBNHFSNDNXdHlUQUtCZ2dxaGtqT1BRUURBakNCaVRFTE1Ba0dBMVVFQmhNQ1JFVXhIekFkQmdOVkJBb01GbWRsYldGMGFXc2dSMjFpU0NCT1QxUXRWa0ZNU1VReE9EQTJCZ05WQkFzTUwwaGxhV3hpWlhKMVpuTmhkWE4zWldsekxVTkJJR1JsY2lCVVpXeGxiV0YwYVd0cGJtWnlZWE4wY25WcmRIVnlNUjh3SFFZRFZRUUREQlpIUlUwdVNFSkJMVU5CTlRFZ1ZFVlRWQzFQVGt4Wk1CNFhEVEkwTURVeE5ESXlNREF3TUZvWERUSTVNRFV4TkRJeE5UazFPVm93ZXpFTE1Ba0dBMVVFQmhNQ1JFVXhiREFPQmdOVkJDb01CMGhsY20xcGJtVXdFUVlEVlFRRURBcEJkV0psY25ScGJzT3pNQjRHQTFVRUJSTVhNVFl1T0RBeU56WTRPRE14TVRBd01EQXdPVE0wTkRBd0p3WURWUVFERENCRWNpNGdTR1Z5YldsdVpTQkJkV0psY25ScGJzT3pJRlJGVTFRdFQwNU1XVEJhTUJRR0J5cUdTTTQ5QWdFR0NTc2tBd01DQ0FFQkJ3TkNBQVIwUWpieVo4SWF2Y1U2TkhMNXJjQURzYXNXbm82SFFya1VtZjg0YnFkYkt3dUpGcWpzaFdXakF0M2VUTXMxcmFocW1CRGlYUUxDQ1ZUbDRueXR0bVJJbzRJQnBEQ0NBYUF3Y1FZRFZSMGdCR293YURBSkJnY3FnaFFBVEFSTE1Bd0dDaXNHQVFRQmdzMHpBUUV3VFFZSUtvSVVBRXdFZ1JFd1FUQS9CZ2dyQmdFRkJRY0NBUll6YUhSMGNEb3ZMM2QzZHk1bExXRnllblJoZFhOM1pXbHpMbVJsTDNCdmJHbGphV1Z6TDBWRlgzQnZiR2xqZVM1b2RHMXNNRHNHQ0NzR0FRVUZCd0VCQkM4d0xUQXJCZ2dyQmdFRkJRY3dBWVlmYUhSMGNEb3ZMMlZvWTJFdVoyVnRZWFJwYXk1a1pTOWxZMk10YjJOemNEQU9CZ05WSFE4QkFmOEVCQU1DQTRnd0RBWURWUjBUQVFIL0JBSXdBREFkQmdOVkhTVUVGakFVQmdnckJnRUZCUWNEQWdZSUt3WUJCUVVIQXdRd0hRWURWUjBPQkJZRUZMQnppQ1V5Zmd3ZEVaMjN6WmozUTdKcXFMS2ZNQjhHQTFVZEl3UVlNQmFBRkEwL3NKNlFnaUhCVjRMWGo4dUpBN1JWS2swZk1IRUdCU3NrQ0FNREJHZ3dacVFrTUNJeEN6QUpCZ05WQkFZVEFrUkZNUk13RVFZRFZRUUtEQXJEaEVzZ1FtVnliR2x1TUQ0d1BEQTZNRGd3RGd3TXc0UnllblJwYmk5QmNucDBNQWtHQnlxQ0ZBQk1CQjRUR3pFdE1TMUJVbHBVTFVobGNtMXBibVZCZFdKbGNuUnBibTh3TVRBS0JnZ3Foa2pPUFFRREFnTkhBREJFQWlCVTVGME5rYjE5Y1FFZWdORjVHeFlMMkZvRHFBbU1ObkJ2a0JuN0IxKzJKQUlnTnRLdWozS3gvVEZIWTc4L1VPYlYzRlR6bkdoM2lnOHoyU2pUdjQ1aHdNaz0iXSwidHlwIjoiSldUIiwiY3R5IjoiTkpXVCIsImFsZyI6IkJQMjU2UjEifQ',
    );
    expect(jwsParts[1]).toBe(
      'eyJuand0IjoiZXlKaGJHY2lPaUpDVURJMU5sSXhJaXdpZEhsd0lqb2lTbGRVSWl3aWEybGtJam9pY0hWclgybGtjRjl6YVdjaWZRLmV5SnBjM01pT2lKb2RIUndjem92TDJsa2NDNWtaWFl1WjJWdFlYUnBheTV6YjJ4MWRHbHZibk1pTENKeVpYTndiMjV6WlY5MGVYQmxJam9pWTI5a1pTSXNJbk51WXlJNklrRXpkbVJGUTFReVVXWnFOREp1UnpORGQxWk9jamQ1Tm1oRVVYSXdPRmxLZW1oNU5tNVNSVVpuUWxFaUxDSmpiMlJsWDJOb1lXeHNaVzVuWlY5dFpYUm9iMlFpT2lKVE1qVTJJaXdpZEc5clpXNWZkSGx3WlNJNkltTm9ZV3hzWlc1blpTSXNJbTV2Ym1ObElqb2liV2w0VVZkVVRqQXdTbTl1UXpab05pSXNJbU5zYVdWdWRGOXBaQ0k2SWtGMWRHaGxiblJwWTJGMGIzSkVaWFpTWlcxdmRHVWlMQ0p6WTI5d1pTSTZJbTl3Wlc1cFpDQm5aVzB0WVhWMGFDSXNJbk4wWVhSbElqb2lRbU5zYlRkRmFWRlVOVEUxZHpKU2N5SXNJbkpsWkdseVpXTjBYM1Z5YVNJNkltaDBkSEJ6T2k4dllYVjBhR1Z1ZEdsallYUnZjaTVsZUdGdGNHeGxMbUZ3Y0M1a1pYWXVaMlZ0WVhScGF5NXpiMngxZEdsdmJuTXZZMkZzYkdKaFkyc2lMQ0psZUhBaU9qRTNNVGsxTnprME9EY3NJbWxoZENJNk1UY3hPVFUzT1RNd055d2lZMjlrWlY5amFHRnNiR1Z1WjJVaU9pSlFXaTFoYW0xUFRETlRkazlmYlZabWVqUjFka1JuYkdWT1JsQm5jRGRLYWpZMmRVbGZiWFpTUzBSaklpd2lhblJwSWpvaVlqTmtabUU1TW1Sak9HRmtOV0poWmlKOS5rdWdYT3pVdU11dkc5U2N1eWlPVFVpU1I3X1V5TE9FX3MzTmtocnJxMkJhVkR3TXBELWZDYm9tTXZiUkh4VE16Q3hKZnBzb3FINFhJaUZJNjNKdGVaZyJ9',
    );
  });

  it('verify bp256 signature', async function () {
    setSampleData({
      [MOCK_CONNECTOR_CERTS_CONFIG.HBA_KEY]: process.cwd() + '/tests/resources/certs/example/bp256/bp256.key',
      [MOCK_CONNECTOR_CERTS_CONFIG.HBA_CERT]: process.cwd() + '/tests/resources/certs/example/bp256/bp256.cer',
    });

    const jwsHelper = new MockCIdpJWSOptions(ECardTypes.HBA, EXAMPLE_CHALLENGE);
    const mockJwsSignature = new MockJwsSignature(ECardTypes.HBA);
    const privateKey = mockJwsSignature.getPrivateKey();
    const isEccCert = mockJwsSignature.isEccCert(privateKey);
    const jwsSignature = await mockJwsSignature.createJws(
      isEccCert,
      jwsHelper.getPayload(),
      jwsHelper.getProtectedHeader(isEccCert),
    );

    // verify signature
    const jwsParts = jwsSignature.split('.');
    const signingInput = `${jwsParts[0]}.${jwsParts[1]}`;
    const privKeyBigInt = readECPrivateKey(privateKey);

    const signature = signMessage(privKeyBigInt, signingInput);
    const myPublicKey = scalarMult(privKeyBigInt, { x: BP256Curve.gx, y: BP256Curve.gy, z: 0n });
    expect(verifySignature(myPublicKey, signingInput, signature)).toBeTruthy();
  });
});
