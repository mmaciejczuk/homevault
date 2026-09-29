import {
  router,
} from 'expo-router';

import * as Linking from 'expo-linking';

import {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  supabase,
} from '../../lib/supabase';

interface RecoveryParams {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  errorDescription?: string;
}

function parseRecoveryUrl(
  url: string,
): RecoveryParams {
  const parts: string[] = [];

  const questionIndex =
    url.indexOf('?');

  const hashIndex =
    url.indexOf('#');

  if (questionIndex >= 0) {
    const end =
      hashIndex > questionIndex
        ? hashIndex
        : url.length;

    parts.push(
      url.slice(
        questionIndex + 1,
        end,
      ),
    );
  }

  if (hashIndex >= 0) {
    parts.push(
      url.slice(
        hashIndex + 1,
      ),
    );
  }

  const params =
    new URLSearchParams(
      parts.join('&'),
    );

  return {
    code:
      params.get('code') ??
      undefined,

    accessToken:
      params.get(
        'access_token',
      ) ?? undefined,

    refreshToken:
      params.get(
        'refresh_token',
      ) ?? undefined,

    errorDescription:
      params.get(
        'error_description',
      ) ?? undefined,
  };
}

export default function ResetPasswordScreen() {
  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState('');

  const [
    isPreparing,
    setIsPreparing,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    recoveryReady,
    setRecoveryReady,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  const showMessage = (
    title: string,
    message: string,
  ) => {
    if (Platform.OS === 'web') {
      window.alert(
        `${title}\n\n${message}`,
      );

      return;
    }

    Alert.alert(
      title,
      message,
    );
  };

  useEffect(() => {
    let mounted = true;

    const processUrl =
      async (
        url: string | null,
      ) => {
        if (!url) {
          return;
        }

        try {
          const params =
            parseRecoveryUrl(
              url,
            );

          if (
            params.errorDescription
          ) {
            throw new Error(
              decodeURIComponent(
                params.errorDescription,
              ),
            );
          }

          if (params.code) {
            const {
              error,
            } =
              await supabase.auth
                .exchangeCodeForSession(
                  params.code,
                );

            if (error) {
              throw error;
            }

            if (mounted) {
              setRecoveryReady(
                true,
              );
            }

            return;
          }

          if (
            params.accessToken &&
            params.refreshToken
          ) {
            const {
              error,
            } =
              await supabase.auth
                .setSession({
                  access_token:
                    params.accessToken,

                  refresh_token:
                    params.refreshToken,
                });

            if (error) {
              throw error;
            }

            if (mounted) {
              setRecoveryReady(
                true,
              );
            }

            return;
          }

          throw new Error(
            'Link resetujący hasło jest nieprawidłowy lub wygasł.',
          );
        } catch (error) {
          console.error(
            'Błąd linku resetowania hasła:',
            error,
          );

          if (mounted) {
            setErrorMessage(
              error instanceof Error
                ? error.message
                : 'Nie udało się otworzyć linku resetującego hasło.',
            );
          }
        } finally {
          if (mounted) {
            setIsPreparing(false);
          }
        }
      };

    const {
      data: authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
          ) => {
            if (
              event ===
              'PASSWORD_RECOVERY'
            ) {
              setRecoveryReady(
                true,
              );

              setIsPreparing(
                false,
              );
            }
          },
        );

    const linkSubscription =
      Linking.addEventListener(
        'url',
        ({
          url,
        }) => {
          void processUrl(
            url,
          );
        },
      );

    const initialize =
      async () => {
        let initialUrl =
          await Linking
            .getInitialURL();

        if (
          !initialUrl &&
          Platform.OS ===
            'web' &&
          typeof window !==
            'undefined'
        ) {
          initialUrl =
            window.location.href;
        }

        await processUrl(
          initialUrl,
        );
      };

    void initialize();

    return () => {
      mounted = false;

      linkSubscription.remove();

      authListener
        .subscription
        .unsubscribe();
    };
  }, []);

  const handleSave =
    async () => {
      if (
        password.length < 6
      ) {
        showMessage(
          'Hasło jest za krótkie',
          'Hasło powinno mieć co najmniej 6 znaków.',
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        showMessage(
          'Hasła są różne',
          'Wpisz takie samo hasło w obu polach.',
        );

        return;
      }

      try {
        setIsSaving(true);

        const {
          error,
        } =
          await supabase.auth
            .updateUser({
              password,
            });

        if (error) {
          throw error;
        }

        /*
         * Recovery tworzy sesję.
         * Po zmianie hasła kończymy ją,
         * aby użytkownik zalogował się
         * już nowym hasłem.
         */
        await supabase.auth
          .signOut({
            scope: 'local',
          });

        showMessage(
          'Hasło zmienione',
          'Możesz teraz zalogować się nowym hasłem.',
        );

        router.replace(
          '/login',
        );
      } catch (error) {
        console.error(
          'Błąd zmiany hasła:',
          error,
        );

        showMessage(
          'Nie udało się zmienić hasła',
          error instanceof Error
            ? error.message
            : 'Spróbuj ponownie.',
        );
      } finally {
        setIsSaving(false);
      }
    };

  if (isPreparing) {
    return (
      <SafeAreaView
        style={styles.container}
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
            Weryfikowanie linku...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (
    errorMessage ||
    !recoveryReady
  ) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <View
          style={
            styles.centerCard
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            Link jest nieprawidłowy
          </Text>

          <Text
            style={
              styles.description
            }
          >
            {errorMessage ??
              'Link resetujący hasło wygasł lub został już wykorzystany.'}
          </Text>

          <Pressable
            onPress={() =>
              router.replace(
                '/forgot-password',
              )
            }
            style={
              styles.primaryButton
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Wyślij nowy link
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              Ustaw nowe hasło
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Podaj nowe hasło do
              konta HomeVault.
            </Text>

            <Text style={styles.label}>
              Nowe hasło
            </Text>

            <TextInput
              value={password}
              onChangeText={
                setPassword
              }
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isSaving}
              style={styles.input}
            />

            <Text
              style={[
                styles.label,
                styles.secondLabel,
              ]}
            >
              Powtórz hasło
            </Text>

            <TextInput
              value={
                confirmPassword
              }
              onChangeText={
                setConfirmPassword
              }
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={!isSaving}
              style={styles.input}
            />

            <Pressable
              disabled={isSaving}
              onPress={
                handleSave
              }
              style={({
                pressed,
              }) => [
                styles.primaryButton,

                pressed &&
                  styles.pressed,

                isSaving &&
                  styles.disabled,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Zmień hasło
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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

    content: {
      flexGrow: 1,
      justifyContent:
        'center',
      padding: 24,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    centerCard: {
      margin: 24,
      padding: 24,
      borderRadius: 20,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
    },

    loadingText: {
      marginTop: 12,
      color: '#6B7280',
    },

    card: {
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      borderRadius: 20,
      padding: 24,
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
    },

    errorTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: '#B91C1C',
    },

    description: {
      marginTop: 10,
      marginBottom: 24,
      fontSize: 14,
      lineHeight: 21,
      color: '#6B7280',
    },

    label: {
      marginBottom: 7,
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },

    secondLabel: {
      marginTop: 16,
    },

    input: {
      minHeight: 50,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 11,
      backgroundColor:
        '#FFFFFF',
      fontSize: 16,
      color: '#111827',
    },

    primaryButton: {
      minHeight: 52,
      marginTop: 24,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor:
        '#111827',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    primaryButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.72,
    },

    disabled: {
      opacity: 0.55,
    },
  });