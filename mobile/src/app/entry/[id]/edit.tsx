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
}

const categories: {
  value: EntryCategory;
  label: string;
  icon: string;
}[] = [
  {
    value: 'ELECTRICAL',
    label: 'Elektryka',
    icon: '⚡',
  },
  {
    value: 'PLUMBING',
    label: 'Hydraulika',
    icon: '💧',
  },
  {
    value: 'HEATING',
    label: 'Ogrzewanie',
    icon: '🔥',
  },
  {
    value: 'WALL',
    label: 'Ściany',
    icon: '🧱',
  },
  {
    value: 'FLOOR',
    label: 'Podłoga',
    icon: '🪵',
  },
  {
    value: 'DEVICE',
    label: 'Urządzenie',
    icon: '🔧',
  },
  {
    value: 'NOTE',
    label: 'Notatka',
    icon: '📝',
  },
  {
    value: 'OTHER',
    label: 'Inne',
    icon: '📌',
  },
];

export default function EditEntryScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [title, setTitle] =
    useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [
    category,
    setCategory,
  ] =
    useState<EntryCategory>(
      'OTHER',
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const showMessage = (
    titleText: string,
    message: string,
  ) => {
    if (Platform.OS === 'web') {
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
    const load = async () => {
      if (!id) {
        return;
      }

      try {
        setIsLoading(true);

        const response =
          await apiFetch(
            `/entries/${id}`,
          );

        if (!response.ok) {
          throw new Error(
            await response.text(),
          );
        }

        const entry: Entry =
          await response.json();

        setTitle(
          entry.title,
        );

        setDescription(
          entry.description ??
            '',
        );

        setCategory(
          entry.category,
        );
      } catch (error) {
        console.error(
          'Błąd pobierania wpisu:',
          error,
        );

        showMessage(
          'Błąd',
          'Nie udało się pobrać wpisu.',
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

    if (!title.trim()) {
      showMessage(
        'Brak tytułu',
        'Podaj tytuł wpisu.',
      );

      return;
    }

    try {
      setIsSaving(true);

      const response =
        await apiFetch(
          `/entries/${id}`,
          {
            method: 'PATCH',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                title:
                  title.trim(),

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

      router.back();
    } catch (error) {
      console.error(
        'Błąd edycji wpisu:',
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
      >
        <Text
          style={styles.title}
        >
          Edytuj wpis
        </Text>

        <Text
          style={styles.label}
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
              item,
            ) => {
              const selected =
                category ===
                item.value;

              return (
                <Pressable
                  key={
                    item.value
                  }
                  onPress={() =>
                    setCategory(
                      item.value,
                    )
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.category,

                    selected &&
                      styles.categorySelected,

                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Text>
                    {item.icon}{' '}
                    {item.label}
                  </Text>
                </Pressable>
              );
            },
          )}
        </View>

        <Text
          style={styles.label}
        >
          Tytuł *
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <Text
          style={styles.label}
        >
          Opis
        </Text>

        <TextInput
          value={description}
          onChangeText={
            setDescription
          }
          multiline
          style={[
            styles.input,
            styles.textArea,
          ]}
        />

        <Pressable
          disabled={isSaving}
          onPress={
            handleSave
          }
          style={
            styles.saveButton
          }
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
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    title: {
      fontSize: 28,
      fontWeight:
        '700',
      color: '#111827',
    },

    label: {
      marginTop: 24,
      marginBottom: 8,
      fontWeight:
        '600',
      color: '#374151',
    },

    categories: {
      flexDirection:
        'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    category: {
      padding: 12,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 10,
      backgroundColor:
        '#FFFFFF',
    },

    categorySelected: {
      borderColor:
        '#111827',
      backgroundColor:
        '#E5E7EB',
    },

    input: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
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
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    saveText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
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
      opacity: 0.7,
    },
  });