import * as ImagePicker from 'expo-image-picker';

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
  Alert,
  Image,
  Modal,
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
  File,
} from 'expo-file-system';

import {
  fetch as expoFetch,
} from 'expo/fetch';

import {
  apiFetch,
} from '../../lib/api';

import {
  supabase,
} from '../../lib/supabase';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://homevault-production.up.railway.app';

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
  description?: string | null;
  category: EntryCategory;
  roomId: number;
  createdAt: string;
  updatedAt: string;
}

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

interface Attachment {
  id: number;
  fileName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  kind:
    | 'IMAGE'
    | 'DOCUMENT';
  entryId: number;
  createdAt: string;
  url: string;
}

const categoryLabels:
  Record<
    EntryCategory,
    string
  > = {
    ELECTRICAL:
      'Elektryka',

    PLUMBING:
      'Hydraulika',

    HEATING:
      'Ogrzewanie',

    WALL:
      'Ściany',

    FLOOR:
      'Podłoga',

    DEVICE:
      'Urządzenie',

    NOTE:
      'Notatka',

    OTHER:
      'Inne',
  };

const categoryIcons:
  Record<
    EntryCategory,
    string
  > = {
    ELECTRICAL: '⚡',
    PLUMBING: '💧',
    HEATING: '🔥',
    WALL: '🧱',
    FLOOR: '🪵',
    DEVICE: '🔧',
    NOTE: '📝',
    OTHER: '📌',
  };

function formatFileSize(
  bytes: number,
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb =
    bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(
      1,
    )} KB`;
  }

  const mb =
    kb / 1024;

  return `${mb.toFixed(
    1,
  )} MB`;
}

export default function EntryDetailsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [
    entry,
    setEntry,
  ] =
    useState<Entry | null>(
      null,
    );

  const [
    room,
    setRoom,
  ] =
    useState<Room | null>(
      null,
    );

  const [
    attachments,
    setAttachments,
  ] =
    useState<
      Attachment[]
    >([]);

  const [
    selectedAttachment,
    setSelectedAttachment,
  ] =
    useState<
      Attachment | null
    >(null);

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isUploading,
    setIsUploading,
  ] =
    useState(false);

  const [
    isDeletingAttachment,
    setIsDeletingAttachment,
  ] =
    useState(false);

  const [
    isDeletingEntry,
    setIsDeletingEntry,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const showMessage =
    (
      message: string,
    ) => {
      if (
        Platform.OS ===
        'web'
      ) {
        window.alert(
          message,
        );

        return;
      }

      Alert.alert(
        'HomeVault',
        message,
      );
    };

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

          const entryResponse =
            await apiFetch(
              `/entries/${id}`,
            );

          if (
            !entryResponse.ok
          ) {
            const body =
              await entryResponse.text();

            throw new Error(
              `Entry API ${entryResponse.status}: ${body}`,
            );
          }

          const entryData:
            Entry =
            await entryResponse.json();

          const [
            roomResponse,
            attachmentsResponse,
          ] =
            await Promise.all([
              apiFetch(
                `/rooms/${entryData.roomId}`,
              ),

              apiFetch(
                `/entries/${entryData.id}/attachments`,
              ),
            ]);

          if (
            !roomResponse.ok
          ) {
            const body =
              await roomResponse.text();

            throw new Error(
              `Room API ${roomResponse.status}: ${body}`,
            );
          }

          if (
            !attachmentsResponse.ok
          ) {
            const body =
              await attachmentsResponse.text();

            throw new Error(
              `Attachments API ${attachmentsResponse.status}: ${body}`,
            );
          }

          const roomData:
            Room =
            await roomResponse.json();

          const attachmentsData:
            Attachment[] =
            await attachmentsResponse.json();

          setEntry(
            entryData,
          );

          setRoom(
            roomData,
          );

          setAttachments(
            attachmentsData,
          );
        } catch (err) {
          console.error(
            'Błąd pobierania wpisu:',
            err,
          );

          setError(
            'Nie udało się pobrać danych wpisu.',
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

  const handleEditEntry =
    () => {
      if (!id) {
        return;
      }

      router.push({
        pathname:
          '/entry/[id]/edit',

        params: {
          id,
        },
      });
    };

  const askDeleteEntry =
    async () => {
      if (
        Platform.OS ===
        'web'
      ) {
        return window.confirm(
          'Usunąć ten wpis wraz ze wszystkimi zdjęciami?',
        );
      }

      return new Promise<boolean>(
        (
          resolve,
        ) => {
          Alert.alert(
            'Usuń wpis',

            'Usunięty zostanie również cały zestaw zdjęć przypisanych do wpisu.',

            [
              {
                text:
                  'Anuluj',

                style:
                  'cancel',

                onPress:
                  () =>
                    resolve(
                      false,
                    ),
              },

              {
                text:
                  'Usuń',

                style:
                  'destructive',

                onPress:
                  () =>
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

  const handleDeleteEntry =
    async () => {
      if (
        !id ||
        !entry
      ) {
        return;
      }

      const confirmed =
        await askDeleteEntry();

      if (!confirmed) {
        return;
      }

      try {
        setIsDeletingEntry(
          true,
        );

        const response =
          await apiFetch(
            `/entries/${id}`,
            {
              method:
                'DELETE',
            },
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `DELETE ${response.status}: ${body}`,
          );
        }

        router.replace({
          pathname:
            '/room/[id]',

          params: {
            id:
              entry.roomId.toString(),
          },
        });
      } catch (err) {
        console.error(
          'Błąd usuwania wpisu:',
          err,
        );

        showMessage(
          'Nie udało się usunąć wpisu.',
        );
      } finally {
        setIsDeletingEntry(
          false,
        );
      }
    };

  const uploadImage =
    async (
      asset:
        ImagePicker.ImagePickerAsset,
    ) => {
      if (!id) {
        return;
      }

      /*
       * WEB
       */
      if (
        Platform.OS ===
        'web'
      ) {
        if (!asset.file) {
          throw new Error(
            'Brak obiektu File dla wybranego zdjęcia.',
          );
        }

        const formData =
          new FormData();

        formData.append(
          'file',

          asset.file,

          asset.fileName ??
            asset.file.name ??
            `photo-${Date.now()}.jpg`,
        );

        const response =
          await apiFetch(
            `/entries/${id}/attachments`,
            {
              method:
                'POST',

              body:
                formData,
            },
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `Upload ${response.status}: ${body}`,
          );
        }

        return response.json();
      }

      /*
       * ANDROID / IOS
       *
       * Zachowujemy działający
       * wariant:
       *
       * expo-file-system File
       * +
       * expo/fetch
       */
      const {
        data: {
          session,
        },

        error:
          sessionError,
      } =
        await supabase.auth
          .getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (
        !session
          ?.access_token
      ) {
        throw new Error(
          'Brak aktywnej sesji użytkownika.',
        );
      }

      const file =
        new File(
          asset.uri,
        );

      const formData =
        new FormData();

      console.log(
        'UPLOAD FILE',
        {
          uri:
            file.uri,

          name:
            file.name,

          type:
            file.type,

          size:
            file.size,
        },
      );

      formData.append(
        'file',
        file,
      );

      const response =
        await expoFetch(
          `${API_URL}/entries/${id}/attachments`,
          {
            method:
              'POST',

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },

            body:
              formData,
          },
        );

      console.log(
        'UPLOAD RESPONSE:',
        response.status,
      );

      if (!response.ok) {
        const body =
          await response.text();

        throw new Error(
          `Upload ${response.status}: ${body}`,
        );
      }

      return response.json();
    };

  const uploadPickedAsset =
    async (
      asset:
        ImagePicker.ImagePickerAsset,
    ) => {
      try {
        setIsUploading(
          true,
        );

        await uploadImage(
          asset,
        );

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
        setIsUploading(
          false,
        );
      }
    };

  const handlePickImage =
    async () => {
      try {
        const result =
          await ImagePicker
            .launchImageLibraryAsync(
              {
                mediaTypes: [
                  'images',
                ],

                allowsEditing:
                  false,

                quality:
                  0.85,
              },
            );

        if (
          result.canceled ||
          !result.assets
            .length
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

  const handleTakePhoto =
    async () => {
      try {
        if (
          Platform.OS !==
          'web'
        ) {
          const permission =
            await ImagePicker
              .requestCameraPermissionsAsync();

          if (
            !permission.granted
          ) {
            Alert.alert(
              'Brak dostępu do aparatu',

              'HomeVault potrzebuje dostępu do aparatu, aby wykonać zdjęcie.',
            );

            return;
          }
        }

        const result =
          await ImagePicker
            .launchCameraAsync(
              {
                mediaTypes: [
                  'images',
                ],

                allowsEditing:
                  false,

                quality:
                  0.85,
              },
            );

        if (
          result.canceled ||
          !result.assets
            .length
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

  const askDeleteAttachment =
    async () => {
      if (
        Platform.OS ===
        'web'
      ) {
        return window.confirm(
          'Czy na pewno chcesz usunąć to zdjęcie?',
        );
      }

      return new Promise<boolean>(
        (
          resolve,
        ) => {
          Alert.alert(
            'Usuń zdjęcie',

            'Czy na pewno chcesz usunąć to zdjęcie?',

            [
              {
                text:
                  'Anuluj',

                style:
                  'cancel',

                onPress:
                  () =>
                    resolve(
                      false,
                    ),
              },

              {
                text:
                  'Usuń',

                style:
                  'destructive',

                onPress:
                  () =>
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

  const handleDeleteAttachment =
    async () => {
      if (
        !selectedAttachment
      ) {
        return;
      }

      const confirmed =
        await askDeleteAttachment();

      if (!confirmed) {
        return;
      }

      try {
        setIsDeletingAttachment(
          true,
        );

        const response =
          await apiFetch(
            `/attachments/${selectedAttachment.id}`,
            {
              method:
                'DELETE',
            },
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `DELETE ${response.status}: ${body}`,
          );
        }

        setSelectedAttachment(
          null,
        );

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
        setIsDeletingAttachment(
          false,
        );
      }
    };

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Wpis',
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
              Pobieranie wpisu...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (
    error ||
    !entry
  ) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              'Wpis',
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
              style={
                styles.retryButton
              }
              onPress={
                loadData
              }
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
        </SafeAreaView>
      </>
    );
  }

  const breadcrumbTitle =
    room?.property?.name
      ? `${room.property.name} › ${room.name} › ${entry.title}`
      : room
        ? `${room.name} › ${entry.title}`
        : entry.title;

  return (
    <>
      <Stack.Screen
        options={{
          title:
            breadcrumbTitle,
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
              styles.categoryRow
            }
          >
            <View
              style={
                styles.categoryIconBox
              }
            >
              <Text
                style={
                  styles.categoryIcon
                }
              >
                {
                  categoryIcons[
                    entry.category
                  ]
                }
              </Text>
            </View>

            <View
              style={
                styles.categoryContent
              }
            >
              <Text
                style={
                  styles.categoryLabel
                }
              >
                {
                  categoryLabels[
                    entry.category
                  ]
                }
              </Text>

              {room && (
                <Text
                  style={
                    styles.roomName
                  }
                >
                  🚪{' '}
                  {room.name}
                </Text>
              )}
            </View>
          </View>

          <Text
            style={
              styles.title
            }
          >
            {entry.title}
          </Text>

          {entry.description && (
            <Text
              style={
                styles.description
              }
            >
              {
                entry.description
              }
            </Text>
          )}

          <View
            style={
              styles.entryActions
            }
          >
            <Pressable
              disabled={
                isDeletingEntry
              }
              onPress={
                handleEditEntry
              }
              style={
                styles.editButton
              }
            >
              <Text
                style={
                  styles.editButtonText
                }
              >
                ✏️ Edytuj
              </Text>
            </Pressable>

            <Pressable
              disabled={
                isDeletingEntry
              }
              onPress={
                handleDeleteEntry
              }
              style={
                styles.deleteEntryButton
              }
            >
              <Text
                style={
                  styles.deleteEntryButtonText
                }
              >
                {isDeletingEntry
                  ? 'Usuwanie...'
                  : '🗑 Usuń'}
              </Text>
            </Pressable>
          </View>

          <View
            style={
              styles.divider
            }
          />

          <View
            style={
              styles.sectionHeader
            }
          >
            <View>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Zdjęcia
              </Text>

              <Text
                style={
                  styles.sectionSubtitle
                }
              >
                {attachments.length ===
                1
                  ? '1 zdjęcie'
                  : `${attachments.length} zdjęć`}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.photoActions
            }
          >
            {Platform.OS !==
              'web' && (
              <Pressable
                disabled={
                  isUploading
                }
                onPress={
                  handleTakePhoto
                }
                style={({
                  pressed,
                }) => [
                  styles.cameraButton,

                  pressed &&
                    styles.pressed,

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
              disabled={
                isUploading
              }
              onPress={
                handlePickImage
              }
              style={({
                pressed,
              }) => [
                styles.galleryButton,

                pressed &&
                  styles.pressed,

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
            <View
              style={
                styles.uploadStatus
              }
            >
              <ActivityIndicator />

              <Text
                style={
                  styles.uploadStatusText
                }
              >
                Wysyłanie zdjęcia...
              </Text>
            </View>
          )}

          {attachments.length ===
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
                📷
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Brak zdjęć
              </Text>

              <Text
                style={
                  styles.infoText
                }
              >
                Zrób zdjęcie instalacji,
                urządzenia albo
                wykonanych prac lub
                wybierz istniejące
                zdjęcie.
              </Text>
            </View>
          ) : (
            <View
              style={
                styles.gallery
              }
            >
              {attachments.map(
                (
                  attachment,
                ) => (
                  <Pressable
                    key={
                      attachment.id
                    }
                    onPress={() =>
                      setSelectedAttachment(
                        attachment,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.imageCard,

                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Image
                      source={{
                        uri:
                          attachment.url,
                      }}
                      style={
                        styles.image
                      }
                      resizeMode="cover"
                    />

                    <View
                      style={
                        styles.imageInfo
                      }
                    >
                      <Text
                        style={
                          styles.fileName
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          attachment.fileName
                        }
                      </Text>

                      <Text
                        style={
                          styles.fileSize
                        }
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
            selectedAttachment !==
            null
          }
          transparent
          animationType="fade"
          onRequestClose={() =>
            setSelectedAttachment(
              null,
            )
          }
        >
          <View
            style={
              styles.modalBackdrop
            }
          >
            <View
              style={
                styles.modalContainer
              }
            >
              <View
                style={
                  styles.modalHeader
                }
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
                    numberOfLines={
                      1
                    }
                  >
                    {
                      selectedAttachment
                        ?.fileName
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
                  style={
                    styles.closeButton
                  }
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
                  style={
                    styles.fullImage
                  }
                  resizeMode="contain"
                />
              )}

              <View
                style={
                  styles.modalActions
                }
              >
                <Pressable
                  disabled={
                    isDeletingAttachment
                  }
                  onPress={() =>
                    setSelectedAttachment(
                      null,
                    )
                  }
                  style={
                    styles.modalCancelButton
                  }
                >
                  <Text
                    style={
                      styles.modalCancelButtonText
                    }
                  >
                    Zamknij
                  </Text>
                </Pressable>

                <Pressable
                  disabled={
                    isDeletingAttachment
                  }
                  onPress={
                    handleDeleteAttachment
                  }
                  style={[
                    styles.modalDeleteButton,

                    isDeletingAttachment &&
                      styles.disabled,
                  ]}
                >
                  {isDeletingAttachment ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.modalDeleteButtonText
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

    categoryRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    categoryIconBox: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    categoryIcon: {
      fontSize: 29,
    },

    categoryContent: {
      flex: 1,
      marginLeft: 14,
    },

    categoryLabel: {
      fontSize: 14,
      fontWeight:
        '600',
      color: '#6B7280',
      textTransform:
        'uppercase',
    },

    roomName: {
      marginTop: 4,
      fontSize: 14,
      color: '#9CA3AF',
    },

    title: {
      marginTop: 22,
      fontSize: 30,
      fontWeight:
        '700',
      color: '#111827',
    },

    description: {
      marginTop: 10,
      fontSize: 16,
      lineHeight: 24,
      color: '#6B7280',
    },

    entryActions: {
      marginTop: 22,
      flexDirection:
        'row',
      gap: 12,
    },

    editButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
    },

    editButtonText: {
      color: '#111827',
      fontWeight:
        '600',
    },

    deleteEntryButton: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor:
        '#FEE2E2',
    },

    deleteEntryButtonText: {
      color: '#B91C1C',
      fontWeight:
        '600',
    },

    divider: {
      marginVertical: 30,
      height: 1,
      backgroundColor:
        '#E5E7EB',
    },

    sectionHeader: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    sectionTitle: {
      fontSize: 22,
      fontWeight:
        '700',
      color: '#111827',
    },

    sectionSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: '#9CA3AF',
    },

    photoActions: {
      marginTop: 18,
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 12,
    },

    cameraButton: {
      minHeight: 46,
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 11,
      backgroundColor:
        '#111827',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    cameraButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight:
        '600',
    },

    galleryButton: {
      minHeight: 46,
      paddingHorizontal: 18,
      paddingVertical: 13,
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    galleryButtonText: {
      color: '#111827',
      fontSize: 14,
      fontWeight:
        '600',
    },

    uploadStatus: {
      marginTop: 16,
      flexDirection:
        'row',
      alignItems:
        'center',
      gap: 10,
    },

    uploadStatusText: {
      color: '#6B7280',
      fontSize: 14,
    },

    emptyState: {
      minHeight: 300,
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    emptyIcon: {
      fontSize: 54,
    },

    emptyTitle: {
      marginTop: 14,
      fontSize: 19,
      fontWeight:
        '600',
      color: '#111827',
    },

    infoText: {
      marginTop: 8,
      maxWidth: 350,
      textAlign:
        'center',
      color: '#6B7280',
      lineHeight: 21,
    },

    gallery: {
      marginTop: 22,
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 16,
    },

    imageCard: {
      width: 240,
      borderRadius: 16,
      overflow:
        'hidden',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
    },

    image: {
      width: '100%',
      height: 180,
      backgroundColor:
        '#E5E7EB',
    },

    imageInfo: {
      padding: 11,
    },

    fileName: {
      fontSize: 13,
      fontWeight:
        '500',
      color: '#374151',
    },

    fileSize: {
      marginTop: 3,
      fontSize: 11,
      color: '#9CA3AF',
    },

    errorTitle: {
      fontSize: 21,
      fontWeight:
        '700',
      color: '#B91C1C',
    },

    retryButton: {
      marginTop: 22,
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor:
        '#111827',
    },

    retryButtonText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
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
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 24,
    },

    modalContainer: {
      width: '100%',
      maxWidth: 1000,
      maxHeight: '95%',
      backgroundColor:
        '#111827',
      borderRadius: 18,
      overflow:
        'hidden',
    },

    modalHeader: {
      minHeight: 68,
      paddingHorizontal: 20,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    modalHeaderText: {
      flex: 1,
      marginRight: 20,
    },

    modalFileName: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '600',
    },

    modalFileSize: {
      marginTop: 4,
      color: '#9CA3AF',
      fontSize: 12,
    },

    closeButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        '#374151',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 19,
      fontWeight:
        '700',
    },

    fullImage: {
      width: '100%',
      height: 560,
      backgroundColor:
        '#000000',
    },

    modalActions: {
      padding: 18,
      flexDirection:
        'row',
      justifyContent:
        'flex-end',
      gap: 12,
    },

    modalCancelButton: {
      minHeight: 46,
      paddingHorizontal: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor:
        '#4B5563',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    modalCancelButtonText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
    },

    modalDeleteButton: {
      minHeight: 46,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor:
        '#DC2626',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    modalDeleteButtonText: {
      color: '#FFFFFF',
      fontWeight:
        '600',
    },
  });