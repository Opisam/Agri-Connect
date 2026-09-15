import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { SalesScreen } from '../src/screens/SalesScreen';

const mockList = jest.fn();
const mockCreate = jest.fn();
const mockRemove = jest.fn();

jest.mock('../src/finance/api', () => ({
  salesApi: {
    list: (...args: unknown[]) => mockList(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
}));

jest.mock('../src/farms/api', () => ({
  farmsApi: { list: jest.fn() },
  cropsApi: { list: jest.fn() },
}));

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useRoute: () => ({
      params: { farmId: 1 },
    }),
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

describe('SalesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          farmer: 1,
          farm: 1,
          farm_name: 'Okello Family Farm',
          crop: null,
          crop_name: null,
          quantity: '100',
          unit: 'kg',
          unit_price: '3500.00',
          total_amount: '350000.00',
          buyer_name: 'Auma',
          buyer_contact: '0771234567',
          sale_date: '2026-09-15',
          notes: '',
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ],
    });
  });

  it('renders sales from the API', async () => {
    const { getByText, findByText } = await render(<SalesScreen />);
    expect(getByText('Sales')).toBeOnTheScreen();
    expect(await findByText(/Auma/)).toBeOnTheScreen();
    expect(getByText(/350,000/)).toBeOnTheScreen();
  });

  it('creates a sale and refreshes the list', async () => {
    mockCreate.mockResolvedValue({ id: 2 });
    const { getByText, getByPlaceholderText } = await render(<SalesScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    await fireEvent.changeText(getByPlaceholderText('e.g. 100'), '200');
    await fireEvent.changeText(getByPlaceholderText('e.g. 3500'), '4000');
    await fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-09-16');
    await fireEvent.changeText(getByPlaceholderText('e.g. Auma'), 'Otim');
    await fireEvent.press(getByText('Record sale'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    await waitFor(() => expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
