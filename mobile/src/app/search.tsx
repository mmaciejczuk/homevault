import {
  router,
  Stack,
} from 'expo-router';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  apiFetch,
} from '../lib/api';

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
  category: string;

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
  properties:
    PropertyResult[];
  rooms:
    RoomResult[];
  entries:
    EntryResult[];
  documents:
    DocumentResult[];
}

const emptyResults:
  SearchResponse = {
    query: '',
    properties: [],
    rooms: [],
    entries: [],
    documents: [],
  };

export default function SearchScreen() {
  const [
    query,
    setQuery,
  ] =
    useState('');

  const [
    results,
    setResults,
  ] =
    useState<SearchResponse>(
      emptyResults,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    const normalized =
      query.trim();

    if (
      normalized.length <
      2
    ) {
      setResults(
        emptyResults,
      );

      setError(
        null,
      );

      setIsLoading(
        false,
      );

      return;
    }

    const timeout =
      setTimeout(
        () => {
          void runSearch(
            normalized,
          );
        },
        300,
      );

    return () => {
      clearTimeout(
        timeout,
      );
    };
  }, [query]);

  const runSearch =
    async (
      value: string,
    ) => {
      try {
        setIsLoading(
          true,
        );

        setError(
          null,
        );

        const response =
          await apiFetch(
            `/search?q=${encodeURIComponent(
              value,
            )}`,
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `Search API ${response.status}: ${body}`,
          );
        }

        const data:
          SearchResponse =
          await response.json();

        setResults(
          data,
        );
      } catch (err) {
        console.error(
          'Błąd wyszukiwania:',
          err,
        );

        setError(
          'Nie udało się wyszukać danych.',
        );
      } finally {
        setIsLoading(
          false,
        );
      }
    };

  const totalResults =
    results.properties.length +
    results.rooms.length +
    results.entries.length +
    results.documents.length;

  return (
    <>
      <Stack.Screen
        options={{
          title:
            'Wyszukiwanie',
        }}
      />

      <SafeAreaView
        style={
          styles.container
        }
        edges={['bottom']}
      >
        <View
          style={
            styles.searchContainer
          }
        >
          <TextInput
            value={query}
            onChangeText={
              setQuery
            }
            autoFocus
            placeholder="Szukaj w swoim domu..."
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            style={
              styles.input
            }
          />
        </View>

        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          {query.trim()
            .length < 2 && (
            <View
              style={
                styles.infoBox
              }
            >
              <Text
                style={
                  styles.infoIcon
                }
              >
                🔎
              </Text>

              <Text
                style={
                  styles.infoTitle
                }
              >
                Wyszukaj wszystko
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                Wpisz co najmniej 2 znaki. Możesz szukać domów, pomieszczeń, wpisów i nazw dokumentów.
              </Text>
            </View>
          )}

          {isLoading && (
            <View
              style={
                styles.loading
              }
            >
              <ActivityIndicator />

              <Text
                style={
                  styles.loadingText
                }
              >
                Szukam...
              </Text>
            </View>
          )}

          {!!error && (
            <Text
              style={
                styles.errorText
              }
            >
              {error}
            </Text>
          )}

          {!isLoading &&
            !error &&
            query.trim()
                .length >=
              2 &&
            totalResults ===
              0 && (
              <View
                style={
                  styles.infoBox
                }
              >
                <Text
                  style={
                    styles.infoIcon
                  }
                >
                  📭
                </Text>

                <Text
                  style={
                    styles.infoTitle
                  }
                >
                  Brak wyników
                </Text>

                <Text
                  style={
                    styles.infoText
                  }
                >
                  Nie znaleziono niczego dla „{query.trim()}”.
                </Text>
              </View>
            )}

          {results.properties
            .length >
            0 && (
            <SearchSection
              title="Domy"
            >
              {results.properties.map(
                (
                  item,
                ) => (
                  <ResultCard
                    key={`property-${item.id}`}
                    icon="🏠"
                    title={
                      item.name
                    }
                    subtitle={
                      item.address ??
                      'Dom'
                    }
                    onPress={() =>
                      router.push({
                        pathname:
                          '/property/[id]',
                        params: {
                          id:
                            String(
                              item.id,
                            ),
                        },
                      })
                    }
                  />
                ),
              )}
            </SearchSection>
          )}

          {results.rooms
            .length >
            0 && (
            <SearchSection
              title="Pomieszczenia"
            >
              {results.rooms.map(
                (
                  item,
                ) => (
                  <ResultCard
                    key={`room-${item.id}`}
                    icon="🚪"
                    title={
                      item.name
                    }
                    subtitle={`${item.property.name}${
                      item.floor
                        ? ` · ${item.floor}`
                        : ''
                    }`}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/room/[id]',
                        params: {
                          id:
                            String(
                              item.id,
                            ),
                        },
                      })
                    }
                  />
                ),
              )}
            </SearchSection>
          )}

          {results.entries
            .length >
            0 && (
            <SearchSection
              title="Wpisy"
            >
              {results.entries.map(
                (
                  item,
                ) => (
                  <ResultCard
                    key={`entry-${item.id}`}
                    icon="📝"
                    title={
                      item.title
                    }
                    subtitle={`${item.room.property.name} › ${item.room.name}`}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/entry/[id]',
                        params: {
                          id:
                            String(
                              item.id,
                            ),
                        },
                      })
                    }
                  />
                ),
              )}
            </SearchSection>
          )}

          {results.documents
            .length >
            0 && (
            <SearchSection
              title="Dokumenty"
            >
              {results.documents.map(
                (
                  item,
                ) => (
                  <ResultCard
                    key={`document-${item.id}`}
                    icon="📄"
                    title={
                      item.fileName
                    }
                    subtitle={`${item.entry.room.property.name} › ${item.entry.room.name} › ${item.entry.title}`}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/entry/[id]',
                        params: {
                          id:
                            String(
                              item.entryId,
                            ),
                        },
                      })
                    }
                  />
                ),
              )}
            </SearchSection>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children:
    React.ReactNode;
}) {
  return (
    <View
      style={
        styles.section
      }
    >
      <Text
        style={
          styles.sectionTitle
        }
      >
        {title}
      </Text>

      <View
        style={
          styles.resultsList
        }
      >
        {children}
      </View>
    </View>
  );
}

function ResultCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress:
    () => void;
}) {
  return (
    <Pressable
      onPress={
        onPress
      }
      style={({
        pressed,
      }) => [
        styles.resultCard,

        pressed &&
          styles.pressed,
      ]}
    >
      <View
        style={
          styles.resultIcon
        }
      >
        <Text
          style={
            styles.resultIconText
          }
        >
          {icon}
        </Text>
      </View>

      <View
        style={
          styles.resultContent
        }
      >
        <Text
          numberOfLines={2}
          style={
            styles.resultTitle
          }
        >
          {title}
        </Text>

        <Text
          numberOfLines={2}
          style={
            styles.resultSubtitle
          }
        >
          {subtitle}
        </Text>
      </View>

      <Text
        style={
          styles.arrow
        }
      >
        ›
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
    },

    searchContainer: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 12,
      backgroundColor:
        '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E5E7EB',
    },

    input: {
      minHeight: 48,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor:
        '#F3F4F6',
      fontSize: 16,
      color: '#111827',
    },

    content: {
      padding: 18,
      paddingBottom: 60,
    },

    loading: {
      paddingVertical: 30,
      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 10,
      color: '#6B7280',
    },

    errorText: {
      padding: 20,
      textAlign:
        'center',
      color: '#B91C1C',
    },

    infoBox: {
      paddingVertical: 50,
      paddingHorizontal: 25,
      alignItems:
        'center',
    },

    infoIcon: {
      fontSize: 38,
    },

    infoTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight:
        '700',
      color: '#111827',
    },

    infoText: {
      marginTop: 7,
      textAlign:
        'center',
      lineHeight: 21,
      color: '#6B7280',
    },

    section: {
      marginBottom: 28,
    },

    sectionTitle: {
      marginBottom: 10,
      fontSize: 14,
      fontWeight:
        '700',
      color: '#6B7280',
      textTransform:
        'uppercase',
    },

    resultsList: {
      gap: 10,
    },

    resultCard: {
      minHeight: 76,
      padding: 14,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    resultIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor:
        '#F3F4F6',
      alignItems:
        'center',
      justifyContent:
        'center',
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
      fontWeight:
        '600',
      color: '#111827',
    },

    resultSubtitle: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 18,
      color: '#6B7280',
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