import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { farmStyles as s } from '../farms/styles';
import { getApiErrorMessage } from '../api/client';
import { articlesApi, contentApi } from '../content/api';
import type { Article, ContentCategory } from '../content/types';
import type { RootStackParamList } from '../../App';

type GuidesNavigation = NativeStackNavigationProp<RootStackParamList, 'Guides'>;

export function GuidesScreen() {
  const navigation = useNavigation<GuidesNavigation>();

  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const [categoryPage, articlePage] = await Promise.all([
        contentApi.categories(),
        articlesApi.list(),
      ]);
      setCategories(categoryPage.results);
      setArticles(articlePage.results);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = articles.filter((a) => {
    const matchSearch =
      !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === null || a.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <ScrollView style={s.flex} contentContainerStyle={s.scroll}>
      <View>
        <Text style={s.title}>Agricultural Guides</Text>
        <Text style={s.subtitle}>Practical advice on crops, livestock and farming.</Text>
      </View>

      {error && (
        <View style={s.alert}>
          <Text style={s.alertText}>{error}</Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Search</Text>
        <TextInput
          style={s.input}
          value={search}
          onChangeText={setSearch}
          placeholder="e.g. maize"
          placeholderTextColor="#8aa08a"
        />
        <Text style={s.label}>Category</Text>
        <View style={s.chips}>
          <Pressable
            style={[s.chip, categoryFilter === null && s.chipActive]}
            onPress={() => setCategoryFilter(null)}
          >
            <Text style={[s.chipText, categoryFilter === null && s.chipTextActive]}>
              All
            </Text>
          </Pressable>
          {categories.map((c) => (
            <Pressable
              key={c.id}
              style={[s.chip, categoryFilter === c.id && s.chipActive]}
              onPress={() => setCategoryFilter(c.id)}
            >
              <Text style={[s.chipText, categoryFilter === c.id && s.chipTextActive]}>
                {c.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.label}>Guides</Text>
        {filtered.length === 0 ? (
          <Text style={s.empty}>No guides match your filters.</Text>
        ) : (
          filtered.map((article) => (
            <Pressable
              key={article.id}
              style={s.listItem}
              onPress={() =>
                navigation.navigate('Article', {
                  articleId: article.id,
                  title: article.title,
                })
              }
            >
              <Text style={s.itemTitle}>{article.title}</Text>
              <Text style={s.itemMeta}>
                {article.category_name ? `${article.category_name} · ` : ''}
                {formatDate(article.created_at)}
                {article.author_name ? ` · ${article.author_name}` : ''}
              </Text>
            </Pressable>
          ))
        )}
      </View>
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