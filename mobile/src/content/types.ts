export interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ContentCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}

export interface Article {
  id: number;
  category: number | null;
  category_name: string | null;
  author: number | null;
  author_name: string | null;
  title: string;
  slug: string;
  content: string;
  image: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}