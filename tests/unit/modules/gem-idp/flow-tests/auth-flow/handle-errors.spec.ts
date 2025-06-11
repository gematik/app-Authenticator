/*
 * Copyright 2025, gematik GmbH
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

import { shallowMount } from '@vue/test-utils';
import AuthFlow from '@/renderer/modules/gem-idp/event-listeners/AuthFlow.vue';
import { ConnectorError, UserfacingError } from '@/renderer/errors/errors';
import { mockSwal } from '@tests/utils';
import Swal from 'sweetalert2';

describe('AuthFlow handleErrors', () => {
  let wrapper: any;

  beforeEach(() => {
    wrapper = shallowMount(AuthFlow);

    // reset mocks  and spies
    jest.clearAllMocks();
  });

  it('should handle ConnectorError mapped to a user-facing warning', async () => {
    mockSwal(false);
    const error = new ConnectorError('4018', 'Connector error with user-facing warning', 'desc', { info: 'data' });

    await expect(wrapper.vm.handleErrors(error)).rejects.toThrow('Internal Connector Error 4018 ');

    // Already implemented by you:
    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Lösungsweg zu diesem Fehlercode',
      showCancelButton: true,
      text: 'Aktuell verwenden mehrere Anwendungen dieselbe Client-ID und HBA. Zur Problemlösung wird die Neuanlage einer weiteren Client-ID vorgeschlagen. Bitte wenden Sie sich dazu an Ihrem Techniker (DVO oder Administrator). In dringenden Fälle ziehen Sie bitte Ihren HBA und starten den Anmeldeprozess erneut. Beachten Sie bitte, dass eine erneute Pin-Eingabe erforderlich ist. Fehlercode (AUTHCL_1018)',
      title: 'HBA-Smardcard-Sitzung wird bereits verwendet',
    });
  });

  it('should handle ConnectorError mapped to a technical error', async () => {
    mockSwal(false);
    const error = new ConnectorError('4004', 'Connector error technical');

    await expect(wrapper.vm.handleErrors(error)).rejects.toThrow('Internal Connector Error 4004 ');

    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Lösungsweg zu diesem Fehlercode',
      icon: undefined,
      showCancelButton: true,
      text: 'Bitte kontaktieren Sie Ihren Support. Fehlercode (AUTHCL_1004)',
      title: 'Technischer Fehler',
    });
  });

  it('should handle UserfacingError in INTERNAL_FATAL_ERRORS', async () => {
    mockSwal(false);
    const error = new UserfacingError('Internal fatal error', 'description', 'AUTHCL_0003');

    await expect(wrapper.vm.handleErrors(error)).rejects.toThrow('Internal Error AUTHCL_0003 ');

    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Lösungsweg zu diesem Fehlercode',
      icon: undefined,
      showCancelButton: true,
      text: 'Bitte kontaktieren Sie Ihren Support. Fehlercode (AUTHCL_0003)',
      title: 'Technischer Fehler',
    });
  });

  it('should handle UserfacingError in USER_FACING_WARNINGS', async () => {
    mockSwal(false);
    const error = new UserfacingError('User facing warning error', 'description', 'AUTHCL_1101', { some: 'data' });

    await expect(wrapper.vm.handleErrors(error)).rejects.toThrow('Internal Error AUTHCL_1101 ');

    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Lösungsweg zu diesem Fehlercode',
      showCancelButton: true,
      text: 'Bitte stecken Sie die Karte erneut in den Kartenslot Ihres Kartenterminals. Fehlercode (AUTHCL_1101)',
      title: 'Überprüfung des Pin-Status ist fehlgeschlagen',
    });
  });

  it('should do nothing if error does not match any condition', async () => {
    mockSwal(false);
    const genericError = new Error('Generic error');
    await expect(wrapper.vm.handleErrors(genericError)).resolves.toBeUndefined();

    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
