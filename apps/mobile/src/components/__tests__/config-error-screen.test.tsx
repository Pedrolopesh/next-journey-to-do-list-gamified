import { render } from '@testing-library/react-native';

import RootLayout from '../../app/_layout';

const mockRestoreSession = jest.fn();

jest.mock('@/api/client', () => ({
  configError: true,
  restoreSession: () => mockRestoreSession(),
}));
jest.mock('expo-router', () => ({
  Stack: Object.assign(() => null, { Protected: () => null, Screen: () => null }),
  usePathname: () => '/',
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/features/settings/reminder', () => ({ syncDailyReminder: jest.fn() }));
jest.mock('@/features/offline/use-check-sync', () => ({ useCheckSync: jest.fn() }));
jest.mock('@/components/progression-modal-host', () => ({ ProgressionModalHost: () => null }));
jest.mock('@/components/toast-host', () => ({ ToastHost: () => null }));
jest.mock('@/api/queries', () => ({ useMe: jest.fn() }));

describe('build without an API URL', () => {
  it('explains the problem instead of opening the app, and never tries to restore a session', async () => {
    const { findByText, getByText } = await render(<RootLayout />);
    expect(await findByText('App mal configurado')).toBeTruthy();
    expect(getByText(/sem o endereço do servidor/)).toBeTruthy();
    expect(mockRestoreSession).not.toHaveBeenCalled();
  });
});
