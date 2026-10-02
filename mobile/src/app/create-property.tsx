import {
  router,
} from 'expo-router';

import {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
} from '../lib/api';

interface CreatedProperty {
  id: number;
  name: string;
  address?: string | null;
  yearBuilt?: number | null;
}

export default function CreatePropertyScreen() {
  const [
    name,
    setName,
  ] =
    useState('');

  const [
    address,
    setAddress,
  ] =
    useState('');

  const [
    yearBuilt,
    setYearBuilt,
  ] =
    useState('');

  const [
    isSaving,
    setIsSaving,
  ] =
    useState(false);

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

  const handleSave =
    async () => {
      const trimmedName =
        name.trim();

      if (!trimmedName) {
        showMessage(
          'Brak nazwy',
          'Podaj nazwę nieruchomości.',
        );

        return;
      }

      let parsedYearBuilt:
        | number
        | undefined;

      if (
        yearBuilt.trim()
      ) {
        parsedYearBuilt =
          Number(
            yearBuilt,
          );

        if (
          !Number.isInteger(
            parsedYearBuilt,
          ) ||
          parsedYearBuilt <
            1000 ||
          parsedYearBuilt >
            9999
        ) {
          showMessage(
            'Nieprawidłowy rok',
            'Podaj poprawny rok budowy.',
          );

          return;
        }
      }

      const payload = {
        name:
          trimmedName,

        address:
          address.trim() ||
          undefined,

        yearBuilt:
          parsedYearBuilt,
      };

      try {
        setIsSaving(
          true,
        );

        const response =
          await apiFetch(
            '/properties',
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
          const responseBody =
            await response.text();

          throw new Error(
            `POST /properties zwróciło ${response.status}: ${responseBody}`,
          );
        }

        const createdProperty:
          CreatedProperty =
          await response.json();

        router.replace({
          pathname:
            '/property/[id]',

          params: {
            id:
              String(
                createdProperty.id,
              ),
          },
        });
      } catch (error) {
        console.error(
          'Błąd tworzenia nieruchomości:',
          error,
        );

        showMessage(
          'Błąd',
          'Nie udało się utworzyć nieruchomości.',
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  return (
    <SafeAreaView
      style={
        styles.container
      }
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={
          styles.container
        }
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : undefined
        }
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
            Dodaj dom
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Podaj podstawowe informacje o nieruchomości.
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
              placeholder="np. Dom"
              placeholderTextColor="#9CA3AF"
              style={
                styles.input
              }
              editable={
                !isSaving
              }
              autoCapitalize="sentences"
            />

            <Text
              style={
                styles.label
              }
            >
              Adres
            </Text>

            <TextInput
              value={
                address
              }
              onChangeText={
                setAddress
              }
              placeholder="np. Warszawa, ul. ..."
              placeholderTextColor="#9CA3AF"
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
              placeholder="np. 2025"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={4}
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
              style={({
                pressed,
              }) => [
                styles.primaryButton,

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
                      styles.primaryButtonText
                    }
                  >
                    Zapisywanie...
                  </Text>
                </View>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Dodaj dom
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={
                isSaving
              }
              onPress={() =>
                router.replace(
                  '/',
                )
              }
              style={
                styles.cancelButton
              }
            >
              <Text
                style={
                  styles.cancelButtonText
                }
              >
                Anuluj
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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

    title: {
      fontSize: 28,
      fontWeight:
        '700',
      color: '#111827',
    },

    subtitle: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 22,
      color: '#6B7280',
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

    primaryButton: {
      minHeight: 52,
      marginTop: 30,
      borderRadius: 12,
      backgroundColor:
        '#111827',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '700',
    },

    savingRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
    },

    cancelButton: {
      minHeight: 48,
      marginTop: 8,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    cancelButtonText: {
      color: '#6B7280',
      fontSize: 15,
      fontWeight:
        '600',
    },

    pressed: {
      opacity: 0.72,
    },

    disabled: {
      opacity: 0.55,
    },
  });