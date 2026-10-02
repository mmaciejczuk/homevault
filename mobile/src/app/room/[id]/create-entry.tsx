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

export default function CreateEntryScreen() {
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
    title,
    setTitle,
  ] =
    useState('');

  const [
    description,
    setDescription,
  ] =
    useState('');

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
  ] =
    useState(true);

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

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
    const loadRoom =
      async () => {
        if (!id) {
          setError(
            'Brak identyfikatora pomieszczenia.',
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

          const response =
            await apiFetch(
              `/rooms/${id}`,
            );

          if (!response.ok) {
            const body =
              await response.text();

            throw new Error(
              `API ${response.status}: ${body}`,
            );
          }

          const data:
            Room =
            await response.json();

          setRoom(
            data,
          );
        } catch (err) {
          console.error(
            'Błąd pobierania pomieszczenia:',
            err,
          );

          setError(
            'Nie udało się pobrać pomieszczenia.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      };

    void loadRoom();
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

        const payload = {
          title:
            trimmedTitle,

          description:
            description.trim() ||
            undefined,

          category,
        };

        const response =
          await apiFetch(
            `/rooms/${id}/entries`,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  payload,
                ),
            },
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `POST ${response.status}: ${body}`,
          );
        }

        /*
         * Nie używamy router.back().
         */
        router.replace({
          pathname:
            '/room/[id]',

          params: {
            id,
          },
        });
      } catch (err) {
        console.error(
          'Błąd zapisu wpisu:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się zapisać wpisu.',
        );
      } finally {
        setIsSaving(
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
              'Dodaj wpis',
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

  if (error) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Dodaj wpis',
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

  const headerTitle =
    room?.property?.name
      ? `${room.property.name} › ${room.name} › Dodaj wpis`
      : room
        ? `${room.name} › Dodaj wpis`
        : 'Dodaj wpis';

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
            Dodaj wpis
          </Text>

          {room && (
            <Text
              style={
                styles.subtitle
              }
            >
              🚪 {room.name}
            </Text>
          )}

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
                      disabled={
                        isSaving
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.categoryButton,

                        selected &&
                          styles.categoryButtonSelected,

                        pressed &&
                          styles.pressed,
                      ]}
                    >
                      <Text
                        style={
                          styles.categoryIcon
                        }
                      >
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
              placeholder="np. Zawór pod umywalką"
              placeholderTextColor="#9CA3AF"
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
              placeholder="Dodaj szczegóły, uwagi lub informacje techniczne"
              placeholderTextColor="#9CA3AF"
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
              style={({
                pressed,
              }) => [
                styles.saveButton,

                pressed &&
                  styles.pressed,

                isSaving &&
                  styles.disabled,
              ]}
            >
              {isSaving ? (
                <View
                  style={
                    styles.savingRow
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.saveButtonText
                    }
                  >
                    Zapisywanie...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Dodaj wpis
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
                    '/room/[id]',

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

    subtitle: {
      marginTop: 8,
      fontSize: 15,
      color: '#6B7280',
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
      minWidth: 110,
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
      alignItems:
        'center',
      gap: 7,
    },

    categoryButtonSelected: {
      borderColor:
        '#111827',
      backgroundColor:
        '#111827',
    },

    categoryIcon: {
      fontSize: 18,
    },

    categoryText: {
      fontSize: 13,
      fontWeight:
        '600',
      color: '#374151',
    },

    categoryTextSelected: {
      color: '#FFFFFF',
    },

    input: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: '#111827',
    },

    textArea: {
      minHeight: 130,
      textAlignVertical:
        'top',
    },

    saveButton: {
      marginTop: 30,
      minHeight: 52,
      borderRadius: 12,
      backgroundColor:
        '#111827',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight:
        '600',
    },

    savingRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
    },

    cancelButton: {
      marginTop: 10,
      paddingVertical: 16,
      alignItems:
        'center',
    },

    cancelText: {
      color: '#6B7280',
      fontSize: 15,
    },

    infoText: {
      marginTop: 10,
      color: '#6B7280',
      textAlign:
        'center',
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
    },

    pressed: {
      opacity: 0.75,
    },

    disabled: {
      opacity: 0.5,
    },
  });