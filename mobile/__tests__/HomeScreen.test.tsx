import { render, fireEvent } from '@testing-library/react-native';

import { HomeScreen } from '../src/screens/HomeScreen';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

test('renders the AgriConnect heading', async () => {
  const { getByText } = await render(<HomeScreen />);
  expect(getByText('AgriConnect Uganda')).toBeOnTheScreen();
});

test('shows the marketplace link to logged-out users', async () => {
  const { getByText } = await render(<HomeScreen />);
  expect(getByText('Browse Marketplace')).toBeOnTheScreen();
});