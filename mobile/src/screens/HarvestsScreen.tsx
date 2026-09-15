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
import { harvestsApi } from '../finance/api';
import { UNITS, type Harvest, type HarvestPayload } from '../finance/types';
import type { RootStackParamList } from '../../App';

type HarvestsRoute = RouteProp<RootStackParamList, 'Harvests'>;

const EMPTY_FORM: HarvestPayload = {
  farm: 0,
  crop: 0,
  quantity: '',
  unit: 'kg',
  harvest_date: '',
  notes: '',
};

export function HarvestsScreen() {
  const route = useRoute<HarvestsRoute>();
  const farmId = route.params.farmId;
  const [items, setItems] = useState<Harvest[]>([]);
  const [form, setForm] = useState<HarvestPayload>({ ...EMPTY_FORM, farm: farmId });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await harvestsApi.list();
        setItems(page.results.filter((h) => h.farm === farmId));
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    };
    void load();
  }, [farmId]);

  const set = <K extends keyof HarvestPayload>(key: K, value: HarvestPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await harvestsApi.create(form);
      setForm({ ...EMPTY_FORM, farm: farmId });
      const page = await harvestsApi.list();
      setItems(page.results.filter((h) => h.farm === farmId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (item: Harvest) => {
    Alert.alert('Delete harvest', `Delete this harvest record?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await harvestsApi.remove(item.id);
              const page = await harvestsApi.list();
              setItems(page.results.filter((h) => h.farm === farmId));
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
        <Text style={s.title}>Harvests</Text>
        <Text style={s.subtitle}>Track what you harvest from your crops.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Record a Harvest</Text>
        <View style={s.row}>
          <Text style={s.label}>Crop ID</Text>
          <TextInput
            style={s.input}
            value={form.crop === 0 ? '' : String(form.crop)}
            onChangeText={(v) => set('crop', v === '' ? 0 : Number(v))}
            keyboardType="number-pad"
            placeholder="Crop ID from your farm"
            placeholderTextColor="#8aa08a"
          />
        </View>
        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Quantity</Text>
            <TextInput
              style={s.input}
              value={form.quantity}
              onChangeText={(v) => set('quantity', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 500"
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
        <View style={s.row}>
          <Text style={s.label}>Harvest date</Text>
          <TextInput
            style={s.input}
            value={form.harvest_date}
            onChangeText={(v) => set('harvest_date', v)}
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
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Record harvest</Text>}
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>All Harvests</Text>
        {items.length === 0 ? (
          <Text style={s.empty}>No harvests yet. Record your first harvest above.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={s.listItem}>
              <Text style={s.itemTitle}>{item.quantity} {item.unit} — Crop #{item.crop}</Text>
              <Text style={s.itemMeta}>
                {item.harvest_date}{item.notes ? ` · ${item.notes}` : ''}
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
