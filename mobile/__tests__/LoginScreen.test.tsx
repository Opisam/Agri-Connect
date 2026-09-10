import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { LoginScreen } from '../src/screens/LoginScreen';

const mockLogin = jest.fn();

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    register: jest.fn(),
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

function renderLoginScreen() {
  return render(<LoginScreen />);
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login title and inputs', async () => {
    const { getByText, getByPlaceholderText } = await renderLoginScreen();
    expect(getByText('Welcome back')).toBeOnTheScreen();
    expect(getByPlaceholderText('you@example.com')).toBeOnTheScreen();
    expect(getByPlaceholderText('Your password')).toBeOnTheScreen();
  });

  it('submits the entered credentials', async () => {
    mockLogin.mockResolvedValue(undefined);
    const { getByPlaceholderText, getByText } = await renderLoginScreen();

    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'okello@example.com');
    await fireEvent.changeText(getByPlaceholderText('Your password'), 'StrongPass1');
    await fireEvent.press(getByText('Log in'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'okello@example.com',
        password: 'StrongPass1',
      });
    });
  });

  it('shows an error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid credentials provided' } },
    });
    const { getByPlaceholderText, getByText, findByText } = await renderLoginScreen();

    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'okello@example.com');
    await fireEvent.changeText(getByPlaceholderText('Your password'), 'WrongPass1');
    await fireEvent.press(getByText('Log in'));

    expect(await findByText('Invalid credentials provided')).toBeOnTheScreen();
  });
});
