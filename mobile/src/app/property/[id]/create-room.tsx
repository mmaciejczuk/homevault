import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://homevault-production.up.railway.app';

export default function CreateRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const showMessage = (
    title: string,
    message: string,
  ) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showMessage(
        'Brak nazwy',
        'Podaj nazwę pomieszczenia.',
      );

      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name: name.trim(),
        floor: floor.trim() || undefined,
        description:
          description.trim() || undefined,
      };

      console.log(
        'Dodaję pomieszczenie:',
        payload,
      );

      const response = await fetch(
        `${API_URL}/properties/${id}/rooms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(
          `API zwróciło status ${response.status}`,
        );
      }

      const createdRoom =
        await response.json();

      console.log(
        'Pomieszczenie zapisane:',
        createdRoom,
      );

      showMessage(
        'Zapisano',
        `Dodano pomieszczenie: ${createdRoom.name}`,
      );

      router.back();
    } catch (error) {
      console.error(
        'Błąd zapisu pomieszczenia:',
        error,
      );

      showMessage(
        'Błąd',
        'Nie udało się zapisać pomieszczenia.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>
          Dodaj pomieszczenie
        </Text>

        <Text style={styles.subtitle}>
          Dodaj podstawowe informacje.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Nazwa *
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="np. Salon"
          />

          <Text style={styles.label}>
            Kondygnacja
          </Text>

          <TextInput
            value={floor}
            onChangeText={setFloor}
            style={styles.input}
            placeholder="np. Parter"
          />

          <Text style={styles.label}>
            Opis
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[
              styles.input,
              styles.textArea,
            ]}
            placeholder="np. Główne pomieszczenie dzienne"
            multiline
            numberOfLines={4}
          />

          <Pressable
            disabled={isSaving}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
              isSaving && styles.disabled,
            ]}
          >
            <Text style={styles.saveButtonText}>
              {isSaving
                ? 'Zapisywanie...'
                : 'Zapisz'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelText}>
              Anuluj
            </Text>
          </Pressable>
        </View>
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
  },

  form: {
    marginTop: 32,
  },

  label: {
    marginBottom: 8,
    marginTop: 18,
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
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  saveButton: {
    marginTop: 30,
    backgroundColor: '#111827',
    minHeight: 52,
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