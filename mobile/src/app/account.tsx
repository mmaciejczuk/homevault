import {
  router,
} from 'expo-router';

import {
  useEffect,
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
} from '../lib/api';

import {
  supabase,
} from '../lib/supabase';

interface AccountInfo {
  id: string;
  email:
    | string
    | null;
  provider:
    | string
    | null;
}

export default function AccountScreen() {
  const [
    account,
    setAccount,
  ] =
    useState<AccountInfo | null>(
      null,
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(true);

  const [
    isSigningOut,
    setIsSigningOut,
  ] =
    useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    const loadAccount =
      async () => {
        try {
          setIsLoading(
            true,
          );

          setError(
            null,
          );

          const {
            data: {
              user,
            },

            error:
              userError,
          } =
            await supabase.auth
              .getUser();

          if (userError) {
            throw userError;
          }

          if (!user) {
            throw new Error(
              'Brak zalogowanego użytkownika.',
            );
          }

          const provider =
            user.app_metadata
              ?.provider ??
            user.identities?.[0]
              ?.provider ??
            null;

          setAccount({
            id:
              user.id,

            email:
              user.email ??
              null,

            provider:
              provider
                ? String(
                    provider,
                  )
                : null,
          });
        } catch (err) {
          console.error(
            'Błąd pobierania konta:',
            err,
          );

          setError(
            'Nie udało się pobrać danych konta.',
          );
        } finally {
          setIsLoading(
            false,
          );
        }
      };

    void loadAccount();
  }, []);

  const handleSignOut =
    async () => {
      try {
        setIsSigningOut(
          true,
        );

        const {
          error:
            signOutError,
        } =
          await supabase.auth
            .signOut();

        if (signOutError) {
          throw signOutError;
        }

        router.replace(
          '/login',
        );
      } catch (err) {
        console.error(
          'Błąd wylogowania:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się wylogować.',
        );
      } finally {
        setIsSigningOut(
          false,
        );
      }
    };

  const confirmDelete =
    async () => {
      if (
        Platform.OS === 'web'
      ) {
        return window.confirm(
          'Czy na pewno chcesz trwale usunąć konto? Wszystkie domy, pomieszczenia, wpisy i załączniki zostaną usunięte.',
        );
      }

      return new Promise<boolean>(
        (
          resolve,
        ) => {
          Alert.alert(
            'Usuń konto',

            'Ta operacja jest nieodwracalna. Zostaną usunięte wszystkie domy, pomieszczenia, wpisy i załączniki.',

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
                  'Usuń konto',

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

  const handleDeleteAccount =
    async () => {
      const confirmed =
        await confirmDelete();

      if (!confirmed) {
        return;
      }

      try {
        setIsDeleting(
          true,
        );

        const response =
          await apiFetch(
            '/auth/account',
            {
              method:
                'DELETE',
            },
          );

        if (!response.ok) {
          const responseBody =
            await response.text();

          throw new Error(
            `DELETE /auth/account zwróciło ${response.status}: ${responseBody}`,
          );
        }

        /*
         * Konto na backendzie już nie istnieje.
         * Czyścimy lokalną sesję Supabase.
         */
        const {
          error:
            signOutError,
        } =
          await supabase.auth
            .signOut({
              scope:
                'local',
            });

        if (signOutError) {
          console.warn(
            'Konto usunięte, ale lokalna sesja nie została poprawnie wyczyszczona:',
            signOutError,
          );
        }

        if (
          Platform.OS ===
          'web'
        ) {
          window.alert(
            'Konto zostało usunięte.',
          );

          router.replace(
            '/login',
          );

          return;
        }

        Alert.alert(
          'Konto usunięte',

          'Twoje konto i dane HomeVault zostały usunięte.',

          [
            {
              text:
                'OK',

              onPress:
                () =>
                  router.replace(
                    '/login',
                  ),
            },
          ],

          {
            cancelable:
              false,
          },
        );
      } catch (err) {
        console.error(
          'Błąd usuwania konta:',
          err,
        );

        showMessage(
          'Błąd',
          'Nie udało się usunąć konta.',
        );
      } finally {
        setIsDeleting(
          false,
        );
      }
    };

  if (isLoading) {
    return (
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
            Pobieranie konta...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    error ||
    !account
  ) {
    return (
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
              styles.errorText
            }
          >
            {error}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const provider =
    formatProvider(
      account.provider ??
        'email',
    );

  return (
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
            styles.profile
          }
        >
          <View
            style={
              styles.avatar
            }
          >
            <Text
              style={
                styles.avatarText
              }
            >
              {getInitial(
                account.email,
              )}
            </Text>
          </View>

          <Text
            style={
              styles.email
            }
          >
            {account.email ??
              'Brak adresu e-mail'}
          </Text>

          <Text
            style={
              styles.provider
            }
          >
            {provider}
          </Text>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Konto
        </Text>

        <View
          style={
            styles.card
          }
        >
          <View
            style={
              styles.row
            }
          >
            <View
              style={
                styles.rowContent
              }
            >
              <Text
                style={
                  styles.rowTitle
                }
              >
                E-mail
              </Text>

              <Text
                style={
                  styles.rowDescription
                }
              >
                {account.email ??
                  '—'}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.separator
            }
          />

          <View
            style={
              styles.row
            }
          >
            <View
              style={
                styles.rowContent
              }
            >
              <Text
                style={
                  styles.rowTitle
                }
              >
                Logowanie
              </Text>

              <Text
                style={
                  styles.rowDescription
                }
              >
                {provider}
              </Text>
            </View>
          </View>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Bezpieczeństwo
        </Text>

        <View
          style={
            styles.card
          }
        >
          <Pressable
            disabled={
              isSigningOut ||
              isDeleting
            }
            onPress={
              handleSignOut
            }
            style={({
              pressed,
            }) => [
              styles.actionRow,

              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={
                styles.rowContent
              }
            >
              <Text
                style={
                  styles.rowTitle
                }
              >
                Wyloguj
              </Text>

              <Text
                style={
                  styles.rowDescription
                }
              >
                Zakończ bieżącą sesję HomeVault.
              </Text>
            </View>

            {isSigningOut ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text
                style={
                  styles.arrow
                }
              >
                ›
              </Text>
            )}
          </Pressable>
        </View>

        <Text
          style={
            styles.sectionTitle
          }
        >
          Prywatność
        </Text>

        <View
          style={
            styles.card
          }
        >
          <Pressable
            disabled={
              isDeleting ||
              isSigningOut
            }
            onPress={
              handleDeleteAccount
            }
            style={({
              pressed,
            }) => [
              styles.actionRow,

              pressed &&
                styles.pressed,
            ]}
          >
            <View
              style={
                styles.rowContent
              }
            >
              <Text
                style={
                  styles.deleteTitle
                }
              >
                Usuń konto
              </Text>

              <Text
                style={
                  styles.rowDescription
                }
              >
                Trwale usuń konto oraz wszystkie dane HomeVault.
              </Text>
            </View>

            {isDeleting ? (
              <ActivityIndicator
                size="small"
              />
            ) : (
              <Text
                style={
                  styles.deleteArrow
                }
              >
                ›
              </Text>
            )}
          </Pressable>
        </View>

        <Text
          style={
            styles.footer
          }
        >
          HomeVault
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatProvider(
  provider: string,
) {
  switch (
    provider.toLowerCase()
  ) {
    case 'google':
      return 'Google';

    case 'email':
      return 'E-mail i hasło';

    case 'facebook':
      return 'Facebook';

    case 'apple':
      return 'Apple';

    default:
      return provider;
  }
}

function getInitial(
  email:
    | string
    | null,
) {
  if (!email) {
    return '?';
  }

  return email
    .charAt(0)
    .toUpperCase();
}

function showMessage(
  title: string,
  message: string,
) {
  if (
    Platform.OS === 'web'
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
      paddingBottom: 60,
    },

    center: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      padding: 24,
    },

    loadingText: {
      marginTop: 12,
      color: '#6B7280',
    },

    profile: {
      alignItems:
        'center',
      marginBottom: 34,
    },

    avatar: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor:
        '#111827',
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    avatarText: {
      color: '#FFFFFF',
      fontSize: 30,
      fontWeight:
        '700',
    },

    email: {
      marginTop: 16,
      fontSize: 19,
      fontWeight:
        '600',
      color: '#111827',
    },

    provider: {
      marginTop: 5,
      fontSize: 14,
      color: '#6B7280',
    },

    sectionTitle: {
      marginTop: 24,
      marginBottom: 10,
      fontSize: 14,
      fontWeight:
        '700',
      color: '#6B7280',
      textTransform:
        'uppercase',
    },

    card: {
      overflow:
        'hidden',
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      backgroundColor:
        '#FFFFFF',
    },

    row: {
      minHeight: 76,
      paddingHorizontal: 18,
      paddingVertical: 15,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    actionRow: {
      minHeight: 76,
      paddingHorizontal: 18,
      paddingVertical: 15,
      flexDirection:
        'row',
      alignItems:
        'center',
    },

    rowContent: {
      flex: 1,
    },

    rowTitle: {
      fontSize: 16,
      fontWeight:
        '600',
      color: '#111827',
    },

    deleteTitle: {
      fontSize: 16,
      fontWeight:
        '600',
      color: '#B91C1C',
    },

    rowDescription: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color: '#6B7280',
    },

    separator: {
      height: 1,
      marginLeft: 18,
      backgroundColor:
        '#E5E7EB',
    },

    arrow: {
      marginLeft: 15,
      fontSize: 28,
      color: '#9CA3AF',
    },

    deleteArrow: {
      marginLeft: 15,
      fontSize: 28,
      color: '#B91C1C',
    },

    pressed: {
      opacity: 0.65,
    },

    errorTitle: {
      fontSize: 20,
      fontWeight:
        '700',
      color: '#B91C1C',
    },

    errorText: {
      marginTop: 8,
      color: '#6B7280',
      textAlign:
        'center',
    },

    footer: {
      marginTop: 34,
      textAlign:
        'center',
      color: '#9CA3AF',
      fontSize: 12,
    },
  });