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
  address?: string | null;
  yearBuilt?: number | null;
}

export default function EditPropertyScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [
    name,
    setName,
  ] = useState('');

  const [
    address,
    setAddress,
  ] = useState('');

  const [
    yearBuilt,
    setYearBuilt,
  ] = useState('');

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

          setName(
            data.name,
          );

          setAddress(
            data.address ?? '',
          );

          setYearBuilt(
            data.yearBuilt
              ? String(
                  data.yearBuilt,
                )
              : '',
          );
        } catch (err) {
          console.error(
            'Błąd pobierania domu:',
            err,
          );

          setError(
            'Nie udało się pobrać domu.',
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
          'Podaj nazwę domu.',
        );

        return;
      }

      let parsedYear:
        | number
        | null = null;

      if (
        yearBuilt.trim()
      ) {
        parsedYear =
          Number(
            yearBuilt,
          );

        if (
          !Number.isInteger(
            parsedYear,
          ) ||
          parsedYear < 1000 ||
          parsedYear > 9999
        ) {
          showMessage(
            'Nieprawidłowy rok',
            'Podaj poprawny rok budowy.',
          );

          return;
        }
      }

      try {
        setIsSaving(
          true,
        );

        const response =
          await apiFetch(
            `/properties/${id}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify({
                  name:
                    trimmedName,

                  address:
                    address.trim() ||
                    null,

                  yearBuilt:
                    parsedYear,
                }),
            },
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `PATCH ${response.status}: ${body}`,
          );
        }

        router.replace({
          pathname:
            '/property/[id]',

          params: {
            id,
          },
        });
      } catch (err) {
        console.error(
          'Błąd edycji domu:',
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

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Edytuj dom',
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
              'Edytuj dom',
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
            `${name || 'Dom'} › Edytuj`,
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
            Edytuj dom
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
              editable={
                !isSaving
              }
            />

            <Text
              style={
                styles.label
              }
            >
              Adres
            </Text>

            <TextInput
              value={address}
              onChangeText={
                setAddress
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
              Rok budowy
            </Text>

            <TextInput
              value={
                yearBuilt
              }
              onChangeText={
                setYearBuilt
              }
              keyboardType="number-pad"
              style={
                styles.input
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
                    '/property/[id]',

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
      alignItems:
        'center',
      justifyContent:
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
      marginTop: 18,
      marginBottom: 8,
      fontSize: 14,
      fontWeight:
        '600',
      color: '#374151',
    },

    input: {
      minHeight: 50,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
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
      fontSize: 15,
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