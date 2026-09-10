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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { fieldsApi } from '../farms/api';
import { SIZE_UNITS, type Field, type FieldPayload } from '../farms/types';
import type { RootStackParamList } from '../../App';

type FieldsScreenRoute = RouteProp<RootStackParamList, 'Fields'>;

const EMPTY_FORM: FieldPayload = {
  name: '',
  size: '',
  size_unit: 'acres',
  description: '',
};

export function FieldsScreen() {
  const route = useRoute<FieldsScreenRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const farmId = route.params.farmId;
  const [fields, setFields] = useState<Field[]>([]);
  const [form, setForm] = useState<FieldPayload>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const page = await fieldsApi.list(farmId);
        setFields(page.results);
      } catch (err) {
        setError(getApiErrorMessage(err));
      }
    };
    void load();
  }, [farmId]);

  const set = <K extends keyof FieldPayload>(key: K, value: FieldPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await fieldsApi.create(farmId, form);
      setForm(EMPTY_FORM);
      const page = await fieldsApi.list(farmId);
      setFields(page.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = (field: Field) => {
    Alert.alert('Delete field', `Delete ${field.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await fieldsApi.remove(field.id);
              const page = await fieldsApi.list(farmId);
              setFields(page.results);
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
        <Text style={s.title}>{route.params.farmName || `Farm #${farmId}`}</Text>
        <Text style={s.subtitle}>Manage the fields on this farm.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Add a Field</Text>
        <View style={s.row}>
          <Text style={s.label}>Field name</Text>
          <TextInput
            style={s.input}
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="e.g. Field A"
            placeholderTextColor="#8aa08a"
          />
        </View>
        <View style={s.rowPair}>
          <View style={s.rowItem}>
            <Text style={s.label}>Size</Text>
            <TextInput
              style={s.input}
              value={form.size}
              onChangeText={(v) => set('size', v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 4"
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
          <Text style={s.label}>Description</Text>
          <TextInput
            style={s.input}
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="Optional"
            placeholderTextColor="#8aa08a"
          />
        </View>
        <Pressable
          style={({ pressed }) => [s.button, (pressed || busy) && s.buttonDisabled]}
          disabled={busy}
          onPress={() => void onSubmit()}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Add field</Text>}
        </Pressable>
      </View>

      <View style={s.card}>
        <Text style={s.label}>All Fields</Text>
        {fields.length === 0 ? (
          <Text style={s.empty}>No fields yet. Add your first field above.</Text>
        ) : (
          fields.map((field) => (
            <View key={field.id} style={s.listItem}>
              <Text style={s.itemTitle}>{field.name}</Text>
              <Text style={s.itemMeta}>
                {field.size} {field.size_unit}
                {field.description ? ` · ${field.description}` : ''}
              </Text>
              <View style={s.itemActions}>
                <Pressable
                  style={[s.buttonGhost, s.actionFlex]}
                  onPress={() =>
                    navigation.navigate('Crops', { fieldId: field.id, fieldName: field.name })
                  }
                >
                  <Text style={s.buttonGhostText}>Plant crops</Text>
                </Pressable>
                <Pressable
                  style={[s.buttonDanger, s.actionFlex]}
                  onPress={() => onDelete(field)}
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