import { router, useFocusEffect } from 'expo-router';
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

interface Property {
  id: number;
  name: string;
  address?: string;
  yearBuilt?: number;
}

export default function HomeScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Pobieram nieruchomości...');

      const response = await fetch(`${API_URL}/properties`);

      if (!response.ok) {
        throw new Error(`API zwróciło status ${response.status}`);
      }

      const data: Property[] = await response.json();

      console.log('Pobrane nieruchomości:', data);

      setProperties(data);
    } catch (err) {
      console.error('Błąd pobierania nieruchomości:', err);

      setError('Nie udało się pobrać nieruchomości.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProperties();
    }, [loadProperties]),
  );

  const handleAddProperty = () => {
    router.push('/create-property');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>HomeVault</Text>

          <Text style={styles.subtitle}>
            Twoja cyfrowa dokumentacja domu
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Moje domy</Text>

          {properties.length > 0 && (
            <Pressable
              onPress={handleAddProperty}
              style={({ pressed }) => [
                styles.smallAddButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.smallAddButtonText}>+ Dodaj</Text>
            </Pressable>
          )}
        </View>

        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" />

            <Text style={styles.loadingText}>
              Pobieranie nieruchomości...
            </Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>
              Nie udało się pobrać danych
            </Text>

            <Text style={styles.errorDescription}>
              {error}
            </Text>

            <Pressable
              onPress={loadProperties}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                Spróbuj ponownie
              </Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && properties.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.houseIcon}>🏠</Text>

            <Text style={styles.emptyTitle}>
              Nie masz jeszcze żadnej nieruchomości
            </Text>

            <Text style={styles.emptyDescription}>
              Dodaj swój pierwszy dom, aby rozpocząć dokumentowanie instalacji,
              urządzeń, zdjęć i dokumentów.
            </Text>

            <Pressable
              onPress={handleAddProperty}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>
                + Dodaj dom
              </Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && properties.length > 0 && (
          <View style={styles.propertiesList}>
            {properties.map((property) => (
              <Pressable
                key={property.id}
                style={({ pressed }) => [
                  styles.propertyCard,
                  pressed && styles.propertyCardPressed,
                ]}
                onPress={() => {
                    router.push({
                    pathname: '/property/[id]',
                    params: {
                      id: property.id.toString(),
                    },
                  });
                }}
              >
                <View style={styles.propertyIconContainer}>
                  <Text style={styles.propertyIcon}>🏠</Text>
                </View>

                <View style={styles.propertyInfo}>
                  <Text style={styles.propertyName}>
                    {property.name}
                  </Text>

                  {property.address && (
                    <Text style={styles.propertyDetail}>
                      📍 {property.address}
                    </Text>
                  )}

                  {property.yearBuilt && (
                    <Text style={styles.propertyDetail}>
                      Rok budowy: {property.yearBuilt}
                    </Text>
                  )}
                </View>

                <Text style={styles.arrow}>›</Text>
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

  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },

  scrollView: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    padding: 24,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },

  center: {
    flex: 1,
    minHeight: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#6B7280',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },

  errorDescription: {
    marginTop: 8,
    fontSize: 15,
    color: '#6B7280',
  },

  emptyState: {
    flex: 1,
    minHeight: 500,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },

  houseIcon: {
    fontSize: 64,
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  emptyDescription: {
    marginTop: 10,
    maxWidth: 340,
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
  },

  button: {
    marginTop: 28,
    backgroundColor: '#111827',
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.75,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  smallAddButton: {
    backgroundColor: '#111827',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  propertyCardPressed: {
    opacity: 0.75,
  },

  propertyIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
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
});