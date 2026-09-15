import { api, type ApiEnvelope, unwrap } from '../api/client';
import type {
  Expense,
  ExpensePayload,
  Harvest,
  HarvestPayload,
  Paged,
  Sale,
  SalePayload,
} from './types';

export const expensesApi = {
  async list(): Promise<Paged<Expense>> {
    const { data } = await api.get<ApiEnvelope<Paged<Expense>>>('/finance/expenses/');
    return unwrap(data);
  },
  async create(payload: ExpensePayload): Promise<Expense> {
    const { data } = await api.post<ApiEnvelope<Expense>>('/finance/expenses/', payload);
    return unwrap(data);
  },
  async update(id: number, payload: Partial<ExpensePayload>): Promise<Expense> {
    const { data } = await api.patch<ApiEnvelope<Expense>>(`/finance/expenses/${id}/`, payload);
    return unwrap(data);
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/finance/expenses/${id}/`);
  },
};

export const harvestsApi = {
  async list(): Promise<Paged<Harvest>> {
    const { data } = await api.get<ApiEnvelope<Paged<Harvest>>>('/finance/harvests/');
    return unwrap(data);
  },
  async create(payload: HarvestPayload): Promise<Harvest> {
    const { data } = await api.post<ApiEnvelope<Harvest>>('/finance/harvests/', payload);
    return unwrap(data);
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/finance/harvests/${id}/`);
  },
};

export const salesApi = {
  async list(): Promise<Paged<Sale>> {
    const { data } = await api.get<ApiEnvelope<Paged<Sale>>>('/finance/sales/');
    return unwrap(data);
  },
  async create(payload: SalePayload): Promise<Sale> {
    const { data } = await api.post<ApiEnvelope<Sale>>('/finance/sales/', payload);
    return unwrap(data);
  },
  async remove(id: number): Promise<void> {
    await api.delete(`/finance/sales/${id}/`);
  },
};
