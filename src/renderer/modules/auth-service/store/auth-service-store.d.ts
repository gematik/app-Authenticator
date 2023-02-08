export type IAuthServiceStore = {
  sid?: string;
  jwsHbaSignature?: string;
  jwsSmcbSignature?: string;
  challengePath: string;
  challenge: string;
  authRequestPath?: string;
};
