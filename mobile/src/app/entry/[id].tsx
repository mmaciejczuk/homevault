import * as ImagePicker from 'expo-image-picker';

import {
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
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

type EntryCategory =
  | 'ELECTRICAL'
  | 'PLUMBING'
  | 'HEATING'
  | 'WALL'
  | 'FLOOR'
  | 'DEVICE'
  | 'NOTE'
  | 'OTHER';

interface Entry {
  id: number;
  title: string;
  description?: string;
  category: EntryCategory;
  roomId: number;
  createdAt: string;
  updatedAt: string;
}

interface Room {
  id: number;
  name: string;
  floor?: string;
  description?: string;
  propertyId: number;
}

interface Attachment {
  id: number;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  kind: 'IMAGE' | 'DOCUMENT';
  entryId: number;
  createdAt: string;
  url: string;
}

const categoryLabels: Record<EntryCategory, string> = {
  ELECTRICAL: 'Elektryka',
  PLUMBING: 'Hydraulika',
  HEATING: 'Ogrzewanie',
  WALL: 'Ściany',
  FLOOR: 'Podłoga',
  DEVICE: 'Urządzenie',
  NOTE: 'Notatka',
  OTHER: 'Inne',
};

const categoryIcons: Record<EntryCategory, string> = {
  ELECTRICAL: '⚡',
  PLUMBING: '💧',
  HEATING: '🔥',
  WALL: '🧱',
  FLOOR: '🪵',
  DEVICE: '🔧',
  NOTE: '📝',
  OTHER: '📌',
};

export default function EntryDetailsScreen() {
  const { id } =
    useLocalSearchParams<{ id: string }>();

  const [entry, setEntry] =
    useState<Entry | null>(null);

  const [room, setRoom] =
    useState<Room | null>(null);

  const [attachments, setAttachments] =
    useState<Attachment[]>([]);

  const [
    selectedAttachment,
    setSelectedAttachment,
  ] = useState<Attachment | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isUploading, setIsUploading] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const entryResponse = await fetch(
        `${API_URL}/entries/${id}`,
      );

      if (!entryResponse.ok) {
        throw new Error(
          `Entry API zwróciło status ${entryResponse.status}`,
        );
      }

      const entryData: Entry =
        await entryResponse.json();

      const [
        roomResponse,
        attachmentsResponse,
      ] = await Promise.all([
        fetch(
          `${API_URL}/rooms/${entryData.roomId}`,
        ),

        fetch(
          `${API_URL}/entries/${entryData.id}/attachments`,
        ),
      ]);

      if (!roomResponse.ok) {
        throw new Error(
          `Room API zwróciło status ${roomResponse.status}`,
        );
      }

      if (!attachmentsResponse.ok) {
        throw new Error(
          `Attachments API zwróciło status ${attachmentsResponse.status}`,
        );
      }

      const roomData: Room =
        await roomResponse.json();

      const attachmentsData: Attachment[] =
        await attachmentsResponse.json();

      setEntry(entryData);
      setRoom(roomData);
      setAttachments(attachmentsData);
    } catch (err) {
      console.error(
        'Błąd pobierania wpisu:',
        err,
      );

      setError(
        'Nie udało się pobrać danych wpisu.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const uploadImage = async (
    asset: ImagePicker.ImagePickerAsset,
  ) => {
    if (!id) {
      return;
    }

    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (!asset.file) {
        throw new Error(
          'Brak obiektu File dla wybranego zdjęcia.',
        );
      }

      formData.append(
        'file',
        asset.file,
        asset.fileName ??
          asset.file.name ??
          `photo-${Date.now()}.jpg`,
      );
    } else {
      formData.append(
        'file',
        {
          uri: asset.uri,
          name:
            asset.fileName ??
            `photo-${Date.now()}.jpg`,
          type:
            asset.mimeType ??
            'image/jpeg',
        } as any,
      );
    }

    const response = await fetch(
      `${API_URL}/entries/${id}/attachments`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      const responseBody =
        await response.text();

      throw new Error(
        `Upload zwrócił ${response.status}: ${responseBody}`,
      );
    }

    return response.json();
  };

  const uploadPickedAsset = async (
    asset: ImagePicker.ImagePickerAsset,
  ) => {
    try {
      setIsUploading(true);

      await uploadImage(asset);

      await loadData();
    } catch (err) {
      console.error(
        'Błąd wysyłania zdjęcia:',
        err,
      );

      showMessage(
        'Nie udało się wysłać zdjęcia.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        });

      if (
        result.canceled ||
        !result.assets.length
      ) {
        return;
      }

      await uploadPickedAsset(
        result.assets[0],
      );
    } catch (err) {
      console.error(
        'Błąd wyboru zdjęcia:',
        err,
      );

      showMessage(
        'Nie udało się wybrać zdjęcia.',
      );
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          Alert.alert(
            'Brak dostępu do aparatu',
            'HomeVault potrzebuje dostępu do aparatu, aby wykonać zdjęcie.',
          );

          return;
        }
      }

      const result =
        await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: false,
          quality: 0.85,
        });

      if (
        result.canceled ||
        !result.assets.length
      ) {
        return;
      }

      await uploadPickedAsset(
        result.assets[0],
      );
    } catch (err) {
      console.error(
        'Błąd aparatu:',
        err,
      );

      showMessage(
        'Nie udało się wykonać zdjęcia.',
      );
    }
  };

  const askDeleteConfirmation =
    async (): Promise<boolean> => {
      if (Platform.OS === 'web') {
        return window.confirm(
          'Czy na pewno chcesz usunąć to zdjęcie?',
        );
      }

      return new Promise((resolve) => {
        Alert.alert(
          'Usuń zdjęcie',
          'Czy na pewno chcesz usunąć to zdjęcie?',
          [
            {
              text: 'Anuluj',
              style: 'cancel',
              onPress: () =>
                resolve(false),
            },
            {
              text: 'Usuń',
              style: 'destructive',
              onPress: () =>
                resolve(true),
            },
          ],
          {
            cancelable: true,
            onDismiss: () =>
              resolve(false),
          },
        );
      });
    };

  const handleDeleteAttachment =
    async () => {
      if (!selectedAttachment) {
        return;
      }

      const confirmed =
        await askDeleteConfirmation();

      if (!confirmed) {
        return;
      }

      try {
        setIsDeleting(true);

        const response = await fetch(
          `${API_URL}/attachments/${selectedAttachment.id}`,
          {
            method: 'DELETE',
          },
        );

        if (!response.ok) {
          const responseBody =
            await response.text();

          throw new Error(
            `DELETE zwrócił ${response.status}: ${responseBody}`,
          );
        }

        setSelectedAttachment(null);

        await loadData();
      } catch (err) {
        console.error(
          'Błąd usuwania zdjęcia:',
          err,
        );

        showMessage(
          'Nie udało się usunąć zdjęcia.',
        );
      } finally {
        setIsDeleting(false);
      }
    };

  const showMessage = (
    message: string,
  ) => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert(
        'HomeVault',
        message,
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.infoText}>
            Pobieranie wpisu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !entry
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            Wystąpił błąd
          </Text>

          <Text style={styles.infoText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadData}
          >
            <Text
              style={styles.retryButtonText}
            >
              Spróbuj ponownie
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.categoryRow}>
          <View
            style={styles.categoryIconBox}
          >
            <Text
              style={styles.categoryIcon}
            >
              {categoryIcons[entry.category]}
            </Text>
          </View>

          <View>
            <Text
              style={styles.categoryLabel}
            >
              {categoryLabels[entry.category]}
            </Text>

            {room && (
              <Text style={styles.roomName}>
                🚪 {room.name}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>
          {entry.title}
        </Text>

        {entry.description && (
          <Text style={styles.description}>
            {entry.description}
          </Text>
        )}

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Zdjęcia
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              {attachments.length === 1
                ? '1 zdjęcie'
                : `${attachments.length} zdjęć`}
            </Text>
          </View>
        </View>

        <View style={styles.photoActions}>
          {Platform.OS !== 'web' && (
            <Pressable
              disabled={isUploading}
              onPress={handleTakePhoto}
              style={({ pressed }) => [
                styles.cameraButton,
                pressed && styles.pressed,
                isUploading &&
                  styles.disabled,
              ]}
            >
              <Text
                style={
                  styles.cameraButtonText
                }
              >
                📷 Zrób zdjęcie
              </Text>
            </Pressable>
          )}

          <Pressable
            disabled={isUploading}
            onPress={handlePickImage}
            style={({ pressed }) => [
              styles.galleryButton,
              pressed && styles.pressed,
              isUploading &&
                styles.disabled,
            ]}
          >
            <Text
              style={
                styles.galleryButtonText
              }
            >
              🖼️ Wybierz z galerii
            </Text>
          </Pressable>
        </View>

        {isUploading && (
          <View style={styles.uploadStatus}>
            <ActivityIndicator />

            <Text
              style={styles.uploadStatusText}
            >
              Wysyłanie zdjęcia...
            </Text>
          </View>
        )}

        {attachments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              📷
            </Text>

            <Text style={styles.emptyTitle}>
              Brak zdjęć
            </Text>

            <Text style={styles.infoText}>
              Zrób zdjęcie instalacji,
              urządzenia albo wykonanych prac
              lub wybierz istniejące zdjęcie.
            </Text>
          </View>
        ) : (
          <View style={styles.gallery}>
            {attachments.map(
              (attachment) => (
                <Pressable
                  key={attachment.id}
                  onPress={() =>
                    setSelectedAttachment(
                      attachment,
                    )
                  }
                  style={({ pressed }) => [
                    styles.imageCard,
                    pressed &&
                      styles.pressed,
                  ]}
                >
                  <Image
                    source={{
                      uri: attachment.url,
                    }}
                    style={styles.image}
                    resizeMode="cover"
                  />

                  <View
                    style={styles.imageInfo}
                  >
                    <Text
                      style={styles.fileName}
                      numberOfLines={1}
                    >
                      {attachment.fileName}
                    </Text>

                    <Text
                      style={styles.fileSize}
                    >
                      {formatFileSize(
                        attachment.size,
                      )}
                    </Text>
                  </View>
                </Pressable>
              ),
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={
          selectedAttachment !== null
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectedAttachment(null)
        }
      >
        <View
          style={styles.modalBackdrop}
        >
          <View
            style={styles.modalContainer}
          >
            <View
              style={styles.modalHeader}
            >
              <View
                style={
                  styles.modalHeaderText
                }
              >
                <Text
                  style={
                    styles.modalFileName
                  }
                  numberOfLines={1}
                >
                  {
                    selectedAttachment?.fileName
                  }
                </Text>

                {selectedAttachment && (
                  <Text
                    style={
                      styles.modalFileSize
                    }
                  >
                    {formatFileSize(
                      selectedAttachment.size,
                    )}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={() =>
                  setSelectedAttachment(
                    null,
                  )
                }
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.closeButtonText
                  }
                >
                  ✕
                </Text>
              </Pressable>
            </View>

            {selectedAttachment && (
              <Image
                source={{
                  uri:
                    selectedAttachment.url,
                }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}

            <View
              style={styles.modalActions}
            >
              <Pressable
                disabled={isDeleting}
                onPress={() =>
                  setSelectedAttachment(
                    null,
                  )
                }
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text
                  style={
                    styles.cancelButtonText
                  }
                >
                  Zamknij
                </Text>
              </Pressable>

              <Pressable
                disabled={isDeleting}
                onPress={
                  handleDeleteAttachment
                }
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed &&
                    styles.pressed,
                  isDeleting &&
                    styles.disabled,
                ]}
              >
                {isDeleting ? (
                  <View
                    style={
                      styles.uploadingRow
                    }
                  >
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.deleteButtonText
                      }
                    >
                      Usuwanie...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.deleteButtonText
                    }
                  >
                    🗑 Usuń zdjęcie
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  const megabytes =
    kilobytes / 1024;

  return `${megabytes.toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  content: {
    padding: 24,
    paddingBottom: 60,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  categoryIconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  categoryIcon: {
    fontSize: 30,
  },

  categoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
  },

  roomName: {
    marginTop: 5,
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    marginTop: 24,
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
  },

  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },

  divider: {
    marginTop: 30,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  sectionHeader: {
    marginTop: 30,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#9CA3AF',
  },

  photoActions: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  cameraButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  galleryButton: {
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  galleryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },

  uploadStatus: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  uploadStatusText: {
    color: '#6B7280',
    fontSize: 14,
  },

  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  emptyState: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 54,
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: '600',
    color: '#111827',
  },

  infoText: {
    marginTop: 8,
    maxWidth: 350,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 21,
  },

  gallery: {
    marginTop: 22,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  imageCard: {
    width: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },

  imageInfo: {
    padding: 11,
  },

  fileName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },

  fileSize: {
    marginTop: 3,
    fontSize: 11,
    color: '#9CA3AF',
  },

  errorTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#B91C1C',
  },

  retryButton: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#111827',
  },

  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.55,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 1000,
    maxHeight: '95%',
    backgroundColor: '#111827',
    borderRadius: 18,
    overflow: 'hidden',
  },

  modalHeader: {
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },

  modalHeaderText: {
    flex: 1,
    marginRight: 16,
  },

  modalFileName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  modalFileSize: {
    marginTop: 3,
    color: '#9CA3AF',
    fontSize: 12,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },

  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  fullImage: {
    width: '100%',
    height: 600,
    backgroundColor: '#000000',
  },

  modalActions: {
    minHeight: 76,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },

  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#374151',
  },

  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  deleteButton: {
    minWidth: 150,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },

  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});