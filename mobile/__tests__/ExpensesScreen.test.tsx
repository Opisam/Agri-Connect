import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { ExpensesScreen } from '../src/screens/ExpensesScreen';

const mockList = jest.fn();
const mockCreate = jest.fn();
const mockRemove = jest.fn();

jest.mock('../src/finance/api', () => ({
  expensesApi: {
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

describe('ExpensesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          farm: 1,
          farm_name: 'Okello Family Farm',
          crop: null,
          crop_name: null,
          category: 'Seeds',
          category_display: 'Seeds',
          amount: '50000.00',
          date: '2026-09-15',
          description: 'Maize seeds',
          notes: '',
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ],
    });
  });

  it('renders expenses from the API', async () => {
    const { getByText, findByText } = await render(<ExpensesScreen />);
    expect(getByText('Expenses')).toBeOnTheScreen();
    expect(await findByText(/Maize seeds/)).toBeOnTheScreen();
    expect(getByText(/50,000/)).toBeOnTheScreen();
  });

  it('creates an expense and refreshes the list', async () => {
    mockCreate.mockResolvedValue({ id: 2 });
    const { getByText, getByPlaceholderText } = await render(<ExpensesScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    await fireEvent.changeText(getByPlaceholderText('e.g. 50000'), '25000');
    await fireEvent.changeText(getByPlaceholderText('YYYY-MM-DD'), '2026-09-16');
    await fireEvent.press(getByText('Add expense'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalled());
    await waitFor(() => expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(2));
  });
});
