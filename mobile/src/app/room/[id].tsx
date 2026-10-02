import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  apiFetch,
} from '../../lib/api';

interface Property {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  floor?: string;
  description?: string;
  propertyId: number;
  property: Property;
}

type EntryCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HEATING'
  | 'WALL'
  | 'FLOOR'
  | 'DEVICE'
  | 'NOTE'
  | 'OTHER';

interface Entry {
  id: number;
  title: string;
  description?: string;
  category: EntryCategory;
  tags: string[];
  roomId: number;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels:
  Record<EntryCategory, string> = {
    ELECTRICAL:
      'Elektryka',

    PLUMBING:
      'Hydraulika',

    HEATING:
      'Ogrzewanie',

    WALL:
      'Ściany',

    FLOOR:
      'Podłoga',

    DEVICE:
      'Urządzenie',

    NOTE:
      'Notatka',

    OTHER:
      'Inne',
  };

const categoryIcons:
  Record<EntryCategory, string> = {
    ELECTRICAL:
      '⚡',

    PLUMBING:
      '💧',

    HEATING:
      '🔥',

    WALL:
      '🧱',

    FLOOR:
      '🪵',

    DEVICE:
      '🔧',

    NOTE:
      '📝',

    OTHER:
      '📌',
  };

const categories:
  EntryCategory[] = [
    'ELECTRICAL',
    'PLUMBING',
    'HEATING',
    'WALL',
    'FLOOR',
    'DEVICE',
    'NOTE',
    'OTHER',
  ];

export default function RoomDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [
    room,
    setRoom,
  ] =
    useState<Room | null>(
      null,
    );

  const [
    entries,
    setEntries,
  ] =
    useState<Entry[]>([]);

  const [
    selectedCategory,
    setSelectedCategory,
  ] =
    useState<
      EntryCategory | null
    >(null);

  const [
    selectedTag,
    setSelectedTag,
  ] =
    useState<
      string | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const loadData =
    useCallback(
      async () => {
        if (!id) {
          return;
        }

        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const [
            roomResponse,
            entriesResponse,
          ] =
            await Promise.all([
              apiFetch(
                `/rooms/${id}`,
              ),

              apiFetch(
                `/rooms/${id}/entries`,
              ),
            ]);

          if (
            !roomResponse.ok
          ) {
            throw new Error(
              await roomResponse.text(),
            );
          }

          if (
            !entriesResponse.ok
          ) {
            throw new Error(
              await entriesResponse.text(),
            );
          }

          const roomData:
            Room =
            await roomResponse.json();

          const entriesData:
            Entry[] =
            await entriesResponse.json();

          setRoom(
            roomData,
          );

          setEntries(
            entriesData.map(
              (entry) => ({
                ...entry,

                tags:
                  entry.tags ??
                  [],
              }),
            ),
          );
        } catch (err) {
          console.error(
            'Błąd pobierania pomieszczenia:',
            err,
          );

          setError(
            'Nie udało się pobrać danych pomieszczenia.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [id],
    );

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const availableTags =
    useMemo(() => {
      const tags =
        entries.flatMap(
          (entry) =>
            entry.tags ??
            [],
        );

      return [
        ...new Set(
          tags,
        ),
      ].sort(
        (
          first,
          second,
        ) =>
          first.localeCompare(
            second,
            'pl',
          ),
      );
    }, [entries]);

  const filteredEntries =
    useMemo(
      () =>
        entries.filter(
          (entry) => {
            if (
              selectedCategory &&
              entry.category !==
                selectedCategory
            ) {
              return false;
            }

            if (
              selectedTag &&
              !entry.tags.includes(
                selectedTag,
              )
            ) {
              return false;
            }

            return true;
          },
        ),
      [
        entries,
        selectedCategory,
        selectedTag,
      ],
    );

  const hasActiveFilters =
    selectedCategory !==
      null ||
    selectedTag !==
      null;

  const handleAddEntry =
    () => {
      router.push({
        pathname:
          '/room/[id]/create-entry',

        params: {
          id,
        },
      });
    };

  const handleOpenEntry =
    (
      entryId: number,
    ) => {
      router.push({
        pathname:
          '/entry/[id]',

        params: {
          id:
            entryId.toString(),
        },
      });
    };

  const handleEditRoom =
    () => {
      router.push({
        pathname:
          '/room/[id]/edit',

        params: {
          id,
        },
      });
    };

  const clearFilters =
    () => {
      setSelectedCategory(
        null,
      );

      setSelectedTag(
        null,
      );
    };

  const handleDeleteRoom =
    async () => {
      if (!id) {
        return;
      }

      const confirmed =
        Platform.OS ===
        'web'
          ? window.confirm(
              'Usunąć pomieszczenie wraz ze wszystkimi wpisami i załącznikami?',
            )
          : await new Promise<boolean>(
              (
                resolve,
              ) => {
                Alert.alert(
                  'Usuń pomieszczenie',

                  'Usunięte zostaną również wszystkie wpisy i załączniki.',

                  [
                    {
                      text:
                        'Anuluj',

                      style:
                        'cancel',

                      onPress:
                        () =>
                          resolve(
                            false,
                          ),
                    },

                    {
                      text:
                        'Usuń',

                      style:
                        'destructive',

                      onPress:
                        () =>
                          resolve(
                            true,
                          ),
                    },
                  ],

                  {
                    cancelable:
                      true,

                    onDismiss:
                      () =>
                        resolve(
                          false,
                        ),
                  },
                );
              },
            );

      if (!confirmed) {
        return;
      }

      try {
        setIsDeleting(
          true,
        );

        const response =
          await apiFetch(
            `/rooms/${id}`,
            {
              method:
                'DELETE',
            },
          );

        if (!response.ok) {
          throw new Error(
            await response.text(),
          );
        }

        router.replace({
          pathname:
            '/property/[id]/rooms',

          params: {
            id:
              room?.propertyId.toString() ??
              '',
          },
        });
      } catch (err) {
        console.error(
          'Błąd usuwania pomieszczenia:',
          err,
        );

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            'Nie udało się usunąć pomieszczenia.',
          );
        } else {
          Alert.alert(
            'Błąd',
            'Nie udało się usunąć pomieszczenia.',
          );
        }
      } finally {
        setIsDeleting(
          false,
        );
      }
    };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Pomieszczenie',
          }}
        />

        <SafeAreaView
          style={
            styles.container
          }
        >
          <View
            style={
              styles.center
            }
          >
            <ActivityIndicator
              size="large"
            />

            <Text
              style={
                styles.infoText
              }
            >
              Pobieranie pomieszczenia...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (
    error ||
    !room
  ) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Pomieszczenie',
          }}
        />

        <SafeAreaView
          style={
            styles.container
          }
        >
          <View
            style={
              styles.center
            }
          >
            <Text
              style={
                styles.errorTitle
              }
            >
              Wystąpił błąd
            </Text>

            <Text
              style={
                styles.infoText
              }
            >
              {error}
            </Text>

            <Pressable
              style={
                styles.button
              }
              onPress={
                loadData
              }
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                Spróbuj ponownie
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title:
            `${room.property.name} › ${room.name}`,
        }}
      />

      <SafeAreaView
        style={
          styles.container
        }
        edges={[
          'bottom',
        ]}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
        >
          <Text
            style={
              styles.roomIcon
            }
          >
            🚪
          </Text>

          <Text
            style={
              styles.roomName
            }
          >
            {room.name}
          </Text>

          {room.floor && (
            <Text
              style={
                styles.roomDetail
              }
            >
              {room.floor}
            </Text>
          )}

          {room.description && (
            <Text
              style={
                styles.roomDescription
              }
            >
              {
                room.description
              }
            </Text>
          )}

          <View
            style={
              styles.actions
            }
          >
            <Pressable
              onPress={
                handleEditRoom
              }
              style={
                styles.editButton
              }
            >
              <Text
                style={
                  styles.editButtonText
                }
              >
                ✏️ Edytuj
              </Text>
            </Pressable>

            <Pressable
              disabled={
                isDeleting
              }
              onPress={
                handleDeleteRoom
              }
              style={
                styles.deleteButton
              }
            >
              <Text
                style={
                  styles.deleteButtonText
                }
              >
                {isDeleting
                  ? 'Usuwanie...'
                  : '🗑 Usuń'}
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.headerRow
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Dokumentacja
              </Text>

              {entries.length >
                0 && (
                <Text
                  style={
                    styles.resultsCount
                  }
                >
                  {hasActiveFilters
                    ? `${filteredEntries.length} z ${entries.length}`
                    : `${entries.length} wpisów`}
                </Text>
              )}
            </View>

            {entries.length >
              0 && (
              <Pressable
                onPress={
                  handleAddEntry
                }
                style={
                  styles.smallButton
                }
              >
                <Text
                  style={
                    styles.smallButtonText
                  }
                >
                  + Dodaj
                </Text>
              </Pressable>
            )}
          </View>

          {entries.length >
            0 && (
            <View
              style={
                styles.filtersSection
              }
            >
              <View
                style={
                  styles.filterHeader
                }
              >
                <Text
                  style={
                    styles.filterTitle
                  }
                >
                  Kategorie
                </Text>

                {hasActiveFilters && (
                  <Pressable
                    onPress={
                      clearFilters
                    }
                  >
                    <Text
                      style={
                        styles.clearFiltersText
                      }
                    >
                      Wyczyść
                    </Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                  false
                }
                contentContainerStyle={
                  styles.chipsRow
                }
              >
                <Pressable
                  onPress={() =>
                    setSelectedCategory(
                      null,
                    )
                  }
                  style={[
                    styles.filterChip,

                    selectedCategory ===
                      null &&
                      styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,

                      selectedCategory ===
                        null &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    Wszystkie
                  </Text>
                </Pressable>

                {categories.map(
                  (
                    category,
                  ) => (
                    <Pressable
                      key={
                        category
                      }
                      onPress={() =>
                        setSelectedCategory(
                          category,
                        )
                      }
                      style={[
                        styles.filterChip,

                        selectedCategory ===
                          category &&
                          styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,

                          selectedCategory ===
                            category &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {
                          categoryIcons[
                            category
                          ]
                        }{' '}
                        {
                          categoryLabels[
                            category
                          ]
                        }
                      </Text>
                    </Pressable>
                  ),
                )}
              </ScrollView>

              {availableTags.length >
                0 && (
                <>
                  <Text
                    style={
                      styles.tagFilterTitle
                    }
                  >
                    Tagi
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.chipsRow
                    }
                  >
                    <Pressable
                      onPress={() =>
                        setSelectedTag(
                          null,
                        )
                      }
                      style={[
                        styles.tagChip,

                        selectedTag ===
                          null &&
                          styles.tagChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagChipText,

                          selectedTag ===
                            null &&
                            styles.tagChipTextActive,
                        ]}
                      >
                        Wszystkie
                      </Text>
                    </Pressable>

                    {availableTags.map(
                      (
                        tag,
                      ) => (
                        <Pressable
                          key={
                            tag
                          }
                          onPress={() =>
                            setSelectedTag(
                              tag,
                            )
                          }
                          style={[
                            styles.tagChip,

                            selectedTag ===
                              tag &&
                              styles.tagChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.tagChipText,

                              selectedTag ===
                                tag &&
                                styles.tagChipTextActive,
                            ]}
                          >
                            #{tag}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </ScrollView>
                </>
              )}
            </View>
          )}

          {entries.length ===
          0 ? (
            <View
              style={
                styles.emptyState
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                📋
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Brak wpisów
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                Dodaj pierwszy wpis dotyczący instalacji, urządzenia lub wykonanych prac.
              </Text>

              <Pressable
                onPress={
                  handleAddEntry
                }
                style={
                  styles.button
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  + Dodaj wpis
                </Text>
              </Pressable>
            </View>
          ) : filteredEntries.length ===
            0 ? (
            <View
              style={
                styles.filteredEmptyState
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                🔎
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Brak pasujących wpisów
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                Zmień kategorię lub tag albo wyczyść filtry.
              </Text>

              <Pressable
                onPress={
                  clearFilters
                }
                style={
                  styles.button
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Wyczyść filtry
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={
                styles.entriesList
              }
            >
              {filteredEntries.map(
                (
                  entry,
                ) => (
                  <Pressable
                    key={
                      entry.id
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.entryCard,

                      pressed &&
                        styles.pressed,
                    ]}
                    onPress={() =>
                      handleOpenEntry(
                        entry.id,
                      )
                    }
                  >
                    <View
                      style={
                        styles.entryIconContainer
                      }
                    >
                      <Text
                        style={
                          styles.entryIcon
                        }
                      >
                        {
                          categoryIcons[
                            entry.category
                          ]
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.entryContent
                      }
                    >
                      <Text
                        style={
                          styles.entryCategory
                        }
                      >
                        {
                          categoryLabels[
                            entry.category
                          ]
                        }
                      </Text>

                      <Text
                        style={
                          styles.entryTitle
                        }
                      >
                        {
                          entry.title
                        }
                      </Text>

                      {entry.description && (
                        <Text
                          style={
                            styles.entryDescription
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {
                            entry.description
                          }
                        </Text>
                      )}

                      {entry.tags.length >
                        0 && (
                        <View
                          style={
                            styles.entryTags
                          }
                        >
                          {entry.tags
                            .slice(
                              0,
                              4,
                            )
                            .map(
                              (
                                tag,
                              ) => (
                                <View
                                  key={
                                    tag
                                  }
                                  style={
                                    styles.entryTag
                                  }
                                >
                                  <Text
                                    style={
                                      styles.entryTagText
                                    }
                                  >
                                    #{tag}
                                  </Text>
                                </View>
                              ),
                            )}

                          {entry.tags.length >
                            4 && (
                            <Text
                              style={
                                styles.moreTagsText
                              }
                            >
                              +
                              {entry
                                .tags
                                .length -
                                4}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>

                    <Text
                      style={
                        styles.arrow
                      }
                    >
                      ›
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
    },

    content: {
      padding: 24,
      paddingBottom: 60,
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 24,
    },

    roomIcon: {
      fontSize: 54,
    },

    roomName: {
      marginTop: 14,
      fontSize: 30,
      fontWeight:
        '700',
      color: '#111827',
    },

    roomDetail: {
      marginTop: 7,
      fontSize: 15,
      color: '#6B7280',
    },

    roomDescription: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 22,
      color: '#6B7280',
    },

    actions: {
      marginTop: 20,
      flexDirection:
        'row',
      gap: 12,
    },

    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
    },

    editButtonText: {
      fontWeight:
        '600',
      color: '#111827',
    },

    deleteButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor:
        '#FEE2E2',
    },

    deleteButtonText: {
      color: '#B91C1C',
      fontWeight:
        '600',
    },

    headerRow: {
      marginTop: 36,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    sectionTitle: {
      fontSize: 21,
      fontWeight:
        '700',
      color: '#111827',
    },

    resultsCount: {
      marginTop: 4,
      color: '#6B7280',
      fontSize: 13,
    },

    filtersSection: {
      marginTop: 18,
    },

    filterHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      marginBottom: 10,
    },

    filterTitle: {
      fontSize: 13,
      fontWeight:
        '700',
      color: '#6B7280',
      textTransform:
        'uppercase',
    },

    clearFiltersText: {
      fontSize: 13,
      fontWeight:
        '600',
      color: '#2563EB',
    },

    tagFilterTitle: {
      marginTop: 15,
      marginBottom: 10,
      fontSize: 13,
      fontWeight:
        '700',
      color: '#6B7280',
      textTransform:
        'uppercase',
    },

    chipsRow: {
      gap: 8,
      paddingRight: 20,
    },

    filterChip: {
      minHeight: 36,
      paddingHorizontal: 13,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    filterChipActive: {
      backgroundColor:
        '#111827',
      borderColor:
        '#111827',
    },

    filterChipText: {
      color: '#374151',
      fontSize: 13,
      fontWeight:
        '600',
    },

    filterChipTextActive: {
      color: '#FFFFFF',
    },

    tagChip: {
      minHeight: 34,
      paddingHorizontal: 13,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        '#BFDBFE',
      backgroundColor:
        '#EFF6FF',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    tagChipActive: {
      backgroundColor:
        '#2563EB',
      borderColor:
        '#2563EB',
    },

    tagChipText: {
      color: '#1D4ED8',
      fontSize: 13,
      fontWeight:
        '600',
    },

    tagChipTextActive: {
      color: '#FFFFFF',
    },

    emptyState: {
      minHeight: 380,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    filteredEmptyState: {
      minHeight: 280,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    emptyIcon: {
      fontSize: 56,
      marginBottom: 18,
    },

    emptyTitle: {
      fontSize: 20,
      fontWeight:
        '600',
      color: '#111827',
    },

    infoText: {
      marginTop: 8,
      maxWidth: 360,
      textAlign:
        'center',
      color: '#6B7280',
      lineHeight: 21,
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
    },

    button: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 15,
      backgroundColor:
        '#111827',
      borderRadius: 12,
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '600',
    },

    smallButton: {
      backgroundColor:
        '#111827',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },

    smallButtonText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
    },

    entriesList: {
      marginTop: 20,
      gap: 14,
    },

    entryCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      borderRadius: 16,
      padding: 17,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    entryIconContainer: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor:
        '#F3F4F6',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    entryIcon: {
      fontSize: 27,
    },

    entryContent: {
      flex: 1,
      marginLeft: 15,
    },

    entryCategory: {
      fontSize: 12,
      fontWeight:
        '600',
      color: '#6B7280',
      textTransform:
        'uppercase',
    },

    entryTitle: {
      marginTop: 3,
      fontSize: 17,
      fontWeight:
        '600',
      color: '#111827',
    },

    entryDescription: {
      marginTop: 5,
      color: '#6B7280',
      lineHeight: 19,
    },

    entryTags: {
      marginTop: 9,
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 6,
      alignItems:
        'center',
    },

    entryTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor:
        '#EFF6FF',
    },

    entryTagText: {
      color: '#1D4ED8',
      fontSize: 11,
      fontWeight:
        '600',
    },

    moreTagsText: {
      color: '#6B7280',
      fontSize: 11,
      fontWeight:
        '600',
    },

    arrow: {
      marginLeft: 12,
      fontSize: 30,
      color: '#9CA3AF',
    },

    pressed: {
      opacity: 0.7,
    },
  });