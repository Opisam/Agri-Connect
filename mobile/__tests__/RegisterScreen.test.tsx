import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { RegisterScreen } from '../src/screens/RegisterScreen';

const mockRegister = jest.fn();

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    register: mockRegister,
    logout: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      replace: jest.fn(),
    }),
  };
});

function renderRegisterScreen() {
  return render(<RegisterScreen />);
}

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits a FARMER registration with the entered details', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await renderRegisterScreen();

    await fireEvent.changeText(getByPlaceholderText('e.g. Okello James'), 'Auma Rita');
    await fireEvent.changeText(getByPlaceholderText('e.g. 0772123456'), '0772111222');
    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'auma@example.com');
    await fireEvent.changeText(
      getByPlaceholderText('8 characters, upper & lowercase, digit'),
      'StrongPass1',
    );
    await fireEvent.changeText(getByPlaceholderText('e.g. Lira City'), 'Lira City');
    await fireEvent.changeText(getByPlaceholderText('e.g. Lira'), 'Lira');
    await fireEvent.press(getByText('Create account'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        full_name: 'Auma Rita',
        phone: '0772111222',
        email: 'auma@example.com',
        password: 'StrongPass1',
        role: 'FARMER',
        location: 'Lira City',
        district: 'Lira',
      });
    });
  });

  it('switches the role to BUYER', async () => {
    mockRegister.mockResolvedValue(undefined);
    const { getByText, getByPlaceholderText } = await renderRegisterScreen();

    await fireEvent.press(getByText('I am a Buyer'));
    await fireEvent.changeText(getByPlaceholderText('e.g. Okello James'), 'Auma Rita');
    await fireEvent.changeText(getByPlaceholderText('e.g. 0772123456'), '0772111222');
    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'auma@example.com');
    await fireEvent.changeText(
      getByPlaceholderText('8 characters, upper & lowercase, digit'),
      'StrongPass1',
    );
    await fireEvent.press(getByText('Create account'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'BUYER' }),
      );
    });
  });
});
