import { mount } from '@vue/test-utils';
import store from '@/renderer/store';
import i18n from '@/renderer/i18n';
import Swal from 'sweetalert2';
import OpenSettings from '@/renderer/modules/home/components/OpenSettings.vue';
import { FileStorageRepository } from '@/renderer/modules/settings/repository';
import router from '@/renderer/router';

const fileStorageRepository = new FileStorageRepository();
jest.mock('@/renderer/modules/settings/useSettings.ts', () => ({
  useSettings: () => {
    return fileStorageRepository;
  },
}));
jest.spyOn(FileStorageRepository, 'isCentralConfigurationInvalid', 'get').mockReturnValue(true);
jest.spyOn(FileStorageRepository, 'isNewInstallation', 'get').mockReturnValue(true);

describe('home screen -> open settings', () => {
  it('shows a warning if trying to start the configuration assistant from home screen with faulty central config', async function () {
    const wrapper = mount(OpenSettings, {
      global: {
        plugins: [store, i18n, router],
      },
    });

    jest
      .spyOn(Swal, 'fire')
      .mockResolvedValue({ isConfirmed: false, value: '454325', isDenied: false, isDismissed: false });

    const vm = wrapper.vm as unknown as { startConfigAssistant: () => Promise<void> };

    await vm.startConfigAssistant();

    expect(Swal.fire).toHaveBeenCalledWith({
      cancelButtonText: 'Abbrechen',
      confirmButtonText: 'Trotzdem starten',
      icon: 'warning',
      showCancelButton: true,
      text: 'Es wurde eine Remote Umgebung ohne gültigen AUTHCONFIGPATH erkannt.\nÄnderungen durch den Konfigurationsassistenten werden lokal gespeichert!\nBitte Konfiguration prüfen.',
      title: 'Remote Umgebung erkannt!',
    });
  });
});
