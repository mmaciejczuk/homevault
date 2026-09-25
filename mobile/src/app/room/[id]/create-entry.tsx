import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import { useState } from 'react';

import {
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

import { apiFetch } from '../../../lib/api';

type EntryCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HEATING'
  | 'WALL'
  | 'FLOOR'
  | 'DEVICE'
  | 'NOTE'
  | 'OTHER';

interface CategoryOption {
  value: EntryCategory;
  label: string;
  icon: string;
}

const categories: CategoryOption[] = [
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

export default function CreateEntryScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [title, setTitle] =
    useState('');

  const [
    description,
    setDescription,
  ] = useState('');

  const [category, setCategory] =
    useState<EntryCategory>(
      'ELECTRICAL',
    );

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

  const handleSave = async () => {
    if (!id) {
      showMessage(
        'Błąd',
        'Brak identyfikatora pomieszczenia.',
      );

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

      const payload = {
        title: title.trim(),

        description:
          description.trim() ||
          undefined,

        category,
      };

      console.log(
        'Dodaję wpis:',
        payload,
      );

      const response =
        await apiFetch(
          `/rooms/${id}/entries`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify(
              payload,
            ),
          },
        );

      if (!response.ok) {
        const responseText =
          await response.text();

        throw new Error(
          `API ${response.status}: ${responseText}`,
        );
      }

      const createdEntry =
        await response.json();

      console.log(
        'Wpis zapisany:',
        createdEntry,
      );

      showMessage(
        'Zapisano',
        `Dodano wpis: ${createdEntry.title}`,
      );

      router.back();
    } catch (error) {
      console.error(
        'Błąd zapisu wpisu:',
        error,
      );

      showMessage(
        'Błąd',
        'Nie udało się zapisać wpisu.',
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
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>
          Dodaj wpis
        </Text>

        <Text
          style={styles.subtitle}
        >
          Dodaj informację do dokumentacji
          pomieszczenia.
        </Text>

        <Text style={styles.label}>
          Kategoria
        </Text>

        <View
          style={styles.categories}
        >
          {categories.map((item) => {
            const selected =
              category === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => {
                  setCategory(
                    item.value,
                  );
                }}
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
                  {item.icon}
                </Text>

                <Text
                  style={[
                    styles.categoryLabel,

                    selected &&
                      styles.categoryLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>
          Tytuł *
        </Text>

        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholder="np. Przewód do lampy nad stołem"
        />

        <Text style={styles.label}>
          Opis
        </Text>

        <TextInput
          value={description}
          onChangeText={
            setDescription
          }
          style={[
            styles.input,
            styles.textArea,
          ]}
          placeholder="Opisz co zostało wykonane, gdzie znajduje się instalacja itd."
          multiline
          numberOfLines={5}
        />

        <Pressable
          disabled={isSaving}
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveButton,

            pressed &&
              styles.pressed,

            isSaving &&
              styles.disabled,
          ]}
        >
          <Text
            style={
              styles.saveButtonText
            }
          >
            {isSaving
              ? 'Zapisywanie...'
              : 'Zapisz wpis'}
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
            style={styles.cancelText}
          >
            Anuluj
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  content: {
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    color: '#6B7280',
    lineHeight: 20,
  },

  label: {
    marginTop: 26,
    marginBottom: 9,
    fontWeight: '600',
    color: '#374151',
  },

  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  categoryButton: {
    minWidth: 125,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryButtonSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },

  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },

  categoryLabel: {
    color: '#374151',
    fontWeight: '500',
  },

  categoryLabelSelected: {
    color: '#FFFFFF',
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

  textArea: {
    minHeight: 130,
    textAlignVertical: 'top',
  },

  saveButton: {
    marginTop: 30,
    minHeight: 52,
    backgroundColor: '#111827',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
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