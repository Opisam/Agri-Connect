import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/auth/AuthContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { FarmsScreen } from './src/screens/FarmsScreen';
import { FieldsScreen } from './src/screens/FieldsScreen';
import { CropsScreen } from './src/screens/CropsScreen';
import { ActivitiesScreen } from './src/screens/ActivitiesScreen';
import { ExpensesScreen } from './src/screens/ExpensesScreen';
import { HarvestsScreen } from './src/screens/HarvestsScreen';
import { SalesScreen } from './src/screens/SalesScreen';
import { MarketplaceScreen } from './src/screens/MarketplaceScreen';
import { MarketPricesScreen } from './src/screens/MarketPricesScreen';
import { OrdersScreen } from './src/screens/OrdersScreen';
import { PriceHistoryScreen } from './src/screens/PriceHistoryScreen';

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Farms: undefined;
  Fields: { farmId: number; farmName: string };
  Crops: { fieldId?: number; fieldName?: string };
  Activities: { cropId: number; cropLabel: string };
  Expenses: { farmId: number };
  Harvests: { farmId: number };
  Sales: { farmId: number };
  Marketplace: undefined;
  Orders: undefined;
  MarketPrices: undefined;
  PriceHistory: { product: string; marketId: number; marketName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerTintColor: '#1b5e20',
            headerTitleStyle: { fontWeight: '600' },
            headerStyle: { backgroundColor: '#f6f8f3' },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'AgriConnect' }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Log in' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Create account' }}
          />
          <Stack.Screen name="Farms" component={FarmsScreen} options={{ title: 'My Farms' }} />
          <Stack.Screen name="Fields" component={FieldsScreen} options={{ title: 'Fields' }} />
          <Stack.Screen name="Crops" component={CropsScreen} options={{ title: 'My Crops' }} />
          <Stack.Screen
            name="Activities"
            component={ActivitiesScreen}
            options={{ title: 'Activities' }}
          />
          <Stack.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={{ title: 'Expenses' }}
          />
          <Stack.Screen
            name="Harvests"
            component={HarvestsScreen}
            options={{ title: 'Harvests' }}
          />
          <Stack.Screen
            name="Sales"
            component={SalesScreen}
            options={{ title: 'Sales' }}
          />
          <Stack.Screen
            name="Marketplace"
            component={MarketplaceScreen}
            options={{ title: 'Marketplace' }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'Orders' }}
          />
          <Stack.Screen
            name="MarketPrices"
            component={MarketPricesScreen}
            options={{ title: 'Market Prices' }}
          />
          <Stack.Screen
            name="PriceHistory"
            component={PriceHistoryScreen}
            options={{ title: 'Price History' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}