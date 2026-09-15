import { api, type ApiEnvelope, unwrap } from '../api/client';
import type { Article, ContentCategory, Paged } from './types';

export const contentApi = {
  async categories(): Promise<Paged<ContentCategory>> {
    const { data } = await api.get<ApiEnvelope<Paged<ContentCategory>>>('/content/categories/');
    return unwrap(data);
  },
};

export const articlesApi = {
  async list(params?: { search?: string; category?: number }): Promise<Paged<Article>> {
    const { data } = await api.get<ApiEnvelope<Paged<Article>>>('/content/articles/', {
      params,
    });
    return unwrap(data);
  },
  async detail(id: number): Promise<Article> {
    const { data } = await api.get<ApiEnvelope<Article>>(`/content/articles/${id}/`);
    return unwrap(data);
  },
};