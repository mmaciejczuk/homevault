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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { apiFetch } from '../../lib/api';

interface Property {
  id: number;
  name: string;
  address?: string;
  yearBuilt?: number;
}

export default function PropertyDetailsScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [property, setProperty] =
    useState<Property | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response =
          await apiFetch(
            `/properties/${id}`,
          );

        if (!response.ok) {
          const responseBody =
            await response.text();

          throw new Error(
            `API zwróciło status ${response.status}: ${responseBody}`,
          );
        }

        const data: Property =
          await response.json();

        console.log(
          'Pobrano nieruchomość:',
          data,
        );

        setProperty(data);
      } catch (err) {
        console.error(
          'Błąd pobierania domu:',
          err,
        );

        setError(
          'Nie udało się pobrać nieruchomości.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProperty();
    }
  }, [id]);

  const handleOpenRooms = () => {
    if (!property) {
      return;
    }

    router.push({
      pathname: '/property/[id]/rooms',
      params: {
        id: property.id.toString(),
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['bottom']}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
          />

          <Text
            style={styles.loadingText}
          >
            Pobieranie domu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={['bottom']}
      >
        <View style={styles.center}>
          <Text
            style={styles.errorTitle}
          >
            Nie udało się otworzyć domu
          </Text>

          <Text
            style={styles.errorText}
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.secondaryButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Wróć
            </Text>
          </Pressable>
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
          style={styles.houseIcon}
        >
          🏠
        </Text>

        <Text style={styles.name}>
          {property.name}
        </Text>

        {property.address && (
          <Text style={styles.detail}>
            📍 {property.address}
          </Text>
        )}

        {property.yearBuilt && (
          <Text style={styles.detail}>
            Rok budowy:{' '}
            {property.yearBuilt}
          </Text>
        )}

        <View style={styles.section}>
          <Text
            style={styles.sectionTitle}
          >
            Dokumentacja domu
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              pressed &&
                styles.menuCardPressed,
            ]}
            onPress={handleOpenRooms}
          >
            <Text
              style={styles.menuIcon}
            >
              🚪
            </Text>

            <View
              style={styles.menuContent}
            >
              <Text
                style={styles.menuTitle}
              >
                Pomieszczenia
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Salon, kuchnia,
                łazienka, kotłownia...
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              pressed &&
                styles.menuCardPressed,
            ]}
            onPress={() => {
              console.log(
                'Zdjęcia - do implementacji',
              );
            }}
          >
            <Text
              style={styles.menuIcon}
            >
              📷
            </Text>

            <View
              style={styles.menuContent}
            >
              <Text
                style={styles.menuTitle}
              >
                Zdjęcia
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Dokumentacja instalacji
                i budowy
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              pressed &&
                styles.menuCardPressed,
            ]}
            onPress={() => {
              console.log(
                'Dokumenty - do implementacji',
              );
            }}
          >
            <Text
              style={styles.menuIcon}
            >
              📄
            </Text>

            <View
              style={styles.menuContent}
            >
              <Text
                style={styles.menuTitle}
              >
                Dokumenty
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Faktury, gwarancje
                i instrukcje
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.menuCard,
              pressed &&
                styles.menuCardPressed,
            ]}
            onPress={() => {
              console.log(
                'Zapytaj swój dom - do implementacji',
              );
            }}
          >
            <Text
              style={styles.menuIcon}
            >
              🤖
            </Text>

            <View
              style={styles.menuContent}
            >
              <Text
                style={styles.menuTitle}
              >
                Zapytaj swój dom
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Wyszukuj informacje
                przy pomocy AI
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
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

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },

  houseIcon: {
    fontSize: 54,
  },

  name: {
    marginTop: 16,
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  detail: {
    marginTop: 8,
    fontSize: 15,
    color: '#6B7280',
  },

  section: {
    marginTop: 36,
  },

  sectionTitle: {
    marginBottom: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuCardPressed: {
    opacity: 0.7,
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
    fontWeight: '600',
    color: '#111827',
  },

  menuDescription: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },

  arrow: {
    fontSize: 30,
    color: '#9CA3AF',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  errorText: {
    marginTop: 8,
    color: '#6B7280',
  },

  secondaryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: '#111827',
    borderRadius: 12,
  },

  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});