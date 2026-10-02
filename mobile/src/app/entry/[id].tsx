import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import {
  router,
  Stack,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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

interface Room {
  id: number;
  name: string;
  floor?: string | null;
  description?: string | null;
  propertyId: number;
}

interface Property {
  id: number;
  name: string;
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
  Record<EntryCategory, string> = {
    ELECTRICAL: 'Elektryka',
    PLUMBING: 'Hydraulika',
    HEATING: 'Ogrzewanie',
    WALL: 'Ściany',
    FLOOR: 'Podłoga',
    DEVICE: 'Urządzenie',
    NOTE: 'Notatka',
    OTHER: 'Inne',
  };

const categoryIcons:
  Record<EntryCategory, string> = {
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
    property,
    setProperty,
  ] =
    useState<Property | null>(
      null,
    );

  const [
    attachments,
    setAttachments,
  ] =
    useState<Attachment[]>(
      [],
    );

  const [
    selectedAttachment,
    setSelectedAttachment,
  ] =
    useState<Attachment | null>(
      null,
    );

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
    isDeleting,
    setIsDeleting,
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
    useState<string | null>(
      null,
    );

  const images =
    useMemo(
      () =>
        attachments.filter(
          (attachment) =>
            attachment.kind ===
            'IMAGE',
        ),
      [attachments],
    );

  const documents =
    useMemo(
      () =>
        attachments.filter(
          (attachment) =>
            attachment.kind ===
            'DOCUMENT',
        ),
      [attachments],
    );

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
              `GET /entries/${id} zwróciło ${entryResponse.status}: ${body}`,
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
              `GET /rooms/${entryData.roomId} zwróciło ${roomResponse.status}: ${body}`,
            );
          }

          if (
            !attachmentsResponse.ok
          ) {
            const body =
              await attachmentsResponse.text();

            throw new Error(
              `GET attachments zwróciło ${attachmentsResponse.status}: ${body}`,
            );
          }

          const roomData:
            Room =
            await roomResponse.json();

          const attachmentsData:
            Attachment[] =
            await attachmentsResponse.json();

          let propertyData:
            Property | null =
            null;

          const propertyResponse =
            await apiFetch(
              `/properties/${roomData.propertyId}`,
            );

          if (
            propertyResponse.ok
          ) {
            propertyData =
              await propertyResponse.json();
          }

          setEntry(
            entryData,
          );

          setRoom(
            roomData,
          );

          setProperty(
            propertyData,
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

  const getAccessToken =
    async () => {
      const {
        data: {
          session,
        },
      } =
        await supabase.auth
          .getSession();

      if (!session) {
        throw new Error(
          'Brak aktywnej sesji.',
        );
      }

      return session.access_token;
    };

  const uploadNativeFile =
    async (
      uri: string,
    ) => {
      if (!id) {
        return;
      }

      const accessToken =
        await getAccessToken();

      const file =
        new File(
          uri,
        );

      const formData =
        new FormData();

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
                `Bearer ${accessToken}`,
            },

            body:
              formData,
          },
        );

      if (!response.ok) {
        const body =
          await response.text();

        throw new Error(
          `Upload zwrócił ${response.status}: ${body}`,
        );
      }

      return response.json();
    };

  const uploadWebFile =
    async (
      file: globalThis.File,
    ) => {
      if (!id) {
        return;
      }

      const formData =
        new FormData();

      formData.append(
        'file',
        file,
        file.name,
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
          `Upload zwrócił ${response.status}: ${body}`,
        );
      }

      return response.json();
    };

  const uploadImage =
    async (
      asset:
        ImagePicker.ImagePickerAsset,
    ) => {
      if (
        Platform.OS ===
        'web'
      ) {
        if (!asset.file) {
          throw new Error(
            'Brak obiektu File dla wybranego zdjęcia.',
          );
        }

        return uploadWebFile(
          asset.file,
        );
      }

      return uploadNativeFile(
        asset.uri,
      );
    };

  const handlePickImage =
    async () => {
      try {
        const result =
          await ImagePicker
            .launchImageLibraryAsync({
              mediaTypes: [
                'images',
              ],

              allowsEditing:
                false,

              quality:
                0.85,
            });

        if (
          result.canceled ||
          !result.assets.length
        ) {
          return;
        }

        setIsUploading(
          true,
        );

        await uploadImage(
          result.assets[0],
        );

        await loadData();
      } catch (err) {
        console.error(
          'Błąd wyboru zdjęcia:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się dodać zdjęcia.',
        );
      } finally {
        setIsUploading(
          false,
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
            showMessage(
              'Brak dostępu',
              'HomeVault potrzebuje dostępu do aparatu.',
            );

            return;
          }
        }

        const result =
          await ImagePicker
            .launchCameraAsync({
              mediaTypes: [
                'images',
              ],

              allowsEditing:
                false,

              quality:
                0.85,
            });

        if (
          result.canceled ||
          !result.assets.length
        ) {
          return;
        }

        setIsUploading(
          true,
        );

        await uploadImage(
          result.assets[0],
        );

        await loadData();
      } catch (err) {
        console.error(
          'Błąd aparatu:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się dodać zdjęcia.',
        );
      } finally {
        setIsUploading(
          false,
        );
      }
    };

  const handlePickDocument =
    async () => {
      try {
        const result =
          await DocumentPicker
            .getDocumentAsync({
              type:
                'application/pdf',

              multiple:
                false,

              copyToCacheDirectory:
                true,
            });

        if (
          result.canceled ||
          !result.assets.length
        ) {
          return;
        }

        const asset =
          result.assets[0];

        if (
          asset.size &&
          asset.size >
            10 *
              1024 *
              1024
        ) {
          showMessage(
            'Plik jest za duży',
            'Maksymalny rozmiar dokumentu to 10 MB.',
          );

          return;
        }

        setIsUploading(
          true,
        );

        if (
          Platform.OS ===
          'web'
        ) {
          if (
            !asset.file
          ) {
            throw new Error(
              'Brak obiektu File dla dokumentu.',
            );
          }

          await uploadWebFile(
            asset.file,
          );
        } else {
          await uploadNativeFile(
            asset.uri,
          );
        }

        await loadData();
      } catch (err) {
        console.error(
          'Błąd dodawania dokumentu:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się dodać dokumentu PDF.',
        );
      } finally {
        setIsUploading(
          false,
        );
      }
    };

  const handleOpenDocument =
    async (
      attachment:
        Attachment,
    ) => {
      try {
        const supported =
          await Linking
            .canOpenURL(
              attachment.url,
            );

        if (!supported) {
          throw new Error(
            'System nie może otworzyć tego dokumentu.',
          );
        }

        await Linking.openURL(
          attachment.url,
        );
      } catch (err) {
        console.error(
          'Błąd otwierania dokumentu:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się otworzyć dokumentu.',
        );
      }
    };

  const deleteAttachment =
    async (
      attachment:
        Attachment,
    ) => {
      try {
        setIsDeleting(
          true,
        );

        const response =
          await apiFetch(
            `/attachments/${attachment.id}`,
            {
              method:
                'DELETE',
            },
          );

        if (!response.ok) {
          const body =
            await response.text();

          throw new Error(
            `DELETE attachment zwróciło ${response.status}: ${body}`,
          );
        }

        setSelectedAttachment(
          null,
        );

        await loadData();
      } catch (err) {
        console.error(
          'Błąd usuwania załącznika:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się usunąć załącznika.',
        );
      } finally {
        setIsDeleting(
          false,
        );
      }
    };

  const confirmDeleteAttachment =
    (
      attachment:
        Attachment,
    ) => {
      const label =
        attachment.kind ===
        'IMAGE'
          ? 'zdjęcie'
          : 'dokument';

      if (
        Platform.OS ===
        'web'
      ) {
        const confirmed =
          window.confirm(
            `Usunąć ${label}?`,
          );

        if (confirmed) {
          void deleteAttachment(
            attachment,
          );
        }

        return;
      }

      Alert.alert(
        'Usuń załącznik',

        `Czy na pewno chcesz usunąć ${label}?`,

        [
          {
            text:
              'Anuluj',

            style:
              'cancel',
          },

          {
            text:
              'Usuń',

            style:
              'destructive',

            onPress:
              () =>
                void deleteAttachment(
                  attachment,
                ),
          },
        ],
      );
    };

  const handleEdit =
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

  const deleteEntry =
    async () => {
      if (
        !id ||
        !room
      ) {
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
            `DELETE /entries/${id} zwróciło ${response.status}: ${body}`,
          );
        }

        router.replace({
          pathname:
            '/room/[id]',

          params: {
            id:
              String(
                room.id,
              ),
          },
        });
      } catch (err) {
        console.error(
          'Błąd usuwania wpisu:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się usunąć wpisu.',
        );
      } finally {
        setIsDeletingEntry(
          false,
        );
      }
    };

  const handleDeleteEntry =
    () => {
      if (
        Platform.OS ===
        'web'
      ) {
        const confirmed =
          window.confirm(
            'Czy na pewno chcesz usunąć ten wpis wraz ze wszystkimi załącznikami?',
          );

        if (confirmed) {
          void deleteEntry();
        }

        return;
      }

      Alert.alert(
        'Usuń wpis',

        'Wpis i wszystkie jego załączniki zostaną trwale usunięte.',

        [
          {
            text:
              'Anuluj',

            style:
              'cancel',
          },

          {
            text:
              'Usuń',

            style:
              'destructive',

            onPress:
              () =>
                void deleteEntry(),
          },
        ],
      );
    };

  const headerTitle =
    entry
      ? property &&
        room
        ? `${property.name} › ${room.name} › ${entry.title}`
        : room
          ? `${room.name} › ${entry.title}`
          : entry.title
      : 'Wpis';

  if (isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            title:
              headerTitle,
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
                styles.loadingText
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
    !entry ||
    !room
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
              Nie udało się otworzyć wpisu
            </Text>

            <Text
              style={
                styles.errorText
              }
            >
              {error ??
                'Brak danych wpisu.'}
            </Text>
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
            headerTitle,
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
              styles.headerCard
            }
          >
            <View
              style={
                styles.categoryIconContainer
              }
            >
              <Text
                style={
                  styles.categoryIcon
                }
              >
                {categoryIcons[
                  entry.category
                ]}
              </Text>
            </View>

            <View
              style={
                styles.headerContent
              }
            >
              <Text
                style={
                  styles.category
                }
              >
                {categoryLabels[
                  entry.category
                ]}
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                {entry.title}
              </Text>

              {!!entry.description && (
                <Text
                  style={
                    styles.description
                  }
                >
                  {entry.description}
                </Text>
              )}
            </View>
          </View>

          <View
            style={
              styles.actionsRow
            }
          >
            <Pressable
              onPress={
                handleEdit
              }
              style={({
                pressed,
              }) => [
                styles.secondaryButton,

                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Edytuj
              </Text>
            </Pressable>

            <Pressable
              disabled={
                isDeletingEntry
              }
              onPress={
                handleDeleteEntry
              }
              style={({
                pressed,
              }) => [
                styles.deleteEntryButton,

                pressed &&
                  styles.pressed,
              ]}
            >
              {isDeletingEntry ? (
                <ActivityIndicator
                  size="small"
                />
              ) : (
                <Text
                  style={
                    styles.deleteEntryButtonText
                  }
                >
                  Usuń wpis
                </Text>
              )}
            </Pressable>
          </View>

          <View
            style={
              styles.section
            }
          >
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
                  {images.length ===
                  1
                    ? '1 zdjęcie'
                    : `${images.length} zdjęć`}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.uploadButtons
              }
            >
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
                  styles.uploadButton,

                  pressed &&
                    styles.pressed,

                  isUploading &&
                    styles.disabled,
                ]}
              >
                <Text
                  style={
                    styles.uploadButtonIcon
                  }
                >
                  📷
                </Text>

                <Text
                  style={
                    styles.uploadButtonText
                  }
                >
                  Zrób zdjęcie
                </Text>
              </Pressable>

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
                  styles.uploadButton,

                  pressed &&
                    styles.pressed,

                  isUploading &&
                    styles.disabled,
                ]}
              >
                <Text
                  style={
                    styles.uploadButtonIcon
                  }
                >
                  🖼️
                </Text>

                <Text
                  style={
                    styles.uploadButtonText
                  }
                >
                  Galeria
                </Text>
              </Pressable>
            </View>

            {images.length >
            0 ? (
              <View
                style={
                  styles.imageGrid
                }
              >
                {images.map(
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
                      />
                    </Pressable>
                  ),
                )}
              </View>
            ) : (
              <View
                style={
                  styles.emptyBox
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
                    styles.emptyText
                  }
                >
                  Dodaj zdjęcie z aparatu lub galerii.
                </Text>
              </View>
            )}
          </View>

          <View
            style={
              styles.section
            }
          >
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
                  Dokumenty
                </Text>

                <Text
                  style={
                    styles.sectionSubtitle
                  }
                >
                  {documents.length ===
                  1
                    ? '1 dokument'
                    : `${documents.length} dokumentów`}
                </Text>
              </View>

              <Pressable
                disabled={
                  isUploading
                }
                onPress={
                  handlePickDocument
                }
                style={({
                  pressed,
                }) => [
                  styles.addDocumentButton,

                  pressed &&
                    styles.pressed,

                  isUploading &&
                    styles.disabled,
                ]}
              >
                <Text
                  style={
                    styles.addDocumentButtonText
                  }
                >
                  + PDF
                </Text>
              </Pressable>
            </View>

            {documents.length >
            0 ? (
              <View
                style={
                  styles.documentsList
                }
              >
                {documents.map(
                  (
                    attachment,
                  ) => (
                    <View
                      key={
                        attachment.id
                      }
                      style={
                        styles.documentCard
                      }
                    >
                      <Pressable
                        onPress={() =>
                          void handleOpenDocument(
                            attachment,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.documentMain,

                          pressed &&
                            styles.pressed,
                        ]}
                      >
                        <View
                          style={
                            styles.documentIcon
                          }
                        >
                          <Text
                            style={
                              styles.documentIconText
                            }
                          >
                            📄
                          </Text>
                        </View>

                        <View
                          style={
                            styles.documentContent
                          }
                        >
                          <Text
                            numberOfLines={
                              2
                            }
                            style={
                              styles.documentName
                            }
                          >
                            {
                              attachment.fileName
                            }
                          </Text>

                          <Text
                            style={
                              styles.documentMeta
                            }
                          >
                            {formatFileSize(
                              attachment.size,
                            )}
                            {' · PDF'}
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

                      <Pressable
                        disabled={
                          isDeleting
                        }
                        onPress={() =>
                          confirmDeleteAttachment(
                            attachment,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.documentDeleteButton,

                          pressed &&
                            styles.pressed,
                        ]}
                      >
                        <Text
                          style={
                            styles.documentDeleteText
                          }
                        >
                          Usuń
                        </Text>
                      </Pressable>
                    </View>
                  ),
                )}
              </View>
            ) : (
              <View
                style={
                  styles.emptyBox
                }
              >
                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  📄
                </Text>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Brak dokumentów
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Dodaj instrukcję, fakturę lub inny dokument PDF.
                </Text>
              </View>
            )}
          </View>

          {isUploading && (
            <View
              style={
                styles.uploadingBox
              }
            >
              <ActivityIndicator />

              <Text
                style={
                  styles.uploadingText
                }
              >
                Wysyłanie pliku...
              </Text>
            </View>
          )}
        </ScrollView>

        <Modal
          visible={
            !!selectedAttachment
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
            <SafeAreaView
              style={
                styles.modalContainer
              }
            >
              <View
                style={
                  styles.modalToolbar
                }
              >
                <Pressable
                  onPress={() =>
                    setSelectedAttachment(
                      null,
                    )
                  }
                  style={
                    styles.modalToolbarButton
                  }
                >
                  <Text
                    style={
                      styles.modalToolbarButtonText
                    }
                  >
                    Zamknij
                  </Text>
                </Pressable>

                <Pressable
                  disabled={
                    !selectedAttachment ||
                    isDeleting
                  }
                  onPress={() => {
                    if (
                      selectedAttachment
                    ) {
                      confirmDeleteAttachment(
                        selectedAttachment,
                      );
                    }
                  }}
                  style={
                    styles.modalToolbarButton
                  }
                >
                  {isDeleting ? (
                    <ActivityIndicator
                      color="#FFFFFF"
                    />
                  ) : (
                    <Text
                      style={
                        styles.modalDeleteText
                      }
                    >
                      Usuń
                    </Text>
                  )}
                </Pressable>
              </View>

              {selectedAttachment && (
                <Image
                  source={{
                    uri:
                      selectedAttachment.url,
                  }}
                  resizeMode="contain"
                  style={
                    styles.modalImage
                  }
                />
              )}
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

function formatFileSize(
  bytes: number,
) {
  if (
    !Number.isFinite(
      bytes,
    ) ||
    bytes <= 0
  ) {
    return '0 KB';
  }

  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes /
    1024;

  if (
    kilobytes <
    1024
  ) {
    return `${kilobytes.toFixed(
      1,
    )} KB`;
  }

  const megabytes =
    kilobytes /
    1024;

  return `${megabytes.toFixed(
    1,
  )} MB`;
}

function showMessage(
  title: string,
  message: string,
) {
  if (
    Platform.OS ===
    'web'
  ) {
    window.alert(
      `${title}\n\n${message}`,
    );

    return;
  }

  Alert.alert(
    title,
    message,
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
      paddingBottom: 70,
    },

    center: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      padding: 24,
    },

    loadingText: {
      marginTop: 12,
      color: '#6B7280',
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
      textAlign:
        'center',
    },

    errorText: {
      marginTop: 8,
      color: '#6B7280',
      textAlign:
        'center',
    },

    headerCard: {
      padding: 20,
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
    },

    categoryIconContainer: {
      width: 58,
      height: 58,
      borderRadius: 16,
      backgroundColor:
        '#F3F4F6',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    categoryIcon: {
      fontSize: 30,
    },

    headerContent: {
      flex: 1,
      marginLeft: 16,
    },

    category: {
      color: '#6B7280',
      fontSize: 13,
      fontWeight:
        '700',
      textTransform:
        'uppercase',
    },

    title: {
      marginTop: 5,
      color: '#111827',
      fontSize: 24,
      fontWeight:
        '700',
    },

    description: {
      marginTop: 8,
      color: '#4B5563',
      fontSize: 15,
      lineHeight: 22,
    },

    actionsRow: {
      flexDirection:
        'row',
      gap: 12,
      marginTop: 16,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#FFFFFF',
    },

    secondaryButtonText: {
      color: '#111827',
      fontWeight:
        '600',
    },

    deleteEntryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        '#FCA5A5',
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#FEF2F2',
    },

    deleteEntryButtonText: {
      color: '#B91C1C',
      fontWeight:
        '600',
    },

    section: {
      marginTop: 30,
    },

    sectionHeader: {
      marginBottom: 14,
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
    },

    sectionTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#111827',
    },

    sectionSubtitle: {
      marginTop: 3,
      fontSize: 13,
      color: '#6B7280',
    },

    uploadButtons: {
      flexDirection:
        'row',
      gap: 12,
      marginBottom: 16,
    },

    uploadButton: {
      flex: 1,
      minHeight: 56,
      paddingHorizontal: 12,
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      backgroundColor:
        '#FFFFFF',
      flexDirection:
        'row',
      gap: 8,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    uploadButtonIcon: {
      fontSize: 20,
    },

    uploadButtonText: {
      color: '#111827',
      fontSize: 14,
      fontWeight:
        '600',
    },

    imageGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: 10,
    },

    imageCard: {
      width: '31%',
      aspectRatio: 1,
      overflow:
        'hidden',
      borderRadius: 12,
      backgroundColor:
        '#E5E7EB',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    emptyBox: {
      padding: 24,
      alignItems:
        'center',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      borderRadius: 16,
      backgroundColor:
        '#FFFFFF',
    },

    emptyIcon: {
      fontSize: 34,
    },

    emptyTitle: {
      marginTop: 10,
      fontSize: 16,
      fontWeight:
        '600',
      color: '#111827',
    },

    emptyText: {
      marginTop: 5,
      textAlign:
        'center',
      color: '#6B7280',
      lineHeight: 20,
    },

    addDocumentButton: {
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor:
        '#111827',
    },

    addDocumentButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight:
        '700',
    },

    documentsList: {
      gap: 10,
    },

    documentCard: {
      overflow:
        'hidden',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      borderRadius: 14,
      backgroundColor:
        '#FFFFFF',
    },

    documentMain: {
      minHeight: 76,
      padding: 14,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    documentIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor:
        '#F3F4F6',
      justifyContent:
        'center',
      alignItems:
        'center',
    },

    documentIconText: {
      fontSize: 24,
    },

    documentContent: {
      flex: 1,
      marginLeft: 13,
    },

    documentName: {
      color: '#111827',
      fontSize: 15,
      lineHeight: 20,
      fontWeight:
        '600',
    },

    documentMeta: {
      marginTop: 4,
      color: '#6B7280',
      fontSize: 12,
    },

    documentDeleteButton: {
      paddingVertical: 10,
      alignItems:
        'center',
      borderTopWidth: 1,
      borderTopColor:
        '#F3F4F6',
    },

    documentDeleteText: {
      color: '#B91C1C',
      fontSize: 13,
      fontWeight:
        '600',
    },

    arrow: {
      marginLeft: 10,
      color: '#9CA3AF',
      fontSize: 28,
    },

    uploadingBox: {
      marginTop: 22,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 10,
    },

    uploadingText: {
      color: '#6B7280',
      fontSize: 14,
    },

    modalBackdrop: {
      flex: 1,
      backgroundColor:
        'rgba(0, 0, 0, 0.96)',
    },

    modalContainer: {
      flex: 1,
    },

    modalToolbar: {
      minHeight: 60,
      paddingHorizontal: 18,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
    },

    modalToolbarButton: {
      minWidth: 70,
      minHeight: 44,
      justifyContent:
        'center',
    },

    modalToolbarButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight:
        '600',
    },

    modalDeleteText: {
      color: '#FCA5A5',
      fontSize: 15,
      fontWeight:
        '700',
      textAlign:
        'right',
    },

    modalImage: {
      flex: 1,
      width: '100%',
    },

    pressed: {
      opacity: 0.7,
    },

    disabled: {
      opacity: 0.5,
    },
  });