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

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Farms: undefined;
  Fields: { farmId: number; farmName: string };
  Crops: { fieldId?: number; fieldName?: string };
  Activities: { cropId: number; cropLabel: string };
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
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}