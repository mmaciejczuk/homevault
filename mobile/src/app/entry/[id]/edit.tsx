import {
  router,
  Stack,
  useLocalSearchParams,
} from 'expo-router';

import {
  useEffect,
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
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  apiFetch,
} from '../../../lib/api';

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
  description?: string | null;
  category: EntryCategory;
  roomId: number;
}

interface Property {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
  propertyId: number;
  property?: Property;
}

interface CategoryOption {
  value: EntryCategory;
  label: string;
  icon: string;
}

const categories:
  CategoryOption[] = [
    {
      value:
        'ELECTRICAL',
      label:
        'Elektryka',
      icon:
        '⚡',
    },
    {
      value:
        'PLUMBING',
      label:
        'Hydraulika',
      icon:
        '💧',
    },
    {
      value:
        'HEATING',
      label:
        'Ogrzewanie',
      icon:
        '🔥',
    },
    {
      value:
        'WALL',
      label:
        'Ściany',
      icon:
        '🧱',
    },
    {
      value:
        'FLOOR',
      label:
        'Podłoga',
      icon:
        '🪵',
    },
    {
      value:
        'DEVICE',
      label:
        'Urządzenie',
      icon:
        '🔧',
    },
    {
      value:
        'NOTE',
      label:
        'Notatka',
      icon:
        '📝',
    },
    {
      value:
        'OTHER',
      label:
        'Inne',
      icon:
        '📌',
    },
  ];

export default function EditEntryScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [
    entry,
    setEntry,
  ] =
    useState<Entry | null>(
      null,
    );

  const [
    room,
    setRoom,
  ] =
    useState<Room | null>(
      null,
    );

  const [
    title,
    setTitle,
  ] = useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    category,
    setCategory,
  ] =
    useState<EntryCategory>(
      'ELECTRICAL',
    );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const showMessage = (
    titleText: string,
    message: string,
  ) => {
    if (
      Platform.OS === 'web'
    ) {
      window.alert(
        `${titleText}\n\n${message}`,
      );

      return;
    }

    Alert.alert(
      titleText,
      message,
    );
  };

  useEffect(() => {
    const loadEntry =
      async () => {
        if (!id) {
          setError(
            'Brak identyfikatora wpisu.',
          );

          setIsLoading(
            false,
          );

          return;
        }

        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const entryResponse =
            await apiFetch(
              `/entries/${id}`,
            );

          if (
            !entryResponse.ok
          ) {
            throw new Error(
              await entryResponse.text(),
            );
          }

          const entryData:
            Entry =
            await entryResponse.json();

          const roomResponse =
            await apiFetch(
              `/rooms/${entryData.roomId}`,
            );

          if (
            !roomResponse.ok
          ) {
            throw new Error(
              await roomResponse.text(),
            );
          }

          const roomData:
            Room =
            await roomResponse.json();

          setEntry(
            entryData,
          );

          setRoom(
            roomData,
          );

          setTitle(
            entryData.title,
          );

          setDescription(
            entryData.description ??
              '',
          );

          setCategory(
            entryData.category,
          );
        } catch (err) {
          console.error(
            'Błąd pobierania wpisu:',
            err,
          );

          setError(
            'Nie udało się pobrać wpisu.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      };

    void loadEntry();
  }, [id]);

  const handleSave =
    async () => {
      if (!id) {
        return;
      }

      const trimmedTitle =
        title.trim();

      if (!trimmedTitle) {
        showMessage(
          'Brak tytułu',
          'Podaj tytuł wpisu.',
        );

        return;
      }

      try {
        setIsSaving(
          true,
        );

        const response =
          await apiFetch(
            `/entries/${id}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  title:
                    trimmedTitle,

                  description:
                    description.trim() ||
                    null,

                  category,
                }),
            },
          );

        if (!response.ok) {
          throw new Error(
            await response.text(),
          );
        }

        router.replace({
          pathname:
            '/entry/[id]',

          params: {
            id,
          },
        });
      } catch (err) {
        console.error(
          'Błąd edycji wpisu:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się zapisać zmian.',
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  const headerTitle =
    room?.property?.name
      ? `${room.property.name} › ${room.name} › ${title || entry?.title || 'Wpis'} › Edytuj`
      : room
        ? `${room.name} › ${title || entry?.title || 'Wpis'} › Edytuj`
        : 'Edytuj wpis';

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Edytuj wpis',
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
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Edytuj wpis',
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
            headerTitle,
        }}
      />

      <SafeAreaView
        style={
          styles.container
        }
        edges={['bottom']}
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={
              styles.title
            }
          >
            Edytuj wpis
          </Text>

          <View
            style={
              styles.form
            }
          >
            <Text
              style={
                styles.label
              }
            >
              Kategoria
            </Text>

            <View
              style={
                styles.categories
              }
            >
              {categories.map(
                (
                  option,
                ) => {
                  const selected =
                    category ===
                    option.value;

                  return (
                    <Pressable
                      key={
                        option.value
                      }
                      onPress={() =>
                        setCategory(
                          option.value,
                        )
                      }
                      style={[
                        styles.categoryButton,

                        selected &&
                          styles.categoryButtonSelected,
                      ]}
                    >
                      <Text>
                        {
                          option.icon
                        }
                      </Text>

                      <Text
                        style={[
                          styles.categoryText,

                          selected &&
                            styles.categoryTextSelected,
                        ]}
                      >
                        {
                          option.label
                        }
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            <Text
              style={
                styles.label
              }
            >
              Tytuł *
            </Text>

            <TextInput
              value={title}
              onChangeText={
                setTitle
              }
              style={
                styles.input
              }
              editable={
                !isSaving
              }
            />

            <Text
              style={
                styles.label
              }
            >
              Opis
            </Text>

            <TextInput
              value={
                description
              }
              onChangeText={
                setDescription
              }
              style={[
                styles.input,
                styles.textArea,
              ]}
              multiline
              numberOfLines={
                6
              }
              editable={
                !isSaving
              }
            />

            <Pressable
              disabled={
                isSaving
              }
              onPress={
                handleSave
              }
              style={[
                styles.saveButton,

                isSaving &&
                  styles.disabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Zapisz zmiany
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={
                isSaving
              }
              onPress={() =>
                router.replace({
                  pathname:
                    '/entry/[id]',

                  params: {
                    id,
                  },
                })
              }
              style={
                styles.cancelButton
              }
            >
              <Text
                style={
                  styles.cancelText
                }
              >
                Anuluj
              </Text>
            </Pressable>
          </View>
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

    title: {
      fontSize: 28,
      fontWeight:
        '700',
      color: '#111827',
    },

    form: {
      marginTop: 24,
    },

    label: {
      marginTop: 20,
      marginBottom: 8,
      fontSize: 14,
      fontWeight:
        '600',
      color: '#374151',
    },

    categories: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 10,
    },

    categoryButton: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
      gap: 7,
    },

    categoryButtonSelected: {
      backgroundColor:
        '#111827',
      borderColor:
        '#111827',
    },

    categoryText: {
      color: '#374151',
      fontWeight:
        '600',
    },

    categoryTextSelected: {
      color: '#FFFFFF',
    },

    input: {
      minHeight: 50,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
    },

    textArea: {
      minHeight: 130,
      textAlignVertical:
        'top',
    },

    saveButton: {
      minHeight: 52,
      marginTop: 30,
      borderRadius: 12,
      backgroundColor:
        '#111827',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontWeight:
        '700',
    },

    cancelButton: {
      marginTop: 10,
      paddingVertical: 16,
      alignItems:
        'center',
    },

    cancelText: {
      color: '#6B7280',
    },

    disabled: {
      opacity: 0.5,
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
    },

    infoText: {
      marginTop: 10,
      color: '#6B7280',
      textAlign:
        'center',
    },
  });