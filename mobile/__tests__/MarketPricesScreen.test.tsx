import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { MarketPricesScreen } from '../src/screens/MarketPricesScreen';

const mockMarketsList = jest.fn();
const mockPricesCurrent = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../src/markets/api', () => ({
  marketsApi: {
    list: (...args: unknown[]) => mockMarketsList(...args),
  },
  pricesApi: {
    current: (...args: unknown[]) => mockPricesCurrent(...args),
  },
}));

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'farmer',
      full_name: 'Farmer One',
      phone: '0700000000',
      email: 'farmer@example.com',
      role: 'FARMER',
      location: 'Lira',
      district: 'Lira',
      profile_image: null,
      date_joined: '2026-09-01T00:00:00Z',
      created_at: '2026-09-01T00:00:00Z',
      updated_at: '2026-09-01T00:00:00Z',
    },
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

const market = {
  id: 1,
  name: 'Lira Main Market',
  district: 'Lira',
  location: 'Adyel',
  description: '',
  is_active: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

const currentPrice = {
  id: 21,
  product: 'Maize',
  market: 1,
  market_name: 'Lira Main Market',
  price: '1500.00',
  unit: 'kg',
  price_date: '2026-09-14',
  source: 'KCCA',
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

describe('MarketPricesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMarketsList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [market],
    });
    mockPricesCurrent.mockResolvedValue([currentPrice]);
  });

  it('renders current market prices', async () => {
    const { getByText, findByText } = await render(<MarketPricesScreen />);
    expect(getByText('Market Prices')).toBeOnTheScreen();
    expect(await findByText('Maize')).toBeOnTheScreen();
    expect(getByText(/1,500/)).toBeOnTheScreen();
    expect(getByText('Lira Main Market')).toBeOnTheScreen();
  });

  it('navigates to price history', async () => {
    const { getByText } = await render(<MarketPricesScreen />);
    await waitFor(() => expect(mockPricesCurrent).toHaveBeenCalled());
    fireEvent.press(getByText('View history'));
    expect(mockNavigate).toHaveBeenCalledWith('PriceHistory', {
      product: 'Maize',
      marketId: 1,
      marketName: 'Lira Main Market',
    });
  });
});