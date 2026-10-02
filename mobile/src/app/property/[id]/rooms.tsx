import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
}

export default function RoomsScreen() {
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
    rooms,
    setRooms,
  ] =
    useState<Room[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const loadData =
    useCallback(
      async () => {
        if (!id) {
          return;
        }

        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const [
            propertyResponse,
            roomsResponse,
          ] =
            await Promise.all([
              apiFetch(
                `/properties/${id}`,
              ),

              apiFetch(
                `/properties/${id}/rooms`,
              ),
            ]);

          if (
            !propertyResponse.ok
          ) {
            const body =
              await propertyResponse.text();

            throw new Error(
              `Property API ${propertyResponse.status}: ${body}`,
            );
          }

          if (
            !roomsResponse.ok
          ) {
            const body =
              await roomsResponse.text();

            throw new Error(
              `Rooms API ${roomsResponse.status}: ${body}`,
            );
          }

          const propertyData:
            Property =
            await propertyResponse.json();

          const roomsData:
            Room[] =
            await roomsResponse.json();

          setProperty(
            propertyData,
          );

          setRooms(
            roomsData,
          );
        } catch (err) {
          console.error(
            'Błąd pobierania pomieszczeń:',
            err,
          );

          setError(
            'Nie udało się pobrać pomieszczeń.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      },
      [id],
    );

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleAddRoom =
    () => {
      router.push({
        pathname:
          '/property/[id]/create-room',

        params: {
          id,
        },
      });
    };

  const handleOpenRoom =
    (
      roomId: number,
    ) => {
      router.push({
        pathname:
          '/room/[id]',

        params: {
          id:
            roomId.toString(),
        },
      });
    };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Pomieszczenia',
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
              Pobieranie pomieszczeń...
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
              property
                ? `${property.name} › Pomieszczenia`
                : 'Pomieszczenia',
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

            <Pressable
              onPress={
                loadData
              }
              style={
                styles.button
              }
            >
              <Text
                style={
                  styles.buttonText
                }
              >
                Spróbuj ponownie
              </Text>
            </Pressable>
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
              ? `${property.name} › Pomieszczenia`
              : 'Pomieszczenia',
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
        >
          <View
            style={
              styles.headerRow
            }
          >
            <View
              style={
                styles.headerContent
              }
            >
              <Text
                style={
                  styles.title
                }
              >
                Pomieszczenia
              </Text>

              {property && (
                <Text
                  style={
                    styles.subtitle
                  }
                >
                  🏠{' '}
                  {property.name}
                </Text>
              )}
            </View>

            {rooms.length >
              0 && (
              <Pressable
                onPress={
                  handleAddRoom
                }
                style={({
                  pressed,
                }) => [
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

          {rooms.length ===
          0 ? (
            <View
              style={
                styles.emptyState
              }
            >
              <Text
                style={
                  styles.emptyIcon
                }
              >
                🚪
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Brak pomieszczeń
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                Dodaj pierwsze
                pomieszczenie do
                tego domu.
              </Text>

              <Pressable
                onPress={
                  handleAddRoom
                }
                style={({
                  pressed,
                }) => [
                  styles.button,

                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  + Dodaj pomieszczenie
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={
                styles.list
              }
            >
              {rooms.map(
                (
                  room,
                ) => (
                  <Pressable
                    key={
                      room.id
                    }
                    onPress={() =>
                      handleOpenRoom(
                        room.id,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.card,

                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <View
                      style={
                        styles.iconContainer
                      }
                    >
                      <Text
                        style={
                          styles.icon
                        }
                      >
                        🚪
                      </Text>
                    </View>

                    <View
                      style={
                        styles.roomInfo
                      }
                    >
                      <Text
                        style={
                          styles.roomName
                        }
                      >
                        {room.name}
                      </Text>

                      {room.floor && (
                        <Text
                          style={
                            styles.detail
                          }
                        >
                          {
                            room.floor
                          }
                        </Text>
                      )}

                      {room.description && (
                        <Text
                          style={
                            styles.description
                          }
                          numberOfLines={
                            2
                          }
                        >
                          {
                            room.description
                          }
                        </Text>
                      )}
                    </View>

                    <Text
                      style={
                        styles.arrow
                      }
                    >
                      ›
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          )}
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

    headerRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      gap: 16,
    },

    headerContent: {
      flex: 1,
    },

    title: {
      fontSize: 30,
      fontWeight:
        '700',
      color: '#111827',
    },

    subtitle: {
      marginTop: 7,
      fontSize: 15,
      color: '#6B7280',
    },

    emptyState: {
      minHeight: 470,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    emptyIcon: {
      fontSize: 58,
    },

    emptyTitle: {
      marginTop: 16,
      fontSize: 20,
      fontWeight:
        '600',
      color: '#111827',
    },

    infoText: {
      marginTop: 8,
      maxWidth: 360,
      textAlign:
        'center',
      color: '#6B7280',
      lineHeight: 21,
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
    },

    button: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 15,
      borderRadius: 12,
      backgroundColor:
        '#111827',
    },

    buttonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '600',
    },

    smallButton: {
      backgroundColor:
        '#111827',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },

    smallButtonText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
    },

    pressed: {
      opacity: 0.7,
    },

    list: {
      marginTop: 24,
      gap: 14,
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      padding: 18,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    iconContainer: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor:
        '#F3F4F6',
      alignItems:
        'center',
      justifyContent:
        'center',
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
      fontWeight:
        '600',
      color: '#111827',
    },

    detail: {
      marginTop: 5,
      color: '#6B7280',
    },

    description: {
      marginTop: 5,
      color: '#9CA3AF',
      lineHeight: 19,
    },

    arrow: {
      marginLeft: 12,
      fontSize: 30,
      color: '#9CA3AF',
    },
  });