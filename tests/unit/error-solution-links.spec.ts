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

import { ERROR_SOLUTION_LINKS, findSolutionLinkByError } from '@/error-solution-links';

describe('Error solution links in Gematik FAQ', () => {
  describe('finds a solution link for an common faced error', () => {
    // Test cases for searching within a specific scope
    describe('with scope', () => {
      it('should return the correct link for a known error message in the KONNEKTOR scope', () => {
        const errorMessage = 'some error with ENOTFOUND';
        const link = findSolutionLinkByError(errorMessage, 'KONNEKTOR');
        expect(link).toBe(ERROR_SOLUTION_LINKS.KONNEKTOR.UNRESOLVABLE_HOST);
      });

      it('should return the correct link for another known error message in the KONNEKTOR scope', () => {
        const errorMessage = 'certificate does not match certificate';
        const link = findSolutionLinkByError(errorMessage, 'KONNEKTOR');
        expect(link).toBe(ERROR_SOLUTION_LINKS.KONNEKTOR.HOSTNAME_CERT_ALTNAME_MISMATCH);
      });

      it('should return undefined for an unknown error message in a specific scope', () => {
        const errorMessage = 'some unknown error';
        const link = findSolutionLinkByError(errorMessage, 'KONNEKTOR');
        expect(link).toBeUndefined();
      });

      it('should return undefined if the error message matches a pattern in a different scope', () => {
        const errorMessage = 'Ihre SMC-B Karte in Slot 1 ist nicht freigeschaltet.';
        const link = findSolutionLinkByError(errorMessage, 'KONNEKTOR');
        expect(link).toBeUndefined();
      });

      it('should return the correct link for a known error message in the IDP scope', () => {
        const errorMessage = 'Error: self signed certificate in certificate chain';
        const link = findSolutionLinkByError(errorMessage, 'IDP');
        expect(link).toBe(ERROR_SOLUTION_LINKS.IDP.SELF_SIGNED_CERTIFICATE);
      });

      it('should return the correct link for a known error message in the HBA scope', () => {
        const errorMessage = 'Hinweis: Es wurde keine HBA im Kartenterminal gefunden.';
        const link = findSolutionLinkByError(errorMessage, 'HBA');
        expect(link).toBe(ERROR_SOLUTION_LINKS.HBA.NO_CARD_FOUND);
      });

      it('should return the correct link for a known error message in the SMCB scope', () => {
        const errorMessage = 'Ihre SMC-B Karte in Slot 1 ist nicht freigeschaltet.';
        const link = findSolutionLinkByError(errorMessage, 'SMCB');
        expect(link).toBe(ERROR_SOLUTION_LINKS.SMCB.NOT_VERIFIED);
      });
    });

    // Test cases for searching across all scopes
    describe('without scope', () => {
      it('should find a solution link by searching all scopes (KONNEKTOR)', () => {
        const errorMessage = 'some error with ENOTFOUND';
        const link = findSolutionLinkByError(errorMessage);
        expect(link).toBe(ERROR_SOLUTION_LINKS.KONNEKTOR.UNRESOLVABLE_HOST);
      });

      it('should find a solution link by searching all scopes (IDP)', () => {
        const errorMessage = 'Error: self signed certificate in certificate chain';
        const link = findSolutionLinkByError(errorMessage);
        expect(link).toBe(ERROR_SOLUTION_LINKS.IDP.SELF_SIGNED_CERTIFICATE);
      });

      it('should return undefined if no match is found in any scope', () => {
        const errorMessage = 'a completely unknown error message';
        const link = findSolutionLinkByError(errorMessage);
        expect(link).toBeUndefined();
      });
    });

    // Test cases for edge cases
    describe('edge cases', () => {
      it('should return undefined for error message "200" and scope "IDP"', () => {
        const errorMessage = '200';
        const link = findSolutionLinkByError(errorMessage, 'IDP');
        expect(link).toBeUndefined();
      });

      it('should return undefined for error message "200" and scope "KONNEKTOR"', () => {
        const errorMessage = '200';
        const link = findSolutionLinkByError(errorMessage, 'KONNEKTOR');
        expect(link).toBeUndefined();
      });

      it('should return undefined for error message "200" and other scopes', () => {
        const errorMessage = '200';
        const link = findSolutionLinkByError(errorMessage, 'HBA');
        expect(link).toBeUndefined();
      });

      it('should return undefined for an empty error message', () => {
        const errorMessage = '';
        const link = findSolutionLinkByError(errorMessage);
        expect(link).toBeUndefined();
      });

      it('should return undefined for an empty error message with a scope', () => {
        const errorMessage = '';
        const link = findSolutionLinkByError(errorMessage, 'KONNEKTOR');
        expect(link).toBeUndefined();
      });
    });
  });
});
