import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://homevault-production.up.railway.app';

interface Room {
  id: number;
  name: string;
  floor?: string;
  description?: string;
  propertyId: number;
}

export default function RoomsScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [rooms, setRooms] =
    useState<Room[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadRooms =
    useCallback(async () => {
      if (!id) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_URL}/properties/${id}/rooms`,
        );

        if (!response.ok) {
          throw new Error(
            `API zwróciło status ${response.status}`,
          );
        }

        const data: Room[] =
          await response.json();

        setRooms(data);
      } catch (err) {
        console.error(
          'Błąd pobierania pomieszczeń:',
          err,
        );

        setError(
          'Nie udało się pobrać pomieszczeń.',
        );
      } finally {
        setIsLoading(false);
      }
    }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms]),
  );

  const handleAddRoom = () => {
    router.push({
      pathname:
        '/property/[id]/create-room',

      params: {
        id,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>
              Pomieszczenia
            </Text>

            <Text style={styles.subtitle}>
              Zarządzaj pomieszczeniami w domu
            </Text>
          </View>

          {rooms.length > 0 && (
            <Pressable
              onPress={handleAddRoom}
              style={({ pressed }) => [
                styles.smallButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.smallButtonText
                }
              >
                + Dodaj
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" />

            <Text style={styles.infoText}>
              Pobieranie pomieszczeń...
            </Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>
              Wystąpił błąd
            </Text>

            <Text style={styles.infoText}>
              {error}
            </Text>

            <Pressable
              onPress={loadRooms}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                Spróbuj ponownie
              </Text>
            </Pressable>
          </View>
        )}

        {!isLoading &&
          !error &&
          rooms.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>
                🚪
              </Text>

              <Text style={styles.emptyTitle}>
                Brak pomieszczeń
              </Text>

              <Text style={styles.infoText}>
                Dodaj pierwsze pomieszczenie,
                np. salon, kuchnię lub kotłownię.
              </Text>

              <Pressable
                onPress={handleAddRoom}
                style={({ pressed }) => [
                  styles.button,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text style={styles.buttonText}>
                  + Dodaj pomieszczenie
                </Text>
              </Pressable>
            </View>
          )}

        {!isLoading &&
          !error &&
          rooms.length > 0 && (
            <View style={styles.list}>
              {rooms.map((room) => (
                <Pressable
                  key={room.id}
                  style={({ pressed }) => [
                    styles.card,
                    pressed &&
                      styles.pressed,
                  ]}
                  onPress={() => {
                    router.push({
                      pathname: '/room/[id]',
                      params: {
                        id: room.id.toString(),
                      },
                    });
                  }}
                >
                  <View
                    style={
                      styles.iconContainer
                    }
                  >
                    <Text style={styles.icon}>
                      🚪
                    </Text>
                  </View>

                  <View
                    style={styles.roomInfo}
                  >
                    <Text
                      style={styles.roomName}
                    >
                      {room.name}
                    </Text>

                    {room.floor && (
                      <Text
                        style={styles.detail}
                      >
                        {room.floor}
                      </Text>
                    )}

                    {room.description && (
                      <Text
                        style={
                          styles.description
                        }
                      >
                        {room.description}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.arrow}>
                    ›
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
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
    flexGrow: 1,
    padding: 24,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },

  center: {
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#B91C1C',
  },

  infoText: {
    marginTop: 8,
    maxWidth: 340,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 21,
  },

  button: {
    marginTop: 24,
    backgroundColor: '#111827',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 12,
  },

  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },

  smallButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },

  smallButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.7,
  },

  list: {
    marginTop: 24,
    gap: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 28,
  },

  roomInfo: {
    flex: 1,
    marginLeft: 16,
  },

  roomName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  detail: {
    marginTop: 5,
    color: '#6B7280',
  },

  description: {
    marginTop: 5,
    color: '#9CA3AF',
  },

  arrow: {
    fontSize: 30,
    color: '#9CA3AF',
  },
});