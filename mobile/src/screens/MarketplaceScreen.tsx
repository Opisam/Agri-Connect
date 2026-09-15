import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { categoriesApi, listingsApi, ordersApi } from '../marketplace/api';
import type { Listing, ProduceCategory } from '../marketplace/types';
import type { RootStackParamList } from '../../App';

type MarketplaceNavigation = NativeStackNavigationProp<RootStackParamList, 'Marketplace'>;

export function MarketplaceScreen() {
  const navigation = useNavigation<MarketplaceNavigation>();
  const { user } = useAuth();
  const isBuyer = user?.role === 'BUYER';

  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<ProduceCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [orderingId, setOrderingId] = useState<number | null>(null);
  const [orderQty, setOrderQty] = useState('');

  const load = async () => {
    try {
      const [listingPage, categoryPage] = await Promise.all([
        listingsApi.list(),
        categoriesApi.list(),
      ]);
      setListings(listingPage.results);
      setCategories(categoryPage.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = listings.filter((l) => {
    const matchSearch =
      !search ||
      l.product_name.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()) ||
      l.district.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === null || l.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const onOrder = async (listingId: number) => {
    if (!orderQty || Number(orderQty) <= 0) {
      setError('Enter a valid quantity to order.');
      setOrderingId(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ordersApi.create({ listing: listingId, quantity: orderQty, notes: '' });
      setOrderingId(null);
      setOrderQty('');
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>Browse Produce</Text>
        <Text style={s.subtitle}>Find fresh produce from local farmers.</Text>
      </View>

      {user && (
        <Pressable
          style={({ pressed }) => [s.button, pressed && s.buttonDisabled]}
          onPress={() => navigation.navigate('Orders')}
        >
          <Text style={s.buttonText}>My Orders</Text>
        </Pressable>
      )}

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Search</Text>
        <TextInput
          style={s.input}
          value={search}
          onChangeText={setSearch}
          placeholder="Product, location or district"
          placeholderTextColor="#8aa08a"
        />
        <Text style={s.label}>Category</Text>
        <View style={s.chips}>
          <Pressable
            style={[s.chip, categoryFilter === null && s.chipActive]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text style={[s.chipText, categoryFilter === null && s.chipTextActive]}>All</Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={[s.chip, categoryFilter === c.id && s.chipActive]}
              onPress={() => setCategoryFilter(c.id)}
            >
              <Text style={[s.chipText, categoryFilter === c.id && s.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Available Produce</Text>
        {filtered.length === 0 ? (
          <Text style={s.empty}>No active listings match your filters.</Text>
        ) : (
          filtered.map((listing) => (
            <View key={listing.id} style={s.listItem}>
              <Text style={s.itemTitle}>{listing.product_name}</Text>
              <Text style={s.itemMeta}>
                {listing.category_name} · UGX {Number(listing.price_per_unit).toLocaleString()} /{' '}
                {listing.unit}
              </Text>
              <Text style={s.itemMeta}>
                {listing.quantity_remaining} {listing.unit} available · {listing.location},{' '}
                {listing.district}
              </Text>
              <Text style={s.itemMeta}>Listed by {listing.farmer_name}</Text>
              {isBuyer && orderingId === listing.id && (
                <View style={s.rowPair}>
                  <View style={s.rowItem}>
                    <TextInput
                      style={s.input}
                      value={orderQty}
                      onChangeText={setOrderQty}
                      keyboardType="decimal-pad"
                      placeholder={`Max ${listing.quantity_remaining}`}
                      placeholderTextColor="#8aa08a"
                    />
                  </View>
                </View>
              )}
              <View style={s.itemActions}>
                {isBuyer &&
                  (orderingId === listing.id ? (
                    <>
                      <Pressable
                        style={[s.button, s.actionFlex, busy && s.buttonDisabled]}
                        disabled={busy}
                        onPress={() => void onOrder(listing.id)}
                      >
                        {busy ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={s.buttonText}>Confirm</Text>
                        )}
                      </Pressable>
                      <Pressable
                        style={[s.buttonGhost, s.actionFlex]}
                        onPress={() => {
                          setOrderingId(null);
                          setOrderQty('');
                        }}
                      >
                        <Text style={s.buttonGhostText}>Cancel</Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      style={[s.button, s.actionFlex]}
                      onPress={() => setOrderingId(listing.id)}
                    >
                      <Text style={s.buttonText}>Order</Text>
                    </Pressable>
                  ))}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}