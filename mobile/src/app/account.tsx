import { router } from 'expo-router';
import { useEffect, useState } from 'react';

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

import { supabase } from '../lib/supabase';

export default function AccountScreen() {
  const [email, setEmail] =
    useState<string | null>(null);

  const [provider, setProvider] =
    useState<string>('—');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSigningOut, setIsSigningOut] =
    useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        setEmail(
          user?.email ?? null,
        );

        const providerName =
          user?.app_metadata?.provider;

        if (
          typeof providerName ===
          'string'
        ) {
          setProvider(
            formatProvider(
              providerName,
            ),
          );
        }
      } catch (error) {
        console.error(
          'Błąd pobierania użytkownika:',
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const performSignOut =
    async () => {
      try {
        setIsSigningOut(true);

        const { error } =
          await supabase.auth
            .signOut();

        if (error) {
          throw error;
        }

        router.replace(
          '/login',
        );
      } catch (error) {
        console.error(
          'Błąd wylogowania:',
          error,
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

  const handleSignOut = () => {
    if (
      Platform.OS === 'web'
    ) {
      const confirmed =
        window.confirm(
          'Czy na pewno chcesz się wylogować?',
        );

      if (confirmed) {
        performSignOut();
      }

      return;
    }

    Alert.alert(
      'Wylogowanie',
      'Czy na pewno chcesz się wylogować?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Wyloguj',
          style:
            'destructive',
          onPress:
            performSignOut,
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
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
            Ładowanie konta...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={
            styles.header
          }
        >
          <Pressable
            onPress={() =>
              router.back()
            }
            style={({
              pressed,
            }) => [
              styles.backButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Konto
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Informacje i ustawienia
              Twojego konta.
            </Text>
          </View>
        </View>

        <View
          style={
            styles.profileCard
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
                email,
              )}
            </Text>
          </View>

          <View
            style={
              styles.profileInfo
            }
          >
            <Text
              style={
                styles.email
              }
            >
              {email ??
                'Brak adresu e-mail'}
            </Text>

            <Text
              style={
                styles.provider
              }
            >
              Logowanie:{' '}
              {provider}
            </Text>
          </View>
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
                Adres e-mail
              </Text>

              <Text
                style={
                  styles.rowDescription
                }
              >
                {email ?? '—'}
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
                Metoda logowania
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
              isSigningOut
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
                Zakończ bieżącą
                sesję HomeVault.
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
                Usuń konto
              </Text>

              <Text
                style={
                  styles.rowDescription
                }
              >
                Usuwanie konta
                i wszystkich danych
                dodamy w kolejnym
                kroku.
              </Text>
            </View>

            <Text
              style={
                styles.disabledLabel
              }
            >
              Wkrótce
            </Text>
          </View>
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
  email: string | null,
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
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      marginTop: 14,
      color: '#6B7280',
    },

    header: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      marginBottom: 28,
    },

    backButton: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight: 14,
    },

    backButtonText: {
      fontSize: 32,
      lineHeight: 34,
      color: '#374151',
    },

    headerText: {
      flex: 1,
    },

    title: {
      fontSize: 30,
      fontWeight: '700',
      color: '#111827',
    },

    subtitle: {
      marginTop: 5,
      color: '#6B7280',
      lineHeight: 20,
    },

    profileCard: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 18,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },

    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor:
        '#111827',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    avatarText: {
      color: '#FFFFFF',
      fontSize: 24,
      fontWeight: '700',
    },

    profileInfo: {
      flex: 1,
      marginLeft: 16,
    },

    email: {
      color: '#111827',
      fontSize: 16,
      fontWeight: '600',
    },

    provider: {
      marginTop: 5,
      color: '#6B7280',
      fontSize: 14,
    },

    sectionTitle: {
      marginTop: 30,
      marginBottom: 10,
      marginLeft: 4,
      color: '#6B7280',
      fontSize: 13,
      fontWeight: '700',
      textTransform:
        'uppercase',
    },

    card: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      overflow: 'hidden',
    },

    row: {
      minHeight: 74,
      paddingHorizontal: 18,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    actionRow: {
      minHeight: 74,
      paddingHorizontal: 18,
      paddingVertical: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },

    rowContent: {
      flex: 1,
    },

    rowTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#111827',
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
      marginLeft: 12,
      fontSize: 30,
      color: '#9CA3AF',
    },

    disabledLabel: {
      marginLeft: 12,
      fontSize: 12,
      fontWeight: '600',
      color: '#9CA3AF',
    },

    footer: {
      marginTop: 34,
      textAlign: 'center',
      color: '#9CA3AF',
      fontSize: 12,
    },

    pressed: {
      opacity: 0.65,
    },
  });