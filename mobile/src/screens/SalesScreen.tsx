import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { salesApi } from '../finance/api';
import { UNITS, type Sale, type SalePayload } from '../finance/types';
import type { RootStackParamList } from '../../App';

type SalesRoute = RouteProp<RootStackParamList, 'Sales'>;

const EMPTY_FORM: SalePayload = {
  farm: 0,
  crop: null,
  quantity: '',
  unit: 'kg',
  unit_price: '',
  buyer_name: '',
  buyer_contact: '',
  sale_date: '',
  notes: '',
};

export function SalesScreen() {
  const route = useRoute<SalesRoute>();
  const farmId = route.params.farmId;
  const [items, setItems] = useState<Sale[]>([]);
  const [form, setForm] = useState<SalePayload>({ ...EMPTY_FORM, farm: farmId });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await salesApi.list();
        setItems(page.results.filter((sale) => sale.farm === farmId));
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    };
    void load();
  }, [farmId]);

  const set = <K extends keyof SalePayload>(key: K, value: SalePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await salesApi.create(form);
      setForm({ ...EMPTY_FORM, farm: farmId });
      const page = await salesApi.list();
      setItems(page.results.filter((sale) => sale.farm === farmId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (item: Sale) => {
    Alert.alert('Delete sale', `Delete this sale record?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await salesApi.remove(item.id);
              const page = await salesApi.list();
              setItems(page.results.filter((sale) => sale.farm === farmId));
            } catch (err) {
              setError(getApiErrorMessage(err));
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>Sales</Text>
        <Text style={s.subtitle}>Record what you sell and track revenue.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Record a Sale</Text>
        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Crop ID (optional)</Text>
            <TextInput
              style={s.input}
              value={form.crop === null ? '' : String(form.crop)}
              onChangeText={(v) => set('crop', v === '' ? null : Number(v))}
              keyboardType="number-pad"
              placeholder="Leave blank if none"
              placeholderTextColor="#8aa08a"
            />
          </View>
          <View style={s.rowItem}>
            <Text style={s.label}>Unit</Text>
            <View style={s.chips}>
              {UNITS.slice(0, 4).map((u) => (
                <Pressable
                  key={u.value}
                  style={[s.chip, form.unit === u.value && s.chipActive]}
                  onPress={() => set('unit', u.value)}
                >
                  <Text style={[s.chipText, form.unit === u.value && s.chipTextActive]}>
                    {u.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Quantity</Text>
            <TextInput
              style={s.input}
              value={form.quantity}
              onChangeText={(v) => set('quantity', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 100"
              placeholderTextColor="#8aa08a"
            />
          </View>
          <View style={s.rowItem}>
            <Text style={s.label}>Unit price (UGX)</Text>
            <TextInput
              style={s.input}
              value={form.unit_price}
              onChangeText={(v) => set('unit_price', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 3500"
              placeholderTextColor="#8aa08a"
            />
          </View>
        </View>
        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Buyer name</Text>
            <TextInput
              style={s.input}
              value={form.buyer_name}
              onChangeText={(v) => set('buyer_name', v)}
              placeholder="e.g. Auma"
              placeholderTextColor="#8aa08a"
            />
          </View>
          <View style={s.rowItem}>
            <Text style={s.label}>Buyer contact</Text>
            <TextInput
              style={s.input}
              value={form.buyer_contact}
              onChangeText={(v) => set('buyer_contact', v)}
              placeholder="e.g. 0771234567"
              placeholderTextColor="#8aa08a"
            />
          </View>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Sale date</Text>
          <TextInput
            style={s.input}
            value={form.sale_date}
            onChangeText={(v) => set('sale_date', v)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#8aa08a"
          />
        </View>
        <View style={s.row}>
          <Text style={s.label}>Notes</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
            placeholder="Optional"
            placeholderTextColor="#8aa08a"
            multiline
            numberOfLines={2}
          />
        </View>
        <Pressable
          style={({ pressed }) => [s.button, (pressed || busy) && s.buttonDisabled]}
          disabled={busy}
          onPress={() => void onSubmit()}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Record sale</Text>}
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>All Sales</Text>
        {items.length === 0 ? (
          <Text style={s.empty}>No sales yet. Record your first sale above.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={s.listItem}>
              <Text style={s.itemTitle}>
                {item.quantity} {item.unit} — UGX {Number(item.total_amount).toLocaleString()}
              </Text>
              <Text style={s.itemMeta}>
                {item.buyer_name ? `${item.buyer_name} · ` : ''}{item.sale_date}
              </Text>
              <View style={s.itemActions}>
                <Pressable
                  style={[s.buttonDanger, s.actionFlex]}
                  onPress={() => onDelete(item)}
                >
                  <Text style={s.buttonDangerText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
