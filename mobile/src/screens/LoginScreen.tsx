import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '../auth/useAuth';
import { getApiErrorMessage } from '../api/client';
import type { RootStackParamList } from '../../App';

type LoginNavigation = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export function LoginScreen() {
  const { login, loading } = useAuth();
  const navigation = useNavigation<LoginNavigation>();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      await login({ identifier: identifier.trim(), password });
      navigation.replace('Home');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.heading}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Log in to continue to AgriConnect Uganda.
            </Text>
          </View>

          {error && (
            <View style={styles.alert}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email or username</Text>
              <TextInput
                style={styles.input}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoComplete="username"
                autoCorrect={false}
                placeholder="you@example.com"
                placeholderTextColor="#8aa08a"
              />
            </View>

            <View>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                placeholder="Your password"
                placeholderTextColor="#8aa08a"
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (pressed || loading) && styles.buttonDisabled,
              ]}
              disabled={loading}
              onPress={() => void onSubmit()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log in</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>New to AgriConnect?</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>Create an account</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f6f8f3',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce5d3',
    padding: 24,
    gap: 8,
  },
  heading: {
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b2a1b',
  },
  subtitle: {
    fontSize: 15,
    color: '#4a6b4a',
    marginTop: 4,
  },
  form: {
    gap: 16,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b2a1b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fcfdfa',
    borderWidth: 1,
    borderColor: '#dce5d3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1b2a1b',
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  alert: {
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: 'rgba(179, 38, 30, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  alertText: {
    color: '#b3261e',
    fontSize: 14,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  switchText: {
    color: '#4a6b4a',
    fontSize: 14,
  },
  switchLink: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
});