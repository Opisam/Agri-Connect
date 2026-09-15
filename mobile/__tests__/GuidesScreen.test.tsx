import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { GuidesScreen } from '../src/screens/GuidesScreen';

const mockCategories = jest.fn();
const mockArticlesList = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../src/content/api', () => ({
  contentApi: {
    categories: (...args: unknown[]) => mockCategories(...args),
  },
  articlesApi: {
    list: (...args: unknown[]) => mockArticlesList(...args),
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

const crops = {
  id: 1,
  name: 'Crops',
  slug: 'crops',
  description: 'Guides on crop planting.',
};

const article = {
  id: 5,
  category: 1,
  category_name: 'Crops',
  author: null,
  author_name: null,
  title: 'How to grow maize',
  slug: 'how-to-grow-maize',
  content: 'Plant maize in well-drained soils.',
  image: null,
  is_published: true,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
};

describe('GuidesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCategories.mockResolvedValue({ count: 1, next: null, previous: null, results: [crops] });
    mockArticlesList.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [article],
    });
  });

  it('renders published guides', async () => {
    const { getByText, findByText, getAllByText } = await render(<GuidesScreen />);
    expect(getByText('Agricultural Guides')).toBeOnTheScreen();
    expect(await findByText('How to grow maize')).toBeOnTheScreen();
    expect(getAllByText(/Crops/).length).toBeGreaterThanOrEqual(2);
  });

  it('navigates to an article', async () => {
    const { getByText } = await render(<GuidesScreen />);
    await waitFor(() => expect(mockArticlesList).toHaveBeenCalled());
    fireEvent.press(getByText('How to grow maize'));
    expect(mockNavigate).toHaveBeenCalledWith('Article', {
      articleId: 5,
      title: 'How to grow maize',
    });
  });
});