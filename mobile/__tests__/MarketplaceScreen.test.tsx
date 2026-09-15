import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { MarketplaceScreen } from '../src/screens/MarketplaceScreen';

const mockListingsList = jest.fn();
const mockCategoriesList = jest.fn();
const mockOrderCreate = jest.fn();

jest.mock('../src/marketplace/api', () => ({
  listingsApi: {
    list: (...args: unknown[]) => mockListingsList(...args),
  },
  categoriesApi: {
    list: (...args: unknown[]) => mockCategoriesList(...args),
  },
  ordersApi: {
    create: (...args: unknown[]) => mockOrderCreate(...args),
  },
}));

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 2,
      username: 'buyer',
      full_name: 'Buyer One',
      phone: '0700000000',
      email: 'buyer@example.com',
      role: 'BUYER',
      location: 'Kampala',
      district: 'Kampala',
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
      navigate: jest.fn(),
    }),
  };
});

const listing = {
  id: 10,
  farmer: 1,
  farmer_name: 'Grace Auma',
  product_name: 'Fresh tomatoes',
  category: 3,
  category_name: 'Vegetables',
  quantity: '500.00',
  quantity_remaining: '500.00',
  unit: 'kg',
  price_per_unit: '3000.00',
  location: 'Lugazi',
  district: 'Mukono',
  available_from: '2026-09-20',
  description: 'Field-fresh tomatoes',
  image: null,
  status: 'ACTIVE',
  status_display: 'Active',
  created_at: '2026-09-15T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
};

const category = { id: 3, name: 'Vegetables', slug: 'vegetables', description: '' };

describe('MarketplaceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListingsList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [listing],
    });
    mockCategoriesList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [category],
    });
    mockOrderCreate.mockResolvedValue({ id: 1 });
  });

  it('renders active listings with price', async () => {
    const { getByText, findByText } = await render(<MarketplaceScreen />);
    expect(getByText('Browse Produce')).toBeOnTheScreen();
    expect(await findByText('Fresh tomatoes')).toBeOnTheScreen();
    expect(getByText(/3,000/)).toBeOnTheScreen();
  });

  it('places an order for a buyer', async () => {
    const { getByText, getByPlaceholderText } = await render(<MarketplaceScreen />);
    await waitFor(() => expect(mockListingsList).toHaveBeenCalled());
    await fireEvent.press(getByText('Order'));
    await fireEvent.changeText(getByPlaceholderText('Max 500.00'), '100');
    await fireEvent.press(getByText('Confirm'));
    await waitFor(() =>
      expect(mockOrderCreate).toHaveBeenCalledWith({
        listing: 10,
        quantity: '100',
        notes: '',
      }),
    );
  });
});