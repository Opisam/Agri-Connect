import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { pricesApi } from '../markets/api';
import type { MarketPrice } from '../markets/types';
import type { RootStackParamList } from '../../App';

type PriceHistoryRoute = RouteProp<RootStackParamList, 'PriceHistory'>;

export function PriceHistoryScreen() {
  const route = useRoute<PriceHistoryRoute>();
  const { product, marketName } = route.params;

  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await pricesApi.history({
          market: route.params.marketId,
          product,
        });
        if (!cancelled) {
          setPrices(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err));
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [product, route.params.marketId]);

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>{product} History</Text>
        <Text style={s.subtitle}>{marketName}</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Price History</Text>
        {prices.length === 0 ? (
          <Text style={s.empty}>No recorded history yet.</Text>
        ) : (
          prices.map((price) => (
            <View key={price.id} style={s.listItem}>
              <Text style={s.itemTitle}>
                UGX {Number(price.price).toLocaleString()} / {price.unit}
              </Text>
              <Text style={s.itemMeta}>
                {price.price_date}
                {price.source ? ` · source: ${price.source}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}