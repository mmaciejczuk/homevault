import {
  router,
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

  const [name, setName] =
    useState('');

  const [address, setAddress] =
    useState('');

  const [yearBuilt, setYearBuilt] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

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

  useEffect(() => {
    const load = async () => {
      if (!id) {
        return;
      }

      try {
        setIsLoading(true);

        const response =
          await apiFetch(
            `/properties/${id}`,
          );

        if (!response.ok) {
          throw new Error(
            await response.text(),
          );
        }

        const property: Property =
          await response.json();

        setName(
          property.name,
        );

        setAddress(
          property.address ?? '',
        );

        setYearBuilt(
          property.yearBuilt
            ? String(
                property.yearBuilt,
              )
            : '',
        );
      } catch (error) {
        console.error(
          'Błąd pobierania nieruchomości:',
          error,
        );

        showMessage(
          'Błąd',
          'Nie udało się pobrać nieruchomości.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [id]);

  const handleSave = async () => {
    if (!id) {
      return;
    }

    if (!name.trim()) {
      showMessage(
        'Brak nazwy',
        'Podaj nazwę nieruchomości.',
      );

      return;
    }

    const parsedYear =
      yearBuilt.trim()
        ? Number(
            yearBuilt,
          )
        : null;

    if (
      parsedYear !== null &&
      (
        !Number.isInteger(
          parsedYear,
        ) ||
        parsedYear < 1000 ||
        parsedYear > 9999
      )
    ) {
      showMessage(
        'Nieprawidłowy rok',
        'Podaj poprawny czterocyfrowy rok.',
      );

      return;
    }

    try {
      setIsSaving(true);

      const response =
        await apiFetch(
          `/properties/${id}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                name:
                  name.trim(),

                address:
                  address.trim() ||
                  null,

                yearBuilt:
                  parsedYear,
              }),
          },
        );

      if (!response.ok) {
        throw new Error(
          await response.text(),
        );
      }

      router.back();
    } catch (error) {
      console.error(
        'Błąd edycji nieruchomości:',
        error,
      );

      showMessage(
        'Błąd',
        'Nie udało się zapisać zmian.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.center}
        >
          <ActivityIndicator
            size="large"
          />

          <Text
            style={
              styles.info
            }
          >
            Pobieranie danych...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={styles.title}
        >
          Edytuj dom
        </Text>

        <Text
          style={styles.label}
        >
          Nazwa *
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text
          style={styles.label}
        >
          Adres
        </Text>

        <TextInput
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />

        <Text
          style={styles.label}
        >
          Rok budowy
        </Text>

        <TextInput
          value={yearBuilt}
          onChangeText={(
            value,
          ) =>
            setYearBuilt(
              value.replace(
                /[^0-9]/g,
                '',
              ),
            )
          }
          keyboardType="number-pad"
          maxLength={4}
          style={styles.input}
        />

        <Pressable
          disabled={isSaving}
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
          <Text
            style={
              styles.saveText
            }
          >
            {isSaving
              ? 'Zapisywanie...'
              : 'Zapisz zmiany'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            router.back()
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
      </ScrollView>
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
    },

    center: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    info: {
      marginTop: 12,
      color: '#6B7280',
    },

    title: {
      fontSize: 28,
      fontWeight:
        '700',
      color: '#111827',
      marginBottom: 16,
    },

    label: {
      marginTop: 18,
      marginBottom: 8,
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

    saveText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
      fontSize: 16,
    },

    cancelButton: {
      paddingVertical: 16,
      alignItems:
        'center',
    },

    cancelText: {
      color: '#6B7280',
    },

    pressed: {
      opacity: 0.75,
    },

    disabled: {
      opacity: 0.5,
    },
  });