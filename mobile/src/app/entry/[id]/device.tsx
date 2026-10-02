import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch } from '../../../lib/api';

type ServiceType = 'INSTALLATION' | 'INSPECTION' | 'REPAIR' | 'MAINTENANCE' | 'OTHER';

interface ServiceRecord {
  id: number;
  deviceId: number;
  type: ServiceType;
  serviceDate: string;
  description?: string | null;
  contractorName?: string | null;
  costCents?: number | null;
  nextServiceDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Device {
  id: number;
  entryId: number;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  installedAt?: string | null;
  warrantyUntil?: string | null;
  purchasePriceCents?: number | null;
  contractorName?: string | null;
  serviceRecords?: ServiceRecord[];
  createdAt: string;
  updatedAt: string;
}

const serviceTypeOptions: Array<{
  value: ServiceType;
  label: string;
  icon: string;
}> = [
  { value: 'INSTALLATION', label: 'Montaż', icon: '🛠️' },
  { value: 'INSPECTION', label: 'Przegląd', icon: '🔎' },
  { value: 'REPAIR', label: 'Naprawa', icon: '🔧' },
  { value: 'MAINTENANCE', label: 'Konserwacja', icon: '🧰' },
  { value: 'OTHER', label: 'Inne', icon: '📝' },
];

const serviceTypeLabels: Record<ServiceType, string> = {
  INSTALLATION: 'Montaż',
  INSPECTION: 'Przegląd',
  REPAIR: 'Naprawa',
  MAINTENANCE: 'Konserwacja',
  OTHER: 'Inne',
};

export default function DeviceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [device, setDevice] = useState<Device | null>(null);
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [installedAt, setInstalledAt] = useState('');
  const [warrantyUntil, setWarrantyUntil] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [contractorName, setContractorName] = useState('');

  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [serviceType, setServiceType] = useState<ServiceType>('INSPECTION');
  const [serviceDate, setServiceDate] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [serviceContractor, setServiceContractor] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingService, setIsSavingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nextService = useMemo(() => {
    const dates = serviceRecords
      .filter((record) => !!record.nextServiceDate)
      .map((record) => ({
        record,
        timestamp: new Date(record.nextServiceDate as string).getTime(),
      }))
      .filter((item) => Number.isFinite(item.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    return dates[0]?.record ?? null;
  }, [serviceRecords]);

  const fillDeviceForm = (value: Device) => {
    setManufacturer(value.manufacturer ?? '');
    setModel(value.model ?? '');
    setSerialNumber(value.serialNumber ?? '');
    setPurchaseDate(formatApiDate(value.purchaseDate));
    setInstalledAt(formatApiDate(value.installedAt));
    setWarrantyUntil(formatApiDate(value.warrantyUntil));
    setPurchasePrice(
      value.purchasePriceCents !== null && value.purchasePriceCents !== undefined
        ? (value.purchasePriceCents / 100).toFixed(2).replace('.', ',')
        : '',
    );
    setContractorName(value.contractorName ?? '');
  };

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const deviceResponse = await apiFetch(`/entries/${id}/device`);

      if (deviceResponse.status === 404) {
        setDevice(null);
        setServiceRecords([]);
        return;
      }

      if (!deviceResponse.ok) {
        const body = await deviceResponse.text();
        throw new Error(`GET device ${deviceResponse.status}: ${body}`);
      }

      const deviceData: Device = await deviceResponse.json();
      setDevice(deviceData);
      fillDeviceForm(deviceData);

      if (Array.isArray(deviceData.serviceRecords)) {
        setServiceRecords(deviceData.serviceRecords);
      } else {
        const recordsResponse = await apiFetch(`/devices/${deviceData.id}/service-records`);

        if (!recordsResponse.ok) {
          const body = await recordsResponse.text();
          throw new Error(`GET service records ${recordsResponse.status}: ${body}`);
        }

        setServiceRecords(await recordsResponse.json());
      }
    } catch (err) {
      console.error('Błąd pobierania danych urządzenia:', err);
      setError('Nie udało się pobrać danych urządzenia.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleSaveDevice = async () => {
    if (!id) return;

    try {
      setIsSaving(true);

      if (
        !isValidOptionalDate(purchaseDate) ||
        !isValidOptionalDate(installedAt) ||
        !isValidOptionalDate(warrantyUntil)
      ) {
        showMessage('Nieprawidłowa data', 'Użyj formatu RRRR-MM-DD.');
        return;
      }

      const priceCents = parseMoneyToCents(purchasePrice);
      if (purchasePrice.trim() && priceCents === null) {
        showMessage('Nieprawidłowa cena', 'Podaj cenę np. 1299,99.');
        return;
      }

      const commonPayload = {
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        serialNumber: serialNumber.trim() || null,
        purchaseDate: toApiDate(purchaseDate),
        installedAt: toApiDate(installedAt),
        warrantyUntil: toApiDate(warrantyUntil),
        purchasePriceCents: priceCents,
        contractorName: contractorName.trim() || null,
      };

      const response = device
        ? await apiFetch(`/devices/${device.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(commonPayload),
          })
        : await apiFetch(`/entries/${id}/device`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              Object.fromEntries(
                Object.entries(commonPayload).filter(([, value]) => value !== null),
              ),
            ),
          });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`SAVE device ${response.status}: ${body}`);
      }

      const saved: Device = await response.json();
      setDevice(saved);
      fillDeviceForm(saved);
      setServiceRecords(saved.serviceRecords ?? serviceRecords);
      showMessage('Zapisano', 'Dane urządzenia zostały zapisane.');
    } catch (err) {
      console.error('Błąd zapisu urządzenia:', err);
      showMessage('Błąd', 'Nie udało się zapisać danych urządzenia.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!device) return;

    try {
      setIsSavingService(true);

      if (!serviceDate.trim()) {
        showMessage('Brak daty', 'Podaj datę serwisu.');
        return;
      }

      if (!isValidOptionalDate(serviceDate) || !isValidOptionalDate(nextServiceDate)) {
        showMessage('Nieprawidłowa data', 'Użyj formatu RRRR-MM-DD.');
        return;
      }

      const costCents = parseMoneyToCents(serviceCost);
      if (serviceCost.trim() && costCents === null) {
        showMessage('Nieprawidłowy koszt', 'Podaj koszt np. 450,00.');
        return;
      }

      const response = await apiFetch(`/devices/${device.id}/service-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: serviceType,
          serviceDate: toApiDate(serviceDate),
          description: serviceDescription.trim() || undefined,
          contractorName: serviceContractor.trim() || undefined,
          costCents: costCents ?? undefined,
          nextServiceDate: toApiDate(nextServiceDate) ?? undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`POST service record ${response.status}: ${body}`);
      }

      setServiceType('INSPECTION');
      setServiceDate('');
      setServiceDescription('');
      setServiceContractor('');
      setServiceCost('');
      setNextServiceDate('');

      await loadData();
    } catch (err) {
      console.error('Błąd dodawania serwisu:', err);
      showMessage('Błąd', 'Nie udało się dodać wpisu serwisowego.');
    } finally {
      setIsSavingService(false);
    }
  };

  const removeService = async (record: ServiceRecord) => {
    try {
      setDeletingServiceId(record.id);

      const response = await apiFetch(`/service-records/${record.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`DELETE service record ${response.status}: ${body}`);
      }

      setServiceRecords((current) => current.filter((item) => item.id !== record.id));
    } catch (err) {
      console.error('Błąd usuwania serwisu:', err);
      showMessage('Błąd', 'Nie udało się usunąć wpisu serwisowego.');
    } finally {
      setDeletingServiceId(null);
    }
  };

  const confirmRemoveService = (record: ServiceRecord) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Usunąć ten wpis z historii serwisowej?')) {
        void removeService(record);
      }
      return;
    }

    Alert.alert('Usuń wpis serwisowy', 'Czy na pewno chcesz go usunąć?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => void removeService(record),
      },
    ]);
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Dane urządzenia' }} />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.muted}>Pobieranie danych urządzenia...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Dane urządzenia' }} />

      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Text style={styles.heroIconText}>🔧</Text>
            </View>
            <View style={styles.heroText}>
              <Text style={styles.title}>{device ? 'Dane urządzenia' : 'Dodaj urządzenie'}</Text>
              <Text style={styles.subtitle}>
                Producent, model, gwarancja, zakup i historia serwisowa.
              </Text>
            </View>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Urządzenie</Text>

            <Field
              label="Producent"
              value={manufacturer}
              onChangeText={setManufacturer}
              placeholder="np. Viessmann"
            />
            <Field
              label="Model"
              value={model}
              onChangeText={setModel}
              placeholder="np. Vitodens 100-W"
            />
            <Field
              label="Numer seryjny"
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="np. 123456789"
            />

            <Text style={styles.sectionTitle}>Zakup i montaż</Text>
            <Field
              label="Data zakupu"
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="RRRR-MM-DD"
            />
            <Field
              label="Data montażu"
              value={installedAt}
              onChangeText={setInstalledAt}
              placeholder="RRRR-MM-DD"
            />
            <Field
              label="Cena zakupu"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="np. 12999,00"
              suffix="zł"
            />
            <Field
              label="Instalator / firma"
              value={contractorName}
              onChangeText={setContractorName}
              placeholder="np. Instal-Pro"
            />

            <Text style={styles.sectionTitle}>Gwarancja</Text>
            <Field
              label="Gwarancja do"
              value={warrantyUntil}
              onChangeText={setWarrantyUntil}
              placeholder="RRRR-MM-DD"
            />

            <Pressable
              disabled={isSaving}
              onPress={() => void handleSaveDevice()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                isSaving && styles.disabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {device ? 'Zapisz dane urządzenia' : 'Dodaj urządzenie'}
                </Text>
              )}
            </Pressable>
          </View>

          {device && (
            <>
              {nextService && (
                <View style={styles.nextServiceCard}>
                  <Text style={styles.nextServiceLabel}>NASTĘPNY SERWIS</Text>
                  <Text style={styles.nextServiceDate}>
                    {formatPolishDate(nextService.nextServiceDate)}
                  </Text>
                  <Text style={styles.nextServiceText}>
                    {serviceTypeLabels[nextService.type]}
                    {nextService.contractorName ? ` · ${nextService.contractorName}` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Dodaj wpis serwisowy</Text>

                <Text style={styles.label}>Rodzaj</Text>
                <View style={styles.typeGrid}>
                  {serviceTypeOptions.map((option) => {
                    const selected = serviceType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setServiceType(option.value)}
                        style={({ pressed }) => [
                          styles.typeButton,
                          selected && styles.typeButtonSelected,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text>{option.icon}</Text>
                        <Text
                          style={[styles.typeButtonText, selected && styles.typeButtonTextSelected]}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Field
                  label="Data *"
                  value={serviceDate}
                  onChangeText={setServiceDate}
                  placeholder="RRRR-MM-DD"
                />
                <Field
                  label="Opis"
                  value={serviceDescription}
                  onChangeText={setServiceDescription}
                  placeholder="np. przegląd roczny i czyszczenie"
                  multiline
                />
                <Field
                  label="Wykonawca"
                  value={serviceContractor}
                  onChangeText={setServiceContractor}
                  placeholder="np. Instal-Pro"
                />
                <Field
                  label="Koszt"
                  value={serviceCost}
                  onChangeText={setServiceCost}
                  placeholder="np. 450,00"
                  suffix="zł"
                />
                <Field
                  label="Następny serwis"
                  value={nextServiceDate}
                  onChangeText={setNextServiceDate}
                  placeholder="RRRR-MM-DD"
                />

                <Pressable
                  disabled={isSavingService}
                  onPress={() => void handleAddService()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                    isSavingService && styles.disabled,
                  ]}
                >
                  {isSavingService ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Dodaj do historii</Text>
                  )}
                </Pressable>
              </View>

              <View style={styles.card}>
                <View style={styles.historyHeader}>
                  <Text style={styles.sectionTitleNoMargin}>Historia serwisowa</Text>
                  <Text style={styles.historyCount}>{serviceRecords.length}</Text>
                </View>

                {serviceRecords.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🧰</Text>
                    <Text style={styles.emptyTitle}>Brak historii</Text>
                    <Text style={styles.muted}>Dodaj pierwszy przegląd, naprawę lub montaż.</Text>
                  </View>
                ) : (
                  <View style={styles.historyList}>
                    {serviceRecords.map((record) => (
                      <View key={record.id} style={styles.historyItem}>
                        <View style={styles.historyTopRow}>
                          <View>
                            <Text style={styles.historyType}>{serviceTypeLabels[record.type]}</Text>
                            <Text style={styles.historyDate}>
                              {formatPolishDate(record.serviceDate)}
                            </Text>
                          </View>

                          <Pressable
                            disabled={deletingServiceId === record.id}
                            onPress={() => confirmRemoveService(record)}
                            style={({ pressed }) => [pressed && styles.pressed]}
                          >
                            {deletingServiceId === record.id ? (
                              <ActivityIndicator size="small" />
                            ) : (
                              <Text style={styles.deleteText}>Usuń</Text>
                            )}
                          </Pressable>
                        </View>

                        {!!record.description && (
                          <Text style={styles.historyDescription}>{record.description}</Text>
                        )}

                        <View style={styles.metaRows}>
                          {!!record.contractorName && (
                            <Text style={styles.metaText}>👤 {record.contractorName}</Text>
                          )}

                          {record.costCents !== null && record.costCents !== undefined && (
                            <Text style={styles.metaText}>💰 {formatMoney(record.costCents)}</Text>
                          )}

                          {!!record.nextServiceDate && (
                            <Text style={styles.metaText}>
                              📅 Następny: {formatPolishDate(record.nextServiceDate)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  suffix,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          multiline={multiline}
          style={[styles.input, multiline && styles.textArea]}
        />
        {!!suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

function formatApiDate(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function isValidOptionalDate(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function toApiDate(value: string) {
  const normalized = value.trim();
  return normalized ? `${normalized}T00:00:00.000Z` : null;
}

function parseMoneyToCents(value: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;

  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100);
}

function formatMoney(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')} zł`;
}

function formatPolishDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat('pl-PL').format(date);
}

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { padding: 20, paddingBottom: 70 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { marginTop: 7, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  errorText: { marginBottom: 14, color: '#B91C1C' },

  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { fontSize: 28 },
  heroText: { flex: 1, marginLeft: 14 },
  title: { fontSize: 23, fontWeight: '700', color: '#111827' },
  subtitle: { marginTop: 4, color: '#6B7280', lineHeight: 19 },

  card: {
    marginBottom: 18,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: {
    marginTop: 5,
    marginBottom: 16,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  sectionTitleNoMargin: { fontSize: 17, fontWeight: '700', color: '#111827' },
  field: { marginBottom: 16 },
  label: { marginBottom: 7, fontSize: 14, fontWeight: '600', color: '#374151' },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    color: '#111827',
    fontSize: 16,
  },
  textArea: { minHeight: 95, paddingTop: 12, textAlignVertical: 'top' },
  suffix: { marginLeft: 10, color: '#6B7280', fontWeight: '600' },

  primaryButton: {
    minHeight: 52,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 17 },
  typeButton: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeButtonSelected: { borderColor: '#111827', backgroundColor: '#111827' },
  typeButtonText: { color: '#374151', fontSize: 12, fontWeight: '600' },
  typeButtonTextSelected: { color: '#FFFFFF' },

  nextServiceCard: {
    marginBottom: 18,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  nextServiceLabel: { color: '#92400E', fontSize: 11, fontWeight: '800' },
  nextServiceDate: { marginTop: 6, color: '#78350F', fontSize: 23, fontWeight: '700' },
  nextServiceText: { marginTop: 5, color: '#92400E' },

  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  historyCount: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    textAlign: 'center',
    color: '#4B5563',
    fontWeight: '700',
  },
  historyList: { gap: 11 },
  historyItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    backgroundColor: '#FAFAFA',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyType: { color: '#111827', fontSize: 15, fontWeight: '700' },
  historyDate: { marginTop: 3, color: '#6B7280', fontSize: 12 },
  historyDescription: { marginTop: 10, color: '#374151', lineHeight: 20 },
  metaRows: { marginTop: 10, gap: 4 },
  metaText: { color: '#6B7280', fontSize: 12 },
  deleteText: { color: '#B91C1C', fontSize: 12, fontWeight: '600' },

  emptyBox: { paddingVertical: 25, alignItems: 'center' },
  emptyIcon: { fontSize: 31 },
  emptyTitle: { marginTop: 8, fontWeight: '700', color: '#111827' },

  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
});
