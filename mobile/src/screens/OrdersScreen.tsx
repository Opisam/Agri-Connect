import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../auth/useAuth';
import { ordersApi } from '../marketplace/api';
import type { Order, OrderUpdatePayload } from '../marketplace/types';

export function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const page = await ordersApi.list();
      setOrders(page.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onAction = async (id: number, payload: OrderUpdatePayload) => {
    setBusy(true);
    setError(null);
    try {
      await ordersApi.update(id, payload);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const isFarmer = user?.role === 'FARMER';

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>{isFarmer ? 'Orders Received' : 'My Orders'}</Text>
        <Text style={s.subtitle}>
          {isFarmer ? 'Manage orders placed on your listings.' : 'Track your orders.'}
        </Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Orders</Text>
        {orders.length === 0 ? (
          <Text style={s.empty}>No orders yet.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={s.listItem}>
              <Text style={s.itemTitle}>
                {order.listing_product_name} · {order.status_display}
              </Text>
              <Text style={s.itemMeta}>
                {isFarmer ? `Buyer: ${order.buyer_name}` : `Seller: ${order.listing_product_name}`}
              </Text>
              <Text style={s.itemMeta}>
                {order.quantity} {order.listing_unit} · UGX{' '}
                {Number(order.total_price).toLocaleString()}
              </Text>
              {order.notes ? <Text style={s.itemMeta}>Note: {order.notes}</Text> : null}
              {order.farmer_notes ? (
                <Text style={s.itemMeta}>Farmer note: {order.farmer_notes}</Text>
              ) : null}
              <View style={s.itemActions}>
                {isFarmer && order.status === 'PENDING' && (
                  <>
                    <Pressable
                      style={[s.button, s.actionFlex, busy && s.buttonDisabled]}
                      disabled={busy}
                      onPress={() => void onAction(order.id, { status: 'ACCEPTED' })}
                    >
                      <Text style={s.buttonText}>Accept</Text>
                    </Pressable>
                    <Pressable
                      style={[s.buttonDanger, s.actionFlex, busy && s.buttonDisabled]}
                      disabled={busy}
                      onPress={() => void onAction(order.id, { status: 'REJECTED' })}
                    >
                      <Text style={s.buttonDangerText}>Reject</Text>
                    </Pressable>
                  </>
                )}
                {isFarmer && order.status === 'ACCEPTED' && (
                  <Pressable
                    style={[s.button, s.actionFlex, busy && s.buttonDisabled]}
                    disabled={busy}
                    onPress={() => void onAction(order.id, { status: 'COMPLETED' })}
                  >
                    {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Complete</Text>}
                  </Pressable>
                )}
                {!isFarmer && (order.status === 'PENDING' || order.status === 'ACCEPTED') && (
                  <Pressable
                    style={[s.buttonDanger, s.actionFlex, busy && s.buttonDisabled]}
                    disabled={busy}
                    onPress={() => void onAction(order.id, { status: 'CANCELLED' })}
                  >
                    <Text style={s.buttonDangerText}>Cancel order</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}