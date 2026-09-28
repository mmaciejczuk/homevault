import {
  router,
  useFocusEffect,
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
} from '../lib/api';

interface Property {
  id: number;
  name: string;
  address?: string;
  yearBuilt?: number;
}

export default function HomeScreen() {
  const [
    properties,
    setProperties,
  ] = useState<Property[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const loadProperties =
    useCallback(
      async () => {
        try {
          setIsLoading(true);
          setError(null);

          const response =
            await apiFetch(
              '/properties',
            );

          if (!response.ok) {
            throw new Error(
              `API zwróciło status ${response.status}`,
            );
          }

          const data: Property[] =
            await response.json();

          setProperties(data);
        } catch (err) {
          console.error(
            'Błąd pobierania nieruchomości:',
            err,
          );

          setError(
            'Nie udało się pobrać nieruchomości.',
          );
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]),
  );

  const handleAddProperty =
    () => {
      router.push(
        '/create-property',
      );
    };

  const handleAccount =
    () => {
      router.push(
        '/account',
      );
    };

  const handlePropertyPress =
    (propertyId: number) => {
      router.push({
        pathname:
          '/property/[id]',

        params: {
          id: String(
            propertyId,
          ),
        },
      });
    };

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <View
        style={
          styles.header
        }
      >
        <View
          style={
            styles.headerText
          }
        >
          <Text
            style={
              styles.logo
            }
          >
            HomeVault
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Twoja cyfrowa
            dokumentacja domu
          </Text>
        </View>

        <Pressable
          onPress={
            handleAccount
          }
          style={({
            pressed,
          }) => [
            styles.accountButton,

            pressed &&
              styles.buttonPressed,
          ]}
        >
          <Text
            style={
              styles.accountIcon
            }
          >
            👤
          </Text>

          <Text
            style={
              styles.accountButtonText
            }
          >
            Konto
          </Text>
        </Pressable>
      </View>

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.titleRow
          }
        >
          <Text
            style={
              styles.title
            }
          >
            Moje domy
          </Text>

          {properties.length >
            0 && (
            <Pressable
              onPress={
                handleAddProperty
              }
              style={({
                pressed,
              }) => [
                styles.smallAddButton,

                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <Text
                style={
                  styles.smallAddButtonText
                }
              >
                + Dodaj
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading && (
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
                styles.loadingText
              }
            >
              Pobieranie
              nieruchomości...
            </Text>
          </View>
        )}

        {!isLoading &&
          error && (
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
                Nie udało się
                pobrać danych
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>

              <Pressable
                onPress={
                  loadProperties
                }
                style={({
                  pressed,
                }) => [
                  styles.retryButton,

                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.retryButtonText
                  }
                >
                  Spróbuj ponownie
                </Text>
              </Pressable>
            </View>
          )}

        {!isLoading &&
          !error &&
          properties.length ===
            0 && (
            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={
                  styles.emptyIconContainer
                }
              >
                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  🏠
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Dodaj swój
                pierwszy dom
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Utwórz
                nieruchomość,
                aby zacząć
                przechowywać
                dokumentację,
                zdjęcia i
                informacje o
                swoim domu.
              </Text>

              <Pressable
                onPress={
                  handleAddProperty
                }
                style={({
                  pressed,
                }) => [
                  styles.addButton,

                  pressed &&
                    styles.buttonPressed,
                ]}
              >
                <Text
                  style={
                    styles.addButtonText
                  }
                >
                  + Dodaj dom
                </Text>
              </Pressable>
            </View>
          )}

        {!isLoading &&
          !error &&
          properties.length >
            0 && (
            <View
              style={
                styles.propertiesList
              }
            >
              {properties.map(
                (
                  property,
                ) => (
                  <Pressable
                    key={
                      property.id
                    }
                    onPress={() =>
                      handlePropertyPress(
                        property.id,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.propertyCard,

                      pressed &&
                        styles.propertyCardPressed,
                    ]}
                  >
                    <View
                      style={
                        styles.propertyIconContainer
                      }
                    >
                      <Text
                        style={
                          styles.propertyIcon
                        }
                      >
                        🏠
                      </Text>
                    </View>

                    <View
                      style={
                        styles.propertyInfo
                      }
                    >
                      <Text
                        style={
                          styles.propertyName
                        }
                      >
                        {
                          property.name
                        }
                      </Text>

                      {property.address ? (
                        <Text
                          style={
                            styles.propertyDetail
                          }
                        >
                          {
                            property.address
                          }
                        </Text>
                      ) : null}

                      {property.yearBuilt ? (
                        <Text
                          style={
                            styles.propertyDetail
                          }
                        >
                          Rok budowy:{' '}
                          {
                            property.yearBuilt
                          }
                        </Text>
                      ) : null}
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
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
    },

    header: {
      paddingHorizontal: 24,
      paddingTop: 14,
      paddingBottom: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      borderBottomWidth: 1,
      borderBottomColor:
        '#E5E7EB',
      backgroundColor:
        '#FFFFFF',
    },

    headerText: {
      flex: 1,
      marginRight: 16,
    },

    logo: {
      fontSize: 26,
      fontWeight: '800',
      color: '#111827',
    },

    subtitle: {
      marginTop: 3,
      fontSize: 13,
      color: '#6B7280',
    },

    accountButton: {
      minHeight: 42,
      paddingHorizontal: 13,
      borderRadius: 11,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    accountIcon: {
      fontSize: 16,
      marginRight: 7,
    },

    accountButtonText: {
      color: '#374151',
      fontSize: 14,
      fontWeight: '600',
    },

    scrollView: {
      flex: 1,
    },

    content: {
      padding: 24,
      paddingBottom: 60,
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
    },

    center: {
      marginTop: 80,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 20,
    },

    loadingText: {
      marginTop: 14,
      color: '#6B7280',
    },

    errorTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
    },

    errorText: {
      marginTop: 8,
      color: '#6B7280',
      textAlign: 'center',
    },

    retryButton: {
      marginTop: 22,
      paddingHorizontal: 20,
      paddingVertical: 13,
      backgroundColor:
        '#111827',
      borderRadius: 12,
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },

    emptyState: {
      marginTop: 70,
      alignItems: 'center',
      paddingHorizontal: 20,
    },

    emptyIconContainer: {
      width: 86,
      height: 86,
      borderRadius: 24,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    emptyIcon: {
      fontSize: 42,
    },

    emptyTitle: {
      marginTop: 22,
      fontSize: 22,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
    },

    emptyText: {
      maxWidth: 420,
      marginTop: 10,
      fontSize: 15,
      lineHeight: 22,
      color: '#6B7280',
      textAlign: 'center',
    },

    addButton: {
      minHeight: 50,
      marginTop: 26,
      paddingHorizontal: 24,
      borderRadius: 12,
      backgroundColor:
        '#111827',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    addButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '600',
    },

    smallAddButton: {
      backgroundColor:
        '#111827',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },

    smallAddButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },

    propertiesList: {
      marginTop: 24,
      gap: 14,
    },

    propertyCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
    },

    propertyCardPressed: {
      opacity: 0.75,
    },

    propertyIconContainer: {
      width: 54,
      height: 54,
      borderRadius: 14,
      backgroundColor:
        '#F3F4F6',
      justifyContent:
        'center',
      alignItems: 'center',
    },

    propertyIcon: {
      fontSize: 28,
    },

    propertyInfo: {
      flex: 1,
      marginLeft: 16,
    },

    propertyName: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },

    propertyDetail: {
      marginTop: 5,
      fontSize: 14,
      color: '#6B7280',
    },

    arrow: {
      marginLeft: 12,
      fontSize: 32,
      color: '#9CA3AF',
    },

    buttonPressed: {
      opacity: 0.7,
    },
  });