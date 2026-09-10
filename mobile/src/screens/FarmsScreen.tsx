import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { farmsApi } from '../farms/api';
import { FARM_TYPES, SIZE_UNITS, type Farm, type FarmPayload } from '../farms/types';
import type { RootStackParamList } from '../../App';

type FarmsNavigation = NativeStackNavigationProp<RootStackParamList, 'Farms'>;

const EMPTY_FORM: FarmPayload = {
  name: '',
  location: '',
  district: '',
  subcounty: '',
  size: '',
  size_unit: 'acres',
  farm_type: 'crop_farming',
  description: '',
};

export function FarmsScreen() {
  const navigation = useNavigation<FarmsNavigation>();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [form, setForm] = useState<FarmPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const page = await farmsApi.list();
      setFarms(page.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const set = <K extends keyof FarmPayload>(key: K, value: FarmPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await farmsApi.create(form);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (farm: Farm) => {
    Alert.alert('Delete farm', `Delete ${farm.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await farmsApi.remove(farm.id);
              await load();
            } catch (err) {
              setError(getApiErrorMessage(err));
            }
          })();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll}>
        <View>
          <Text style={s.title}>My Farms</Text>
          <Text style={s.subtitle}>Create and manage the farms you own.</Text>
        </View>

        {error && (
          <View style={s.alert}>
            <Text style={s.alertText}>{error}</Text>
          </View>
        )}

        <View style={s.card}>
          <Text style={s.label}>Add a Farm</Text>

          <View style={s.row}>
            <Text style={s.label}>Farm name</Text>
            <TextInput
              style={s.input}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="e.g. Okello Family Farm"
              placeholderTextColor="#8aa08a"
            />
          </View>

          <View style={s.row}>
            <Text style={s.label}>Location</Text>
            <TextInput
              style={s.input}
              value={form.location}
              onChangeText={(v) => set('location', v)}
              placeholder="e.g. Opit, Gulu"
              placeholderTextColor="#8aa08a"
            />
          </View>

          <View style={s.rowPair}>
            <View style={s.rowItem}>
              <Text style={s.label}>District</Text>
              <TextInput
                style={s.input}
                value={form.district}
                onChangeText={(v) => set('district', v)}
                placeholder="e.g. Gulu"
                placeholderTextColor="#8aa08a"
              />
            </View>
            <View style={s.rowItem}>
              <Text style={s.label}>Subcounty</Text>
              <TextInput
                style={s.input}
                value={form.subcounty}
                onChangeText={(v) => set('subcounty', v)}
                placeholder="e.g. Paicho"
                placeholderTextColor="#8aa08a"
              />
            </View>
          </View>

          <View style={s.rowPair}>
            <View style={s.rowItem}>
              <Text style={s.label}>Size</Text>
              <TextInput
                style={s.input}
                value={form.size}
                onChangeText={(v) => set('size', v)}
                keyboardType="decimal-pad"
                placeholder="e.g. 10"
                placeholderTextColor="#8aa08a"
              />
            </View>
            <View style={s.rowItem}>
              <Text style={s.label}>Size unit</Text>
              <View style={s.chips}>
                {SIZE_UNITS.map((u) => (
                  <Pressable
                    key={u.value}
                    style={[s.chip, form.size_unit === u.value && s.chipActive]}
                    onPress={() => set('size_unit', u.value)}
                  >
                    <Text style={[s.chipText, form.size_unit === u.value && s.chipTextActive]}>
                      {u.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>Farm type</Text>
            <View style={s.chips}>
              {FARM_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  style={[s.chip, form.farm_type === t.value && s.chipActive]}
                  onPress={() => set('farm_type', t.value)}
                >
                  <Text style={[s.chipText, form.farm_type === t.value && s.chipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.row}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              placeholder="Optional notes"
              placeholderTextColor="#8aa08a"
            />
          </View>

          <Pressable
            style={({ pressed }) => [s.button, (pressed || busy) && s.buttonDisabled]}
            disabled={busy}
            onPress={() => void onSubmit()}
          >
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Add farm</Text>}
          </Pressable>
        </View>

        <View style={s.card}>
          <Text style={s.label}>All Farms</Text>
          {farms.length === 0 ? (
            <Text style={s.empty}>No farms yet. Add your first farm above.</Text>
          ) : (
            farms.map((farm) => (
              <View key={farm.id} style={s.listItem}>
                <Text style={s.itemTitle}>{farm.name}</Text>
                <Text style={s.itemMeta}>
                  {farm.location}, {farm.district} · {farm.size} {farm.size_unit}
                </Text>
                <Text style={s.itemMeta}>
                  {farm.field_count} field{farm.field_count === 1 ? '' : 's'}
                </Text>
                <View style={s.itemActions}>
                  <Pressable
                    style={[s.buttonGhost, s.actionFlex]}
                    onPress={() =>
                      navigation.navigate('Fields', { farmId: farm.id, farmName: farm.name })
                    }
                  >
                    <Text style={s.buttonGhostText}>Fields</Text>
                  </Pressable>
                  <Pressable
                    style={[s.buttonDanger, s.actionFlex]}
                    onPress={() => onDelete(farm)}
                  >
                    <Text style={s.buttonDangerText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}