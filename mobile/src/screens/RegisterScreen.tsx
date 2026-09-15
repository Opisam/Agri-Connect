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
import type { UserRole } from '../types/auth';

type RegisterNavigation = NativeStackNavigationProp<RootStackParamList, 'Register'>;

export function RegisterScreen() {
  const { register, loading } = useAuth();
  const navigation = useNavigation<RegisterNavigation>();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Exclude<UserRole, 'ADMIN'>>('FARMER');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    try {
      await register({
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        role,
        location: location.trim(),
        district: district.trim(),
      });
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join AgriConnect Uganda as a farmer or buyer.
            </Text>
          </View>

          {error && (
            <View style={styles.alert}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.roleRow}>
              {(['FARMER', 'BUYER'] as const).map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.roleOption,
                    role === option && styles.roleOptionActive,
                  ]}
                  onPress={() => setRole(option)}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === option && styles.roleOptionTextActive,
                    ]}
                  >
                    {option === 'FARMER' ? 'I am a Farmer' : 'I am a Buyer'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                autoComplete="name"
                placeholder="e.g. Okello James"
                placeholderTextColor="#8aa08a"
              />
            </View>

            <View>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                autoComplete="tel"
                keyboardType="phone-pad"
                placeholder="e.g. 0772123456"
                placeholderTextColor="#8aa08a"
              />
            </View>

            <View>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
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
                autoComplete="new-password"
                placeholder="8 characters, upper & lowercase, digit"
                placeholderTextColor="#8aa08a"
              />
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridHalf}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="e.g. Lira City"
                  placeholderTextColor="#8aa08a"
                />
              </View>
              <View style={styles.gridHalf}>
                <Text style={styles.label}>District</Text>
                <TextInput
                  style={styles.input}
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="e.g. Lira"
                  placeholderTextColor="#8aa08a"
                />
              </View>
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
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>Log in</Text>
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
    gap: 14,
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
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dce5d3',
    backgroundColor: '#fcfdfa',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
    borderColor: '#2e7d32',
  },
  roleOptionText: {
    color: '#4a6b4a',
    fontWeight: '600',
    fontSize: 14,
  },
  roleOptionTextActive: {
    color: '#1b5e20',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridHalf: {
    flex: 1,
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