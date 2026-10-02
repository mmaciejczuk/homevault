import { router, Stack } from 'expo-router';

import { useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '../lib/api';

type EntryCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HEATING'
  | 'WALL'
  | 'FLOOR'
  | 'DEVICE'
  | 'NOTE'
  | 'OTHER';

interface PropertyResult {
  id: number;
  name: string;
  address?: string | null;
}

interface RoomResult {
  id: number;
  name: string;
  floor?: string | null;

  property: {
    id: number;
    name: string;
  };
}

interface EntryResult {
  id: number;
  title: string;
  description?: string | null;
  category: EntryCategory;
  tags: string[];

  room: {
    id: number;
    name: string;

    property: {
      id: number;
      name: string;
    };
  };
}

interface DocumentResult {
  id: number;
  fileName: string;
  size: number;
  entryId: number;

  entry: {
    id: number;
    title: string;

    room: {
      id: number;
      name: string;

      property: {
        id: number;
        name: string;
      };
    };
  };
}

interface SearchResponse {
  query: string;
  properties: PropertyResult[];
  rooms: RoomResult[];
  entries: EntryResult[];
  documents: DocumentResult[];
}

const emptyResults: SearchResponse = {
  query: '',
  properties: [],
  rooms: [],
  entries: [],
  documents: [],
};

const categoryLabels: Record<EntryCategory, string> = {
  ELECTRICAL: 'Elektryka',
  PLUMBING: 'Hydraulika',
  HEATING: 'Ogrzewanie',
  WALL: 'Ściany',
  FLOOR: 'Podłoga',
  DEVICE: 'Urządzenie',
  NOTE: 'Notatka',
  OTHER: 'Inne',
};

const categoryIcons: Record<EntryCategory, string> = {
  ELECTRICAL: '⚡',
  PLUMBING: '💧',
  HEATING: '🔥',
  WALL: '🧱',
  FLOOR: '🪵',
  DEVICE: '🔧',
  NOTE: '📝',
  OTHER: '📌',
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');

  const [results, setResults] = useState<SearchResponse>(emptyResults);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * Każde wyszukiwanie dostaje własny numer.
   *
   * Jeśli użytkownik szybko wpisze np.:
   *
   * pie
   * piec
   * piec viessmann
   *
   * starsza odpowiedź nie może nadpisać nowszej.
   */
  const requestIdRef = useRef(0);

  useEffect(() => {
    const normalized = query.trim();

    if (normalized.length < 2) {
      requestIdRef.current += 1;

      setResults(emptyResults);
      setError(null);
      setIsLoading(false);

      return;
    }

    const timeout = setTimeout(() => {
      const requestId = requestIdRef.current + 1;

      requestIdRef.current = requestId;

      void runSearch(normalized, requestId);
    }, 300);

    return () => {
      clearTimeout(timeout);
    };
  }, [query]);

  const runSearch = async (value: string, requestId: number) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiFetch(`/search?q=${encodeURIComponent(value)}`);

      if (!response.ok) {
        const body = await response.text();

        throw new Error(`Search API ${response.status}: ${body}`);
      }

      const data: SearchResponse = await response.json();

      /*
       * W międzyczasie mogło rozpocząć się nowsze
       * wyszukiwanie.
       */
      if (requestId !== requestIdRef.current) {
        return;
      }

      setResults({
        ...data,

        entries: data.entries.map((entry) => ({
          ...entry,
          tags: entry.tags ?? [],
        })),
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      console.error('Błąd wyszukiwania:', err);

      setError('Nie udało się wyszukać danych.');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const totalResults =
    results.properties.length +
    results.rooms.length +
    results.entries.length +
    results.documents.length;

  const normalizedQuery = query.trim();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Wyszukiwanie',
        }}
      />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Text style={styles.searchIcon}>🔎</Text>

            <TextInput
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              placeholder="Szukaj w swoim domu..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
              style={styles.input}
            />

            {!!query && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={10}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {normalizedQuery.length < 2 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>🔎</Text>

              <Text style={styles.infoTitle}>Wyszukaj wszystko</Text>

              <Text style={styles.infoText}>
                Wpisz co najmniej 2 znaki. Możesz szukać domów, pomieszczeń, wpisów, tagów i nazw
                dokumentów.
              </Text>

              <View style={styles.examples}>
                <Text style={styles.examplesTitle}>Przykłady</Text>

                <View style={styles.exampleTags}>
                  <ExampleChip label="piec" />
                  <ExampleChip label="gwarancja" />
                  <ExampleChip label="faktura" />
                  <ExampleChip label="łazienka" />
                  <ExampleChip label="elektryka" />
                </View>
              </View>
            </View>
          )}

          {isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator />

              <Text style={styles.loadingText}>Szukam...</Text>
            </View>
          )}

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {!isLoading && !error && normalizedQuery.length >= 2 && totalResults === 0 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>📭</Text>

              <Text style={styles.infoTitle}>Brak wyników</Text>

              <Text style={styles.infoText}>Nie znaleziono niczego dla „{normalizedQuery}”.</Text>
            </View>
          )}

          {!isLoading && !error && totalResults > 0 && (
            <Text style={styles.resultsSummary}>
              {totalResults === 1 ? '1 wynik' : `${totalResults} wyników`}
            </Text>
          )}

          {results.properties.length > 0 && (
            <SearchSection title="Domy" count={results.properties.length}>
              {results.properties.map((item) => (
                <ResultCard
                  key={`property-${item.id}`}
                  icon="🏠"
                  title={item.name}
                  subtitle={item.address ?? 'Nieruchomość'}
                  onPress={() =>
                    router.push({
                      pathname: '/property/[id]',
                      params: {
                        id: String(item.id),
                      },
                    })
                  }
                />
              ))}
            </SearchSection>
          )}

          {results.rooms.length > 0 && (
            <SearchSection title="Pomieszczenia" count={results.rooms.length}>
              {results.rooms.map((item) => (
                <ResultCard
                  key={`room-${item.id}`}
                  icon="🚪"
                  title={item.name}
                  subtitle={`${item.property.name}${item.floor ? ` · ${item.floor}` : ''}`}
                  onPress={() =>
                    router.push({
                      pathname: '/room/[id]',
                      params: {
                        id: String(item.id),
                      },
                    })
                  }
                />
              ))}
            </SearchSection>
          )}

          {results.entries.length > 0 && (
            <SearchSection title="Wpisy" count={results.entries.length}>
              {results.entries.map((item) => (
                <ResultCard
                  key={`entry-${item.id}`}
                  icon={categoryIcons[item.category] ?? '📝'}
                  title={item.title}
                  subtitle={`${item.room.property.name} › ${item.room.name} · ${
                    categoryLabels[item.category] ?? 'Wpis'
                  }`}
                  tags={item.tags}
                  onPress={() =>
                    router.push({
                      pathname: '/entry/[id]',
                      params: {
                        id: String(item.id),
                      },
                    })
                  }
                />
              ))}
            </SearchSection>
          )}

          {results.documents.length > 0 && (
            <SearchSection title="Dokumenty" count={results.documents.length}>
              {results.documents.map((item) => (
                <ResultCard
                  key={`document-${item.id}`}
                  icon="📄"
                  title={item.fileName}
                  subtitle={`${item.entry.room.property.name} › ${item.entry.room.name} › ${item.entry.title} · ${formatFileSize(
                    item.size,
                  )}`}
                  onPress={() =>
                    router.push({
                      pathname: '/entry/[id]',
                      params: {
                        id: String(item.entryId),
                      },
                    })
                  }
                />
              ))}
            </SearchSection>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function SearchSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>

        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{count}</Text>
        </View>
      </View>

      <View style={styles.resultsList}>{children}</View>
    </View>
  );
}

function ResultCard({
  icon,
  title,
  subtitle,
  tags,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  tags?: string[];
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.resultCard, pressed && styles.pressed]}
    >
      <View style={styles.resultIcon}>
        <Text style={styles.resultIconText}>{icon}</Text>
      </View>

      <View style={styles.resultContent}>
        <Text numberOfLines={2} style={styles.resultTitle}>
          {title}
        </Text>

        <Text numberOfLines={2} style={styles.resultSubtitle}>
          {subtitle}
        </Text>

        {!!tags?.length && (
          <View style={styles.tags}>
            {tags.slice(0, 4).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}

            {tags.length > 4 && <Text style={styles.moreTags}>+{tags.length - 4}</Text>}
          </View>
        )}
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

function ExampleChip({ label }: { label: string }) {
  return (
    <View style={styles.exampleChip}>
      <Text style={styles.exampleChipText}>{label}</Text>
    </View>
  );
}

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes = bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes = kilobytes / 1024;

  return `${megabytes.toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  searchContainer: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  searchInputContainer: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchIcon: {
    marginRight: 9,
    fontSize: 18,
  },

  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    color: '#111827',
  },

  clearButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clearButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },

  content: {
    padding: 18,
    paddingBottom: 60,
  },

  loading: {
    paddingVertical: 30,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  },

  errorText: {
    padding: 20,
    textAlign: 'center',
    color: '#B91C1C',
  },

  infoBox: {
    paddingVertical: 50,
    paddingHorizontal: 25,
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: 38,
  },

  infoTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  infoText: {
    marginTop: 7,
    maxWidth: 420,
    textAlign: 'center',
    lineHeight: 21,
    color: '#6B7280',
  },

  examples: {
    marginTop: 24,
    alignItems: 'center',
  },

  examplesTitle: {
    marginBottom: 9,
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  exampleTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
  },

  exampleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  exampleChipText: {
    color: '#6B7280',
    fontSize: 12,
  },

  resultsSummary: {
    marginBottom: 18,
    color: '#6B7280',
    fontSize: 13,
  },

  section: {
    marginBottom: 28,
  },

  sectionHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },

  sectionCount: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCountText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
  },

  resultsList: {
    gap: 10,
  },

  resultCard: {
    minHeight: 76,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultIconText: {
    fontSize: 24,
  },

  resultContent: {
    flex: 1,
    marginLeft: 13,
  },

  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  resultSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },

  tags: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },

  tag: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
  },

  tagText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '600',
  },

  moreTags: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
  },

  arrow: {
    marginLeft: 10,
    fontSize: 28,
    color: '#9CA3AF',
  },

  pressed: {
    opacity: 0.7,
  },
});
