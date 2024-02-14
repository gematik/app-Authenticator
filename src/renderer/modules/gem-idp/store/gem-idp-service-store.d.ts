import { OAUTH2_ERROR_TYPE, TCallback } from '@/renderer/modules/gem-idp/type-definitions';

export type IOpenIdConfiguration = {
  authorization_endpoint: string;
  auth_pair_endpoint: string;
  sso_endpoint: string;
  uri_pair: string;
  token_endpoint: string;
  third_party_authorization_endpoint: string;
  uri_disc: string;
  issuer: string;
  jwks_uri: string;
  exp: number;
  iat: number;
  uri_puk_idp_enc: string;
  uri_puk_idp_sig: string;
  subject_types_supported: ['pairwise'];
  id_token_signing_alg_values_supported: ['BP256R1'];
  response_types_supported: ['code'];
  scopes_supported: ['openid', 'e-rezept', 'pairing'];
  response_modes_supported: ['query'];
  grant_types_supported: ['authorization_code'];
  acr_values_supported: ['gematik-ehealth-loa-high'];
  token_endpoint_auth_methods_supported: ['none'];
  code_challenge_methods_supported: ['S256'];
  kk_app_list_uri: string;
};

export type IIdpEncJwk = {
  use: string;
  kid: string;
  kty: string;
  crv: string;
  x: string;
  y: string;
};

export type IJweChallenge = {
  protected: string;
  iv: string;
  ciphertext: string;
  tag: string;
};

export type TGemIdpServiceStore = {
  sid?: string;
  jwsHbaSignature?: string;
  jwsSmcbSignature?: string;
  challengePath: string;
  idpHost: string;
  challenge: string;
  userConsent?: {
    requested_scopes: Record<string, string>;
    requested_claims: Record<string, string>;
  };
  jweChallenge: null | IJweChallenge;
  openIdConfiguration?: IOpenIdConfiguration;
  idpEncJwk?: IIdpEncJwk;
  errorShown: boolean;
  caughtAuthFlowError?: {
    errorCode: string;
    errorDescription?: string;
    oauthErrorType?: OAUTH2_ERROR_TYPE;
  };
  clientId: string;

  callback: TCallback | undefined;
  deeplink: string;
};
