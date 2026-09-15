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
import { expensesApi } from '../finance/api';
import { EXPENSE_CATEGORIES, type Expense, type ExpensePayload } from '../finance/types';
import type { RootStackParamList } from '../../App';

type ExpensesRoute = RouteProp<RootStackParamList, 'Expenses'>;

const EMPTY_FORM: ExpensePayload = {
  farm: 0,
  crop: null,
  category: 'Other',
  amount: '',
  date: '',
  description: '',
  notes: '',
};

export function ExpensesScreen() {
  const route = useRoute<ExpensesRoute>();
  const farmId = route.params.farmId;
  const [items, setItems] = useState<Expense[]>([]);
  const [form, setForm] = useState<ExpensePayload>({ ...EMPTY_FORM, farm: farmId });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await expensesApi.list();
        setItems(page.results.filter((e) => e.farm === farmId));
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    };
    void load();
  }, [farmId]);

  const set = <K extends keyof ExpensePayload>(key: K, value: ExpensePayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await expensesApi.create(form);
      setForm({ ...EMPTY_FORM, farm: farmId });
      const page = await expensesApi.list();
      setItems(page.results.filter((e) => e.farm === farmId));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (item: Expense) => {
    Alert.alert('Delete expense', `Delete this ${item.category_display} expense?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await expensesApi.remove(item.id);
              const page = await expensesApi.list();
              setItems(page.results.filter((e) => e.farm === farmId));
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
        <Text style={s.title}>Expenses</Text>
        <Text style={s.subtitle}>Record the costs of running your farm.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Add an Expense</Text>
        <View style={s.row}>
          <Text style={s.label}>Category</Text>
          <View style={s.chips}>
            {EXPENSE_CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                style={[s.chip, form.category === c.value && s.chipActive]}
                onPress={() => set('category', c.value)}
              >
                <Text style={[s.chipText, form.category === c.value && s.chipTextActive]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Amount (UGX)</Text>
            <TextInput
              style={s.input}
              value={form.amount}
              onChangeText={(v) => set('amount', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 50000"
              placeholderTextColor="#8aa08a"
            />
          </View>
          <View style={s.rowItem}>
            <Text style={s.label}>Date</Text>
            <TextInput
              style={s.input}
              value={form.date}
              onChangeText={(v) => set('date', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8aa08a"
            />
          </View>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Description</Text>
          <TextInput
            style={s.input}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="e.g. Maize seeds"
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
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Add expense</Text>}
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>All Expenses</Text>
        {items.length === 0 ? (
          <Text style={s.empty}>No expenses yet. Add your first expense above.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={s.listItem}>
              <Text style={s.itemTitle}>{item.category_display} — UGX {Number(item.amount).toLocaleString()}</Text>
              <Text style={s.itemMeta}>
                {item.date}{item.description ? ` · ${item.description}` : ''}
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
