import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  useCallback,
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
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  apiFetch,
} from '../../lib/api';

interface Property {
  id: number;
  name: string;
  address?: string;
  yearBuilt?: number;
}

export default function PropertyDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [property, setProperty] =
    useState<Property | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const loadProperty =
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

          const response =
            await apiFetch(
              `/properties/${id}`,
            );

          if (!response.ok) {
            throw new Error(
              await response.text(),
            );
          }

          setProperty(
            await response.json(),
          );
        } catch (err) {
          console.error(
            'Błąd pobierania domu:',
            err,
          );

          setError(
            'Nie udało się pobrać nieruchomości.',
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
      void loadProperty();
    }, [loadProperty]),
  );

  const handleEdit = () => {
    router.push({
      pathname:
        '/property/[id]/edit',

      params: {
        id,
      },
    });
  };

  const handleOpenRooms = () => {
    router.push({
      pathname:
        '/property/[id]/rooms',

      params: {
        id,
      },
    });
  };

  const askDelete =
    async () => {
      if (
        Platform.OS ===
        'web'
      ) {
        return window.confirm(
          'Usunąć ten dom wraz ze wszystkimi pomieszczeniami, wpisami i zdjęciami?',
        );
      }

      return new Promise<boolean>(
        (
          resolve,
        ) => {
          Alert.alert(
            'Usuń dom',

            'Usunięte zostaną także wszystkie pomieszczenia, wpisy i zdjęcia.',

            [
              {
                text:
                  'Anuluj',

                style:
                  'cancel',

                onPress: () =>
                  resolve(
                    false,
                  ),
              },

              {
                text:
                  'Usuń',

                style:
                  'destructive',

                onPress: () =>
                  resolve(
                    true,
                  ),
              },
            ],

            {
              cancelable:
                true,

              onDismiss:
                () =>
                  resolve(
                    false,
                  ),
            },
          );
        },
      );
    };

  const handleDelete =
    async () => {
      if (!id) {
        return;
      }

      if (
        !(await askDelete())
      ) {
        return;
      }

      try {
        setIsDeleting(
          true,
        );

        const response =
          await apiFetch(
            `/properties/${id}`,
            {
              method:
                'DELETE',
            },
          );

        if (!response.ok) {
          throw new Error(
            await response.text(),
          );
        }

        router.replace('/');
      } catch (err) {
        console.error(
          'Błąd usuwania domu:',
          err,
        );

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            'Nie udało się usunąć domu.',
          );
        } else {
          Alert.alert(
            'Błąd',
            'Nie udało się usunąć domu.',
          );
        }
      } finally {
        setIsDeleting(
          false,
        );
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
              styles.infoText
            }
          >
            Pobieranie domu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !property
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={styles.center}
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Nie udało się otworzyć domu
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
          style={styles.icon}
        >
          🏠
        </Text>

        <Text
          style={styles.name}
        >
          {property.name}
        </Text>

        {property.address && (
          <Text
            style={
              styles.detail
            }
          >
            📍 {property.address}
          </Text>
        )}

        {property.yearBuilt && (
          <Text
            style={
              styles.detail
            }
          >
            Rok budowy:{' '}
            {property.yearBuilt}
          </Text>
        )}

        <View
          style={
            styles.actions
          }
        >
          <Pressable
            onPress={handleEdit}
            style={
              styles.editButton
            }
          >
            <Text
              style={
                styles.editText
              }
            >
              ✏️ Edytuj
            </Text>
          </Pressable>

          <Pressable
            disabled={
              isDeleting
            }
            onPress={
              handleDelete
            }
            style={
              styles.deleteButton
            }
          >
            <Text
              style={
                styles.deleteText
              }
            >
              {isDeleting
                ? 'Usuwanie...'
                : '🗑 Usuń'}
            </Text>
          </Pressable>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Dokumentacja domu
        </Text>

        <Pressable
          onPress={
            handleOpenRooms
          }
          style={
            styles.menuCard
          }
        >
          <Text
            style={
              styles.menuIcon
            }
          >
            🚪
          </Text>

          <View
            style={
              styles.menuContent
            }
          >
            <Text
              style={
                styles.menuTitle
              }
            >
              Pomieszczenia
            </Text>

            <Text
              style={
                styles.detail
              }
            >
              Salon, kuchnia,
              łazienka...
            </Text>
          </View>

          <Text
            style={
              styles.arrow
            }
          >
            ›
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
      padding: 24,
    },

    icon: {
      fontSize: 54,
    },

    name: {
      marginTop: 16,
      fontSize: 30,
      fontWeight:
        '700',
      color: '#111827',
    },

    detail: {
      marginTop: 8,
      fontSize: 15,
      color: '#6B7280',
    },

    actions: {
      marginTop: 24,
      flexDirection:
        'row',
      gap: 12,
    },

    editButton: {
      padding: 13,
      borderRadius: 10,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
    },

    editText: {
      fontWeight:
        '600',
      color: '#111827',
    },

    deleteButton: {
      padding: 13,
      borderRadius: 10,
      backgroundColor:
        '#FEE2E2',
    },

    deleteText: {
      color: '#B91C1C',
      fontWeight:
        '600',
    },

    sectionTitle: {
      marginTop: 36,
      marginBottom: 16,
      fontSize: 20,
      fontWeight:
        '700',
      color: '#111827',
    },

    menuCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      padding: 18,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    menuIcon: {
      fontSize: 30,
    },

    menuContent: {
      flex: 1,
      marginLeft: 16,
    },

    menuTitle: {
      fontSize: 17,
      fontWeight:
        '600',
      color: '#111827',
    },

    arrow: {
      fontSize: 30,
      color: '#9CA3AF',
    },

    infoText: {
      marginTop: 10,
      color: '#6B7280',
      textAlign:
        'center',
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
    },
  });