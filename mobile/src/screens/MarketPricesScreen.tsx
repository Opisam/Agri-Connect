import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { marketsApi, pricesApi } from '../markets/api';
import type { Market, MarketPrice } from '../markets/types';
import type { RootStackParamList } from '../../App';

type MarketPricesNavigation = NativeStackNavigationProp<RootStackParamList, 'MarketPrices'>;

export function MarketPricesScreen() {
  const navigation = useNavigation<MarketPricesNavigation>();

  const [markets, setMarkets] = useState<Market[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [marketPage, currentPrices] = await Promise.all([
        marketsApi.list(),
        pricesApi.current(),
      ]);
      setMarkets(marketPage.results);
      setPrices(currentPrices);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = prices.filter((p) => {
    const matchSearch =
      !search || p.product.toLowerCase().includes(search.toLowerCase());
    const matchMarket = marketFilter === null || p.market === marketFilter;
    return matchSearch && matchMarket;
  });

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>Market Prices</Text>
        <Text style={s.subtitle}>Latest produce prices across major Ugandan markets.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Product</Text>
        <TextInput
          style={s.input}
          value={search}
          onChangeText={setSearch}
          placeholder="e.g. maize"
          placeholderTextColor="#8aa08a"
        />
        <Text style={s.label}>Market</Text>
        <View style={s.chips}>
          <Pressable
            style={[s.chip, marketFilter === null && s.chipActive]}
            onPress={() => setMarketFilter(null)}
          >
            <Text style={[s.chipText, marketFilter === null && s.chipTextActive]}>All</Text>
          </Pressable>
          {markets.map((m) => (
            <Pressable
              key={m.id}
              style={[s.chip, marketFilter === m.id && s.chipActive]}
              onPress={() => setMarketFilter(m.id)}
            >
              <Text style={[s.chipText, marketFilter === m.id && s.chipTextActive]}>
                {m.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Current Prices</Text>
        {filtered.length === 0 ? (
          <Text style={s.empty}>No market prices match your filters.</Text>
        ) : (
          filtered.map((price) => (
            <View key={price.id} style={s.listItem}>
              <Text style={s.itemTitle}>{price.product}</Text>
              <Text style={s.itemMeta}>
                {price.market_name} · UGX {Number(price.price).toLocaleString()} / {price.unit}
              </Text>
              <Text style={s.itemMeta}>
                {price.price_date}
                {price.source ? ` · source: ${price.source}` : ''}
              </Text>
              <View style={s.itemActions}>
                <Pressable
                  style={[s.button, s.actionFlex]}
                  onPress={() =>
                    navigation.navigate('PriceHistory', {
                      product: price.product,
                      marketId: price.market,
                      marketName: price.market_name,
                    })
                  }
                >
                  <Text style={s.buttonText}>View history</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}