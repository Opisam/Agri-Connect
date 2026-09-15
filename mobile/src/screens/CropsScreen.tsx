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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { cropsApi, fieldsApi, farmsApi } from '../farms/api';
import { CROP_STATUSES, CROP_TYPES, type Crop, type CropPayload } from '../farms/types';
import type { RootStackParamList } from '../../App';

type CropsNavigation = NativeStackNavigationProp<RootStackParamList, 'Crops'>;

const EMPTY_FORM: CropPayload = {
  field_id: 0,
  crop_type: 'maize',
  variety: '',
  planting_date: null,
  expected_harvest_date: null,
  status: 'PLANNED',
  notes: '',
};

export function CropsScreen() {
  const navigation = useNavigation<CropsNavigation>();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [options, setOptions] = useState<{ fieldId: number; label: string }[]>([]);
  const [form, setForm] = useState<CropPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cropPage, farmPage] = await Promise.all([cropsApi.list(), farmsApi.list()]);
        setCrops(cropPage.results);
        const allFields: { fieldId: number; label: string }[] = [];
        for (const farm of farmPage.results) {
          const fieldPage = await fieldsApi.list(farm.id);
          fieldPage.results.forEach((f) =>
            allFields.push({ fieldId: f.id, label: `${f.name} · ${farm.name}` }),
          );
        }
        setOptions(allFields);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    };
    void load();
  }, []);

  const set = <K extends keyof CropPayload>(key: K, value: CropPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    if (!form.field_id) {
      setError('Please choose the field where this crop is planted.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await cropsApi.create(form);
      setForm(EMPTY_FORM);
      const page = await cropsApi.list();
      setCrops(page.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (crop: Crop) => {
    Alert.alert('Delete crop', `Delete ${crop.crop_type_display} record?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await cropsApi.remove(crop.id);
              const page = await cropsApi.list();
              setCrops(page.results);
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
        <Text style={s.title}>My Crops</Text>
        <Text style={s.subtitle}>Track what is growing on your fields.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Record a Crop</Text>

        <View style={s.row}>
          <Text style={s.label}>Field</Text>
          <View style={s.chips}>
            {options.length === 0 && <Text style={s.empty}>Add a field to your farms first.</Text>}
            {options.map((o) => (
              <Pressable
                key={o.fieldId}
                style={[s.chip, form.field_id === o.fieldId && s.chipActive]}
                onPress={() => set('field_id', o.fieldId)}
              >
                <Text style={[s.chipText, form.field_id === o.fieldId && s.chipTextActive]}>
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Crop type</Text>
          <View style={s.chips}>
            {CROP_TYPES.map((t) => (
              <Pressable
                key={t.value}
                style={[s.chip, form.crop_type === t.value && s.chipActive]}
                onPress={() => set('crop_type', t.value)}
              >
                <Text style={[s.chipText, form.crop_type === t.value && s.chipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Status</Text>
          <View style={s.chips}>
            {CROP_STATUSES.map((st) => (
              <Pressable
                key={st.value}
                style={[s.chip, form.status === st.value && s.chipActive]}
                onPress={() => set('status', st.value)}
              >
                <Text style={[s.chipText, form.status === st.value && s.chipTextActive]}>
                  {st.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={s.row}>
          <Text style={s.label}>Variety</Text>
          <TextInput
            style={s.input}
            value={form.variety}
            onChangeText={(v) => set('variety', v)}
            placeholder="e.g. Longe 5"
            placeholderTextColor="#8aa08a"
          />
        </View>

        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Planting date</Text>
            <TextInput
              style={s.input}
              value={form.planting_date ?? ''}
              onChangeText={(v) => set('planting_date', v || null)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8aa08a"
            />
          </View>
          <View style={s.rowItem}>
            <Text style={s.label}>Harvest date</Text>
            <TextInput
              style={s.input}
              value={form.expected_harvest_date ?? ''}
              onChangeText={(v) => set('expected_harvest_date', v || null)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8aa08a"
            />
          </View>
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
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Add crop</Text>}
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>All Crops</Text>
        {crops.length === 0 ? (
          <Text style={s.empty}>No crops yet. Record your first crop above.</Text>
        ) : (
          crops.map((crop) => (
            <View key={crop.id} style={s.listItem}>
              <Text style={s.itemTitle}>
                {crop.crop_type_display}
                {crop.variety ? ` — ${crop.variety}` : ''}
              </Text>
              <Text style={s.itemMeta}>
                {crop.field_name} · {crop.farm_name} · {crop.status_display}
              </Text>
              <View style={s.itemActions}>
                <Pressable
                  style={[s.buttonGhost, s.actionFlex]}
                  onPress={() =>
                    navigation.navigate('Activities', {
                      cropId: crop.id,
                      cropLabel: `${crop.crop_type_display} — ${crop.field_name}`,
                    })
                  }
                >
                  <Text style={s.buttonGhostText}>Activities</Text>
                </Pressable>
                <Pressable
                  style={[s.buttonDanger, s.actionFlex]}
                  onPress={() => onDelete(crop)}
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