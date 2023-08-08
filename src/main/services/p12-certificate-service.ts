import { P12_VALIDITY_TYPE } from '@/constants';
import fs from 'fs';
const forge = require('node-forge');

export function findValidCertificate(
  p12Path: string,
  password: string,
): {
  certificate: any;
  privateKey: any;
} {
  const p12 = readP12File(p12Path, password);
  const certsAndKeys = getCertsAndKeys(p12);
  const certs = certsAndKeys.certs;
  const keys = certsAndKeys.keys;
  const keyToCert = getValidCertsWithKey(certs, keys).keyToCert;
  return { certificate: certs[0], privateKey: keyToCert };
}

export function getP12ValidityType(p12Path: string, password: string): P12_VALIDITY_TYPE {
  const p12 = readP12File(p12Path, password);
  const certsAndKeys = getCertsAndKeys(p12);
  const certs = certsAndKeys.certs;
  const keys = certsAndKeys.keys;
  const countCerts = certsAndKeys.countCerts;
  const validCertsWithKey = getValidCertsWithKey(certs, keys);
  const keyToCert = validCertsWithKey.keyToCert;
  const countValidCerts = validCertsWithKey.countValidCerts;
  let result: P12_VALIDITY_TYPE;
  const emptyP12 = countCerts == 0; //We don't have any certificate in p12
  const oneValidCertificateInP12 = keyToCert && countCerts == 1; //It exists only one valid certificate with a private key
  const oneInvalidCertificateInP12 = !keyToCert && countCerts == 1; //It exists only one certificate which is invalid
  const validAndInvalidCertificate = keyToCert && countCerts > 1 && countValidCerts == 1; //We have one valid and some invalid certs, we can repair it
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

function checkCertificateValidity(certificate: any): boolean {
  const currentDate = new Date();
  const notAfterDate = certificate.validity.notAfter;
  return notAfterDate > currentDate;
}

function readP12File(p12Path: string, password: string) {
  // Read the p12 file
  const p12File = fs.readFileSync(p12Path, 'binary');
  // Load the PKCS #12 file using forge
  const p12Asn1 = forge.asn1.fromDer(p12File);
  return forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);
}

function getCertsAndKeys(p12: any) {
  //Access to the SafeContents area of the PKCS12 object
  const certs: any[] = [];
  const keys: any[] = [];
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

interface KeyBag {
  attributes: {
    localKeyId: number[];
  };
}

interface Cert {
  attributes: {
    localKeyId: number[];
  };
}

function privateKeyToCert(keys: KeyBag[], cert: Cert): KeyBag | undefined {
  function findMatchingKey(keyBag: KeyBag): boolean {
    if (cert) {
      if (cert.attributes && cert.attributes.localKeyId) {
        if (cert.attributes.localKeyId[0]) {
          return keyBag.attributes.localKeyId[0] === cert.attributes.localKeyId[0];
        }
      }
    }
    return false;
  }

  const foundKey = keys.find(findMatchingKey);

  return foundKey;
}

function getValidCertsWithKey(certs: any[], keys: any[]) {
  let keyToCert = null;
  let countValidCerts = 0;
  for (const cert of certs) {
    const result: KeyBag | undefined = privateKeyToCert(keys, cert);

    if (result) {
      countValidCerts++;
    }
    if (!keyToCert) {
      keyToCert = result;
    }
  }
  return { keyToCert, countValidCerts };
}
