import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { NotificationsScreen } from '../src/screens/NotificationsScreen';

const mockList = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../src/notifications/api', () => ({
  notificationsApi: {
    list: (...args: unknown[]) => mockList(...args),
    unreadCount: jest.fn(),
    markRead: (...args: unknown[]) => mockMarkRead(...args),
    markAllRead: (...args: unknown[]) => mockMarkAllRead(...args),
  },
}));

jest.mock('../src/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 1,
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
      navigate: mockNavigate,
    }),
  };
});

const notification = {
  id: 7,
  user: 1,
  notification_type: 'ORDER_ACCEPTED',
  title: 'Order accepted',
  message: 'Your order for Maize (50 kg) was accepted.',
  is_read: false,
  related_object_type: 'order',
  related_object_id: 9,
  created_at: '2026-09-14T10:00:00Z',
  updated_at: '2026-09-14T10:00:00Z',
};

const readNotification = {
  ...notification,
  id: 8,
  title: 'Welcome',
  message: 'Thanks for joining AgriConnect.',
  is_read: true,
};

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [notification, readNotification],
    });
    mockMarkRead.mockResolvedValue({ ...notification, is_read: true });
    mockMarkAllRead.mockResolvedValue(2);
  });

  it('renders the list of notifications', async () => {
    const { getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    expect(getByText('Notifications')).toBeOnTheScreen();
    expect(getByText(/Order accepted/)).toBeOnTheScreen();
    expect(getByText('Welcome')).toBeOnTheScreen();
  });

  it('shows an empty state when there are no notifications', async () => {
    mockList.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
    const { getByText, findByText } = await render(<NotificationsScreen />);
    expect(getByText('Notifications')).toBeOnTheScreen();
    expect(await findByText('You have no notifications.')).toBeOnTheScreen();
  });

  it('marks a single notification as read and reloads', async () => {
    const { getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(1));
    fireEvent.press(getByText(/Order accepted/));
    expect(mockMarkRead).toHaveBeenCalledWith(7);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });

  it('marks all notifications as read', async () => {
    const { getByText } = await render(<NotificationsScreen />);
    fireEvent.press(getByText('Mark all as read'));
    expect(mockMarkAllRead).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockList).toHaveBeenCalledTimes(2));
  });

  it('navigates to orders for related order notifications', async () => {
    const { getByText } = await render(<NotificationsScreen />);
    await waitFor(() => expect(mockList).toHaveBeenCalled());
    fireEvent.press(getByText(/Order accepted/));
    expect(mockNavigate).toHaveBeenCalledWith('Orders');
  });
});