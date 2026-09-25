import { router } from 'expo-router';

import { useState } from 'react';

import {
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

import { apiFetch } from '../lib/api';

export default function CreatePropertyScreen() {
  const [name, setName] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [yearBuilt, setYearBuilt] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const showMessage = (
    title: string,
    message: string,
  ) => {
    if (Platform.OS === 'web') {
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

  const handleSave = async () => {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      showMessage(
        'Brak nazwy',
        'Podaj nazwę nieruchomości.',
      );

      return;
    }

    const parsedYearBuilt =
      yearBuilt
        ? Number(yearBuilt)
        : undefined;

    if (
      parsedYearBuilt !== undefined &&
      (
        !Number.isInteger(
          parsedYearBuilt,
        ) ||
        parsedYearBuilt < 1000 ||
        parsedYearBuilt > 9999
      )
    ) {
      showMessage(
        'Nieprawidłowy rok',
        'Podaj poprawny czterocyfrowy rok budowy.',
      );

      return;
    }

    const property = {
      name: trimmedName,
      address:
        address.trim() ||
        undefined,
      yearBuilt:
        parsedYearBuilt,
    };

    try {
      setIsSaving(true);

      console.log(
        'Wysyłam do API:',
        property,
      );

      const response =
        await apiFetch(
          '/properties',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              property,
            ),
          },
        );

      if (!response.ok) {
        const responseBody =
          await response.text();

        throw new Error(
          `API zwróciło status ${response.status}: ${responseBody}`,
        );
      }

      const createdProperty =
        await response.json();

      console.log(
        'Nieruchomość zapisana:',
        createdProperty,
      );

      showMessage(
        'Zapisano',
        `Dodano nieruchomość: ${createdProperty.name}`,
      );

      router.replace('/');
    } catch (error) {
      console.error(
        'Błąd zapisu:',
        error,
      );

      showMessage(
        'Błąd',
        'Nie udało się zapisać nieruchomości.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
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
          <Text style={styles.title}>
            Dodaj dom
          </Text>

          <Text
            style={styles.subtitle}
          >
            Podaj podstawowe informacje
            o nieruchomości.
          </Text>

          <View style={styles.form}>
            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Nazwa *
              </Text>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="np. Mój dom"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Adres
              </Text>

              <TextInput
                style={styles.input}
                value={address}
                onChangeText={
                  setAddress
                }
                placeholder="np. ul. Przykładowa 10"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View
              style={styles.field}
            >
              <Text
                style={styles.label}
              >
                Rok budowy
              </Text>

              <TextInput
                style={styles.input}
                value={yearBuilt}
                onChangeText={(
                  value,
                ) => {
                  setYearBuilt(
                    value.replace(
                      /[^0-9]/g,
                      '',
                    ),
                  );
                }}
                placeholder="np. 2026"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <Pressable
              disabled={isSaving}
              style={({ pressed }) => [
                styles.saveButton,

                pressed &&
                  styles.buttonPressed,

                isSaving &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSave}
            >
              <Text
                style={
                  styles.saveButtonText
                }
              >
                {isSaving
                  ? 'Zapisywanie...'
                  : 'Zapisz'}
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.cancelButton
              }
              onPress={() =>
                router.back()
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  content: {
    flexGrow: 1,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: '#6B7280',
  },

  form: {
    marginTop: 32,
  },

  field: {
    marginBottom: 22,
  },

  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },

  saveButton: {
    marginTop: 12,
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#6B7280',
    fontSize: 15,
  },
});