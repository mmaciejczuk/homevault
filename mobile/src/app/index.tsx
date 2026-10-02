import { router, useFocusEffect } from 'expo-router';

import { useCallback, useMemo, useState } from 'react';

import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '../lib/api';

interface Property {
  id: number;
  name: string;
  address?: string | null;
  yearBuilt?: number | null;
}

type AttentionStatus = 'OVERDUE' | 'EXPIRED' | 'SOON' | 'UPCOMING';

interface AttentionEntry {
  id: number;
  title: string;

  room: {
    id: number;
    name: string;

    property: {
      id: number;
      name: string;
    };
  };
}

interface AttentionDevice {
  id: number;
  entryId: number;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
}

interface ServiceReminder {
  id: number;
  kind: 'SERVICE';
  status: AttentionStatus;
  date: string;
  daysUntil: number;
  serviceType: string;
  contractorName?: string | null;
  device: AttentionDevice;
  entry: AttentionEntry;
}

interface WarrantyReminder {
  id: number;
  kind: 'WARRANTY';
  status: AttentionStatus;
  date: string;
  daysUntil: number;
  device: AttentionDevice;
  entry: AttentionEntry;
}

interface DashboardAttention {
  generatedAt: string;
  horizonDays: number;

  counts: {
    service: number;
    warranty: number;
    overdueService: number;
    expiredWarranty: number;
  };

  serviceReminders: ServiceReminder[];
  warrantyReminders: WarrantyReminder[];
}

interface AttentionItem {
  id: string;
  type: 'SERVICE' | 'WARRANTY';
  status: AttentionStatus;
  date: string;
  daysUntil: number;
  entryId: number;
  title: string;
  subtitle: string;
}

const serviceTypeLabels: Record<string, string> = {
  INSTALLATION: 'Montaż',
  INSPECTION: 'Przegląd',
  REPAIR: 'Naprawa',
  MAINTENANCE: 'Konserwacja',
  OTHER: 'Serwis',
};

export default function HomeScreen() {
  const [properties, setProperties] = useState<Property[]>([]);

  const [attention, setAttention] = useState<DashboardAttention | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [propertiesResponse, attentionResponse] = await Promise.all([
        apiFetch('/properties'),

        apiFetch('/dashboard/attention'),
      ]);

      if (!propertiesResponse.ok) {
        const body = await propertiesResponse.text();

        throw new Error(`GET /properties zwróciło ${propertiesResponse.status}: ${body}`);
      }

      if (!attentionResponse.ok) {
        const body = await attentionResponse.text();

        throw new Error(`GET /dashboard/attention zwróciło ${attentionResponse.status}: ${body}`);
      }

      const propertiesData: Property[] = await propertiesResponse.json();

      const attentionData: DashboardAttention = await attentionResponse.json();

      setProperties(propertiesData);

      setAttention(attentionData);
    } catch (err) {
      console.error('Błąd pobierania strony głównej:', err);

      setError('Nie udało się pobrać danych.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const attentionItems = useMemo<AttentionItem[]>(() => {
    if (!attention) {
      return [];
    }

    const serviceItems = attention.serviceReminders.map((reminder): AttentionItem => ({
      id: `service-${reminder.id}`,

      type: 'SERVICE',

      status: reminder.status,

      date: reminder.date,

      daysUntil: reminder.daysUntil,

      entryId: reminder.entry.id,

      title: `${serviceTypeLabels[reminder.serviceType] ?? 'Serwis'}: ${reminder.entry.title}`,

      subtitle: `${reminder.entry.room.property.name} › ${reminder.entry.room.name}`,
    }));

    const warrantyItems = attention.warrantyReminders.map((reminder): AttentionItem => ({
      id: `warranty-${reminder.id}`,

      type: 'WARRANTY',

      status: reminder.status,

      date: reminder.date,

      daysUntil: reminder.daysUntil,

      entryId: reminder.entry.id,

      title: `Gwarancja: ${reminder.entry.title}`,

      subtitle: `${reminder.entry.room.property.name} › ${reminder.entry.room.name}`,
    }));

    return [...serviceItems, ...warrantyItems].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }, [attention]);

  const criticalCount = attention
    ? attention.counts.overdueService + attention.counts.expiredWarranty
    : 0;

  const handlePropertyPress = (propertyId: number) => {
    router.push({
      pathname: '/property/[id]',

      params: {
        id: String(propertyId),
      },
    });
  };

  const handleAttentionPress = (entryId: number) => {
    router.push({
      pathname: '/entry/[id]/device',

      params: {
        id: String(entryId),
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>Pobieranie danych...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.logo}>HomeVault</Text>

          <Text style={styles.subtitle}>Twoja cyfrowa dokumentacja domu</Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/search')}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={styles.headerButtonIcon}>🔎</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/account')}
            style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
          >
            <Text style={styles.headerButtonIcon}>👤</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Nie udało się pobrać danych</Text>

            <Text style={styles.errorText}>{error}</Text>

            <Pressable
              onPress={() => void loadData()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
            </Pressable>
          </View>
        )}

        {!error && attentionItems.length > 0 && (
          <View style={styles.attentionSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Wymaga uwagi</Text>

                <Text style={styles.sectionSubtitle}>Serwisy i gwarancje w ciągu 60 dni</Text>
              </View>

              <View
                style={[styles.attentionCount, criticalCount > 0 && styles.attentionCountCritical]}
              >
                <Text
                  style={[
                    styles.attentionCountText,

                    criticalCount > 0 && styles.attentionCountTextCritical,
                  ]}
                >
                  {attentionItems.length}
                </Text>
              </View>
            </View>

            {criticalCount > 0 && (
              <View style={styles.criticalBanner}>
                <Text style={styles.criticalBannerIcon}>⚠️</Text>

                <Text style={styles.criticalBannerText}>
                  {criticalCount === 1
                    ? '1 pozycja jest po terminie.'
                    : `${criticalCount} pozycje są po terminie.`}
                </Text>
              </View>
            )}

            <View style={styles.attentionList}>
              {attentionItems.slice(0, 8).map((item) => (
                <AttentionCard
                  key={item.id}
                  item={item}
                  onPress={() => handleAttentionPress(item.entryId)}
                />
              ))}
            </View>

            {attentionItems.length > 8 && (
              <Text style={styles.moreAttention}>+ {attentionItems.length - 8} kolejnych</Text>
            )}
          </View>
        )}

        {!error && attentionItems.length === 0 && (
          <View style={styles.allGoodCard}>
            <Text style={styles.allGoodIcon}>✅</Text>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.allGoodTitle}>Wszystko aktualne</Text>

              <Text style={styles.allGoodText}>
                Brak serwisów i gwarancji wymagających uwagi w najbliższych 60 dniach.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.propertiesHeader}>
          <View>
            <Text style={styles.sectionTitle}>Moje domy</Text>

            <Text style={styles.sectionSubtitle}>
              {properties.length === 1 ? '1 nieruchomość' : `${properties.length} nieruchomości`}
            </Text>
          </View>

          {properties.length > 0 && (
            <Pressable
              onPress={() => router.push('/create-property')}
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            >
              <Text style={styles.addButtonText}>+ Dodaj</Text>
            </Pressable>
          )}
        </View>

        {properties.length > 0 ? (
          <View style={styles.propertiesList}>
            {properties.map((property) => (
              <Pressable
                key={property.id}
                onPress={() => handlePropertyPress(property.id)}
                style={({ pressed }) => [styles.propertyCard, pressed && styles.pressed]}
              >
                <View style={styles.propertyIcon}>
                  <Text style={styles.propertyIconText}>🏠</Text>
                </View>

                <View style={styles.propertyContent}>
                  <Text style={styles.propertyName}>{property.name}</Text>

                  {!!property.address && (
                    <Text style={styles.propertyAddress}>{property.address}</Text>
                  )}

                  {!!property.yearBuilt && (
                    <Text style={styles.propertyMeta}>Rok budowy: {property.yearBuilt}</Text>
                  )}
                </View>

                <Text style={styles.arrow}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏠</Text>

            <Text style={styles.emptyTitle}>Dodaj swój pierwszy dom</Text>

            <Text style={styles.emptyText}>
              Zacznij tworzyć cyfrową dokumentację nieruchomości.
            </Text>

            <Pressable
              onPress={() => router.push('/create-property')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>+ Dodaj dom</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AttentionCard({ item, onPress }: { item: AttentionItem; onPress: () => void }) {
  const isCritical = item.status === 'OVERDUE' || item.status === 'EXPIRED';

  const icon = item.type === 'SERVICE' ? '🧰' : '🛡️';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.attentionCard,

        isCritical && styles.attentionCardCritical,

        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.attentionIcon, isCritical && styles.attentionIconCritical]}>
        <Text style={styles.attentionIconText}>{icon}</Text>
      </View>

      <View style={styles.attentionContent}>
        <Text style={styles.attentionTitle} numberOfLines={2}>
          {item.title}
        </Text>

        <Text style={styles.attentionSubtitle} numberOfLines={1}>
          {item.subtitle}
        </Text>

        <Text style={[styles.attentionDate, isCritical && styles.attentionDateCritical]}>
          {formatAttentionDate(item)}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

function formatAttentionDate(item: AttentionItem) {
  if (item.daysUntil < 0) {
    const days = Math.abs(item.daysUntil);

    return days === 1 ? '1 dzień po terminie' : `${days} dni po terminie`;
  }

  if (item.daysUntil === 0) {
    return item.type === 'WARRANTY' ? 'Gwarancja kończy się dzisiaj' : 'Termin dzisiaj';
  }

  if (item.daysUntil === 1) {
    return item.type === 'WARRANTY' ? 'Gwarancja kończy się jutro' : 'Termin jutro';
  }

  return item.type === 'WARRANTY'
    ? `Gwarancja kończy się za ${item.daysUntil} dni`
    : `Termin za ${item.daysUntil} dni`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
  },

  logo: {
    color: '#111827',
    fontSize: 27,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 13,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerButtonIcon: {
    fontSize: 19,
  },

  content: {
    padding: 20,
    paddingBottom: 70,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },

  errorBox: {
    padding: 18,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    marginBottom: 22,
  },

  errorTitle: {
    color: '#991B1B',
    fontSize: 16,
    fontWeight: '700',
  },

  errorText: {
    marginTop: 5,
    color: '#B91C1C',
  },

  retryButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: '#991B1B',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  attentionSection: {
    marginBottom: 30,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '700',
  },

  sectionSubtitle: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 13,
  },

  attentionCount: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  attentionCountCritical: {
    backgroundColor: '#FEE2E2',
  },

  attentionCountText: {
    color: '#4B5563',
    fontWeight: '800',
  },

  attentionCountTextCritical: {
    color: '#B91C1C',
  },

  criticalBanner: {
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
  },

  criticalBannerIcon: {
    fontSize: 17,
  },

  criticalBannerText: {
    marginLeft: 8,
    color: '#991B1B',
    fontWeight: '600',
    fontSize: 13,
  },

  attentionList: {
    gap: 9,
  },

  attentionCard: {
    minHeight: 88,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  attentionCardCritical: {
    borderColor: '#FECACA',
  },

  attentionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  attentionIconCritical: {
    backgroundColor: '#FEF2F2',
  },

  attentionIconText: {
    fontSize: 23,
  },

  attentionContent: {
    flex: 1,
    marginLeft: 12,
  },

  attentionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
  },

  attentionSubtitle: {
    marginTop: 3,
    color: '#6B7280',
    fontSize: 12,
  },

  attentionDate: {
    marginTop: 6,
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },

  attentionDateCritical: {
    color: '#B91C1C',
  },

  moreAttention: {
    marginTop: 10,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
  },

  allGoodCard: {
    marginBottom: 30,
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
  },

  allGoodIcon: {
    fontSize: 24,
    marginRight: 12,
  },

  allGoodTitle: {
    color: '#166534',
    fontWeight: '700',
    fontSize: 15,
  },

  allGoodText: {
    marginTop: 3,
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 18,
  },

  propertiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#111827',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  propertiesList: {
    gap: 11,
  },

  propertyCard: {
    minHeight: 90,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  propertyIcon: {
    width: 54,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  propertyIconText: {
    fontSize: 27,
  },

  propertyContent: {
    flex: 1,
    marginLeft: 14,
  },

  propertyName: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '700',
  },

  propertyAddress: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 13,
  },

  propertyMeta: {
    marginTop: 4,
    color: '#9CA3AF',
    fontSize: 11,
  },

  arrow: {
    marginLeft: 10,
    color: '#9CA3AF',
    fontSize: 28,
  },

  emptyCard: {
    paddingVertical: 45,
    paddingHorizontal: 25,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    marginTop: 14,
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
  },

  emptyText: {
    marginTop: 7,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  primaryButton: {
    marginTop: 20,
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 11,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.72,
  },
});
