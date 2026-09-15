import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { FarmsScreen } from '../src/screens/FarmsScreen';

const mockList = jest.fn();
const mockCreate = jest.fn();
const mockRemove = jest.fn();

jest.mock('../src/farms/api', () => ({
  farmsApi: {
    list: (...args: unknown[]) => mockList(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    remove: (...args: unknown[]) => mockRemove(...args),
  },
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

describe('FarmsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 1,
          owner: 1,
          name: 'Okello Family Farm',
          location: 'Opit',
          district: 'Gulu',
          subcounty: 'Paicho',
          size: '10.00',
          size_unit: 'acres',
          farm_type: 'crop_farming',
          description: '',
          field_count: 2,
          created_at: '2026-09-01T00:00:00Z',
          updated_at: '2026-09-01T00:00:00Z',
        },
      ],
    });
  });

  it('renders the farm from the API', async () => {
    const { getByText, findByText } = await render(<FarmsScreen />);
    expect(getByText('My Farms')).toBeOnTheScreen();
    expect(await findByText('Okello Family Farm')).toBeOnTheScreen();
    expect(getByText('2 fields')).toBeOnTheScreen();
  });

  it('creates a farm and refreshes the list', async () => {
    mockCreate.mockResolvedValue({ id: 2 });
    const { getByPlaceholderText, getByText } = await render(<FarmsScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    await fireEvent.changeText(
      getByPlaceholderText('e.g. Okello Family Farm'),
      'Auma Farm',
    );
    await fireEvent.press(getByText('Add farm'));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });
});