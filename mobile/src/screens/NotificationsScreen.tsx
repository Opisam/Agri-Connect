import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getApiErrorMessage } from '../api/client';
import { notificationsApi } from '../notifications/api';
import type { AppNotification } from '../notifications/types';
import { farmStyles as s } from '../farms/styles';
import type { RootStackParamList } from '../../App';

type NotificationsNavigation = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

export function NotificationsScreen() {
  const navigation = useNavigation<NotificationsNavigation>();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const page = await notificationsApi.list();
      setItems(page.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markRead = async (id: number) => {
    try {
      setError(null);
      await notificationsApi.markRead(id);
      void load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const markAllRead = async () => {
    try {
      setError(null);
      await notificationsApi.markAllRead();
      void load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>Notifications</Text>
        <Text style={s.subtitle}>Updates about your orders and marketplace activity.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <View style={s.row}>
          <Pressable style={s.button} onPress={() => void markAllRead()}>
            <Text style={s.buttonText}>Mark all as read</Text>
          </Pressable>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Recent</Text>
        {items.length === 0 ? (
          <Text style={s.empty}>You have no notifications.</Text>
        ) : (
          items.map((item) => (
            <Pressable
              key={item.id}
              style={[s.listItem, item.is_read && s.itemMuted]}
              onPress={() => {
                if (!item.is_read) {
                  void markRead(item.id);
                }
                if (item.related_object_type === 'order') {
                  navigation.navigate('Orders');
                }
              }}
            >
              <Text style={s.itemTitle}>
                {item.title}
                {!item.is_read ? ' · New' : ''}
              </Text>
              <Text style={s.itemMeta}>{item.message}</Text>
              <Text style={s.itemMeta}>
                {formatDate(item.created_at)} · {item.notification_type}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}