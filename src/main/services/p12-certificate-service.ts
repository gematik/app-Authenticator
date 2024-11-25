import { P12_VALIDITY_TYPE } from '@/constants';
import fs from 'fs';
import forge from 'node-forge';

interface P12Certificate {
  validity: {
    notBefore: Date;
    notAfter: Date;
  };
  attributes: {
    localKeyId: number[];
  };
  certificateData: string;
  issuer: string;
  subject: string;
  serialNumber: string;
  cert: string;
}

interface KeyBag {
  attributes: {
    localKeyId: number[];
  };
  key: string;
}

interface CertsAndKeys {
  certs: P12Certificate[];
  keys: KeyBag[];
  countCerts: number;
}

interface ValidCertsWithKey {
  certToKey: P12Certificate | null;
  keyToCert: KeyBag | null;
  countValidCerts: number;
}

export function findValidCertificate(
  p12Path: string,
  password: string,
): {
  certificate: P12Certificate | null;
  privateKey: KeyBag | null | undefined;
} {
  const p12 = readP12File(p12Path, password);
  const certsAndKeys = getCertsAndKeys(p12);
  const { certs, keys } = certsAndKeys;
  const result = getValidCertsWithKey(certs, keys);
  return { certificate: result.certToKey, privateKey: result.keyToCert };
}

export function getP12ValidityType(p12Path: string, password: string): P12_VALIDITY_TYPE {
  const p12 = readP12File(p12Path, password);
  const certsAndKeys = getCertsAndKeys(p12);
  const { certs, keys, countCerts } = certsAndKeys;
  const validCertsWithKey = getValidCertsWithKey(certs, keys);
  const { keyToCert, countValidCerts } = validCertsWithKey;

  let result: P12_VALIDITY_TYPE;
  const emptyP12 = countCerts === 0; // We don't have any certificate in p12
  const oneValidCertificateInP12 = keyToCert && countCerts === 1; // It exists only one valid certificate with a private key
  const oneInvalidCertificateInP12 = !keyToCert && countCerts === 1; // It exists only one certificate which is invalid
  const validAndInvalidCertificate = keyToCert && countCerts > 1 && countValidCerts === 1; // We have one valid and some invalid certs, we can repair it

  if (emptyP12) {
    result = P12_VALIDITY_TYPE.NO_CERT_FOUND;
  } else if (oneValidCertificateInP12) {
    result = P12_VALIDITY_TYPE.VALID;
  } else if (oneInvalidCertificateInP12) {
    result = P12_VALIDITY_TYPE.INVALID_CERTIFICATE;
  } else if (validAndInvalidCertificate) {
    result = P12_VALIDITY_TYPE.ONE_VALID_AND_INVALID_CERTIFICATES;
  } else {
    result = P12_VALIDITY_TYPE.TOO_MANY_CERTIFICATES;
  }
  return result;
}

function checkCertificateValidity(certificate: P12Certificate): boolean {
  const currentDate = new Date();
  const notAfterDate = certificate.validity.notAfter;
  return notAfterDate > currentDate;
}

function readP12File(p12Path: string, password: string): any {
  // Read the p12 file
  const p12File = fs.readFileSync(p12Path, 'binary');
  // Load the PKCS #12 file using forge
  const p12Asn1 = forge.asn1.fromDer(p12File);
  return forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
}

function getCertsAndKeys(p12: any): CertsAndKeys {
  // Access to the SafeContents area of the PKCS12 object
  const certs: P12Certificate[] = [];
  const keys: KeyBag[] = [];
  let countCerts = 0;

  if (p12.safeContents) {
    for (const safeContent of p12.safeContents) {
      if (safeContent.safeBags) {
        for (const bag of safeContent.safeBags) {
          if (bag.type === forge.pki.oids.certBag) {
            countCerts++;
            if (bag.cert && checkCertificateValidity(bag.cert)) {
              certs.push(bag);
            }
          } else if (bag.type === forge.pki.oids.pkcs8ShroudedKeyBag && bag.key) {
            keys.push(bag);
          }
        }
      }
    }
  }
  return { keys, certs, countCerts };
}

function privateKeyToCert(keys: KeyBag[], cert: P12Certificate): KeyBag | undefined {
  return keys.find((keyBag) => keyBag?.attributes?.localKeyId?.[0] === cert?.attributes?.localKeyId?.[0]);
}

function getValidCertsWithKey(certs: P12Certificate[], keys: KeyBag[]): ValidCertsWithKey {
  let certToKey: P12Certificate | undefined;
  let keyToCert: KeyBag | undefined;
  let countValidCerts = 0;

  for (const cert of certs) {
    const result = privateKeyToCert(keys, cert);

    if (result) {
      countValidCerts++;
      if (!keyToCert) {
        keyToCert = result;
        certToKey = cert;
      }
    }
  }

  return {
    certToKey: certToKey ?? null,
    keyToCert: keyToCert ?? null,
    countValidCerts,
  };
}
