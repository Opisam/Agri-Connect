import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { OrdersScreen } from '../src/screens/OrdersScreen';

const mockList = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../src/marketplace/api', () => ({
  ordersApi: {
    list: (...args: unknown[]) => mockList(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      username: 'farm',
      full_name: 'Grace Auma',
      phone: '0700000001',
      email: 'farm@example.com',
      role: 'FARMER',
      location: 'Lugazi',
      district: 'Mukono',
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

const pendingOrder = {
  id: 5,
  listing: 10,
  listing_product_name: 'Fresh tomatoes',
  listing_unit: 'kg',
  listing_price_per_unit: '3000.00',
  listing_quantity_remaining: '400.00',
  buyer: 2,
  buyer_name: 'Buyer One',
  quantity: '100.00',
  total_price: '300000.00',
  status: 'PENDING',
  status_display: 'Pending',
  notes: 'Deliver on Friday',
  farmer_notes: '',
  created_at: '2026-09-15T00:00:00Z',
  updated_at: '2026-09-15T00:00:00Z',
};

describe('OrdersScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [pendingOrder],
    });
    mockUpdate.mockResolvedValue({ ...pendingOrder, status: 'ACCEPTED' });
  });

  it('renders orders received by the farmer', async () => {
    const { getByText, findByText } = await render(<OrdersScreen />);
    expect(getByText('Orders Received')).toBeOnTheScreen();
    expect(await findByText(/Fresh tomatoes/)).toBeOnTheScreen();
    expect(getByText(/Buyer: Buyer One/)).toBeOnTheScreen();
  });

  it('accepts a pending order', async () => {
    const { getByText } = await render(<OrdersScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    await fireEvent.press(getByText('Accept'));
    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(5, { status: 'ACCEPTED' }),
    );
  });
});