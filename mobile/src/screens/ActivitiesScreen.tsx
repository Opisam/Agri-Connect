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
import { activitiesApi } from '../farms/api';
import { ACTIVITY_TYPES, type CropActivity, type CropActivityPayload } from '../farms/types';
import type { RootStackParamList } from '../../App';

type ActivitiesScreenRoute = RouteProp<RootStackParamList, 'Activities'>;

const today = new Date().toISOString().slice(0, 10);

const EMPTY_FORM: CropActivityPayload = {
  activity_type: 'land_preparation',
  date: today,
  description: '',
  cost: '0',
  notes: '',
};

export function ActivitiesScreen() {
  const route = useRoute<ActivitiesScreenRoute>();
  const cropId = route.params.cropId;
  const [activities, setActivities] = useState<CropActivity[]>([]);
  const [form, setForm] = useState<CropActivityPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await activitiesApi.list(cropId);
        setActivities(page.results);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    };
    void load();
  }, [cropId]);

  const set = <K extends keyof CropActivityPayload>(key: K, value: CropActivityPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await activitiesApi.create(cropId, form);
      setForm({ ...EMPTY_FORM, date: today });
      const page = await activitiesApi.list(cropId);
      setActivities(page.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (activity: CropActivity) => {
    Alert.alert('Delete activity', `Delete ${activity.activity_type_display} record?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await activitiesApi.remove(activity.id);
              const page = await activitiesApi.list(cropId);
              setActivities(page.results);
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
        <Text style={s.title}>{route.params.cropLabel || `Crop #${cropId}`}</Text>
        <Text style={s.subtitle}>Record farming activities for this crop.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Record an Activity</Text>

        <View style={s.row}>
          <Text style={s.label}>Activity type</Text>
          <View style={s.chips}>
            {ACTIVITY_TYPES.map((t) => (
              <Pressable
                key={t.value}
                style={[s.chip, form.activity_type === t.value && s.chipActive]}
                onPress={() => set('activity_type', t.value)}
              >
                <Text style={[s.chipText, form.activity_type === t.value && s.chipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.rowPair}>
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
          <View style={s.rowItem}>
            <Text style={s.label}>Cost (UGX)</Text>
            <TextInput
              style={s.input}
              value={form.cost}
              onChangeText={(v) => set('cost', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 15000"
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
            placeholder="e.g. Second weeding round"
            placeholderTextColor="#8aa08a"
          />
        </View>

        <View style={s.row}>
          <Text style={s.label}>Notes</Text>
          <TextInput
            style={[s.input, s.inputMultiline]}
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
            multiline
            placeholder="Optional"
            placeholderTextColor="#8aa08a"
          />
        </View>

        <Pressable
          style={({ pressed }) => [s.button, (pressed || busy) && s.buttonDisabled]}
          disabled={busy}
          onPress={() => void onSubmit()}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Add activity</Text>}
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>All Activities</Text>
        {activities.length === 0 ? (
          <Text style={s.empty}>No activities yet. Record the first activity above.</Text>
        ) : (
          activities.map((activity) => (
            <View key={activity.id} style={s.listItem}>
              <Text style={s.itemTitle}>{activity.activity_type_display}</Text>
              <Text style={s.itemMeta}>
                {activity.date}
                {activity.description ? ` · ${activity.description}` : ''}
                {Number(activity.cost) > 0 ? ` · UGX ${Number(activity.cost).toLocaleString()}` : ''}
              </Text>
              <View style={s.itemActions}>
                <Pressable
                  style={[s.buttonDanger, s.actionFlex]}
                  onPress={() => onDelete(activity)}
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