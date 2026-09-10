import { StyleSheet, Text, View } from 'react-native';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriConnect Uganda</Text>
      <Text style={styles.subtitle}>
        Manage your farm. Understand your finances. Find better market
        opportunities.
      </Text>
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
});