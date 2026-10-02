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

interface Property {
  id: number;
  name: string;
}

export default function CreateRoomScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [
    property,
    setProperty,
  ] =
    useState<Property | null>(
      null,
    );

  const [
    name,
    setName,
  ] =
    useState('');

  const [
    floor,
    setFloor,
  ] =
    useState('');

  const [
    description,
    setDescription,
  ] =
    useState('');

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
    title: string,
    message: string,
  ) => {
    if (
      Platform.OS === 'web'
    ) {
      window.alert(
        `${title}\n\n${message}`,
      );

      return;
    }

    Alert.alert(
      title,
      message,
    );
  };

  useEffect(() => {
    const loadProperty =
      async () => {
        if (!id) {
          setError(
            'Brak identyfikatora domu.',
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
              `/properties/${id}`,
            );

          if (!response.ok) {
            const body =
              await response.text();

            throw new Error(
              `API ${response.status}: ${body}`,
            );
          }

          const data:
            Property =
            await response.json();

          setProperty(
            data,
          );
        } catch (err) {
          console.error(
            'Błąd pobierania domu:',
            err,
          );

          setError(
            'Nie udało się pobrać danych domu.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      };

    void loadProperty();
  }, [id]);

  const handleSave =
    async () => {
      if (!id) {
        return;
      }

      const trimmedName =
        name.trim();

      if (!trimmedName) {
        showMessage(
          'Brak nazwy',
          'Podaj nazwę pomieszczenia.',
        );

        return;
      }

      try {
        setIsSaving(
          true,
        );

        const payload = {
          name:
            trimmedName,

          floor:
            floor.trim() ||
            undefined,

          description:
            description.trim() ||
            undefined,
        };

        const response =
          await apiFetch(
            `/properties/${id}/rooms`,
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
         * Jawna nawigacja zamiast
         * router.back().
         */
        router.replace({
          pathname:
            '/property/[id]/rooms',

          params: {
            id,
          },
        });
      } catch (err) {
        console.error(
          'Błąd zapisu pomieszczenia:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się zapisać pomieszczenia.',
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
              'Dodaj pomieszczenie',
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
              Pobieranie domu...
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
              'Dodaj pomieszczenie',
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

  return (
    <>
      <Stack.Screen
        options={{
          title:
            property
              ? `${property.name} › Dodaj pomieszczenie`
              : 'Dodaj pomieszczenie',
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
            Dodaj pomieszczenie
          </Text>

          {property && (
            <Text
              style={
                styles.subtitle
              }
            >
              🏠 {property.name}
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
              Nazwa *
            </Text>

            <TextInput
              value={name}
              onChangeText={
                setName
              }
              style={
                styles.input
              }
              placeholder="np. Łazienka"
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
              Kondygnacja
            </Text>

            <TextInput
              value={floor}
              onChangeText={
                setFloor
              }
              style={
                styles.input
              }
              placeholder="np. Parter"
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
              placeholder="Opcjonalny opis pomieszczenia"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={
                5
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
                  Dodaj pomieszczenie
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
                    '/property/[id]/rooms',

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
      marginTop: 28,
    },

    label: {
      marginTop: 18,
      marginBottom: 8,
      fontSize: 14,
      fontWeight:
        '600',
      color: '#374151',
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
      minHeight: 120,
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