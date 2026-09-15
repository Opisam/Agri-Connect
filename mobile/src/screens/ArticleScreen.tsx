import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { articlesApi } from '../content/api';
import type { Article } from '../content/types';
import type { RootStackParamList } from '../../App';

type ArticleRoute = RouteProp<RootStackParamList, 'Article'>;

export function ArticleScreen() {
  const route = useRoute<ArticleRoute>();
  const { articleId } = route.params;

  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const data = await articlesApi.detail(articleId);
      setArticle(data);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, [articleId]);

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      {!article && !error && <Text style={s.empty}>Loading article…</Text>}

      {article && (
        <View style={s.card}>
          <Text style={s.title}>{article.title}</Text>
          <Text style={s.itemMeta}>
            {article.category_name ? `${article.category_name} · ` : ''}
            {formatDate(article.created_at)}
            {article.author_name ? ` · ${article.author_name}` : ''}
          </Text>
          {article.image && (
            <Text style={s.itemMeta}>Image: {article.image}</Text>
          )}
          {article.content.split('\n').map((paragraph, index) => (
            <Text key={index} style={s.bodyText}>
              {paragraph}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}