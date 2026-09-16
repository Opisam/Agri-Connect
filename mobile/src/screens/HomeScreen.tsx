import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../auth/useAuth';
import type { RootStackParamList } from '../../App';

type HomeNavigation = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigation>();
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriConnect Uganda</Text>
      <Text style={styles.subtitle}>
        Manage your farm. Understand your finances. Find better market
        opportunities.
      </Text>

      {user && <Text style={styles.welcome}>Welcome, {user.full_name}</Text>}

      <View style={styles.menu}>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Marketplace')}
        >
          <Text style={styles.buttonText}>Browse Marketplace</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('MarketPrices')}
        >
          <Text style={styles.buttonText}>Market Prices</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate('Guides')}
        >
          <Text style={styles.buttonText}>Guides</Text>
        </Pressable>
        {!user ? (
          <>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.buttonText}>Log in</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.buttonGhost, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.buttonGhostText}>Create account</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Text style={styles.buttonText}>Notifications</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.buttonText}>My Orders</Text>
            </Pressable>
            {user.role === 'FARMER' && (
              <Pressable
                style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
                onPress={() => navigation.navigate('Farms')}
              >
                <Text style={styles.buttonText}>My Farms</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.buttonGhost, pressed && styles.buttonPressed]}
              onPress={() => void logout()}
            >
              <Text style={styles.buttonGhostText}>Log out</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8f3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1b2a1b',
  },
  subtitle: {
    fontSize: 16,
    color: '#4a6b4a',
    textAlign: 'center',
    marginTop: 8,
  },
  welcome: {
    fontSize: 16,
    color: '#1b5e20',
    textAlign: 'center',
    marginTop: 16,
  },
  menu: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonGhost: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGhostText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
});