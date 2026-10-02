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

interface Room {
  id: number;
  name: string;
  floor?: string | null;
  description?: string | null;
  propertyId: number;
  property?: Property;
}

export default function EditRoomScreen() {
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
    name,
    setName,
  ] = useState('');

  const [
    floor,
    setFloor,
  ] = useState('');

  const [
    description,
    setDescription,
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
            throw new Error(
              await response.text(),
            );
          }

          const data:
            Room =
            await response.json();

          setRoom(
            data,
          );

          setName(
            data.name,
          );

          setFloor(
            data.floor ?? '',
          );

          setDescription(
            data.description ??
              '',
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

        const response =
          await apiFetch(
            `/rooms/${id}`,
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

                  floor:
                    floor.trim() ||
                    null,

                  description:
                    description.trim() ||
                    null,
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
            '/room/[id]',

          params: {
            id,
          },
        });
      } catch (err) {
        console.error(
          'Błąd edycji pomieszczenia:',
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
      ? `${room.property.name} › ${name || room.name} › Edytuj`
      : `${name || room?.name || 'Pomieszczenie'} › Edytuj`;

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Edytuj pomieszczenie',
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
              'Edytuj pomieszczenie',
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
            Edytuj pomieszczenie
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

    textArea: {
      minHeight: 120,
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