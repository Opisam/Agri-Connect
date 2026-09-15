import { api, type ApiEnvelope, unwrap } from '../api/client';
import type {
  Listing,
  Order,
  OrderPayload,
  OrderUpdatePayload,
  Paged,
  ProduceCategory,
} from './types';

export const categoriesApi = {
  async list(): Promise<Paged<ProduceCategory>> {
    const { data } = await api.get<ApiEnvelope<Paged<ProduceCategory>>>(
      '/marketplace/categories/',
    );
    return unwrap(data);
  },
};

export const listingsApi = {
  async list(): Promise<Paged<Listing>> {
    const { data } = await api.get<ApiEnvelope<Paged<Listing>>>('/marketplace/listings/');
    return unwrap(data);
  },
};

export const ordersApi = {
  async list(): Promise<Paged<Order>> {
    const { data } = await api.get<ApiEnvelope<Paged<Order>>>('/marketplace/orders/');
    return unwrap(data);
  },
  async create(payload: OrderPayload): Promise<Order> {
    const { data } = await api.post<ApiEnvelope<Order>>('/marketplace/orders/', payload);
    return unwrap(data);
  },
  async update(id: number, payload: OrderUpdatePayload): Promise<Order> {
    const { data } = await api.patch<ApiEnvelope<Order>>(`/marketplace/orders/${id}/`, payload);
    return unwrap(data);
  },
};