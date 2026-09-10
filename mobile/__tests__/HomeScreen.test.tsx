import { render } from '@testing-library/react-native';

import { HomeScreen } from '../src/screens/HomeScreen';

test('renders the AgriConnect heading', async () => {
  const { getByText } = await render(<HomeScreen />);
  expect(getByText('AgriConnect Uganda')).toBeOnTheScreen();
});