import { router, useLocalSearchParams } from 'expo-router';

import * as Linking from 'expo-linking';

import {
  useEffect,
  useRef,
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

type RouteValue =
  | string
  | string[]
  | undefined;

interface RecoveryData {
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenHash?: string;
  type?: string;
  error?: string;
}

function firstValue(
  value: RouteValue,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function safeDecode(
  value: string,
): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseParameters(
  raw: string,
): RecoveryData {
  const cleaned =
    raw.replace(
      /^[?#]/,
      '',
    );

  const params =
    new URLSearchParams(
      cleaned,
    );

  return {
    code:
      params.get(
        'code',
      ) ?? undefined,

    accessToken:
      params.get(
        'access_token',
      ) ?? undefined,

    refreshToken:
      params.get(
        'refresh_token',
      ) ?? undefined,

    tokenHash:
      params.get(
        'token_hash',
      ) ?? undefined,

    type:
      params.get(
        'type',
      ) ?? undefined,

    error:
      params.get(
        'error_description',
      ) ??
      params.get(
        'error',
      ) ??
      params.get(
        'error_code',
      ) ??
      undefined,
  };
}

function mergeRecoveryData(
  target: RecoveryData,
  source: RecoveryData,
): RecoveryData {
  return {
    code:
      target.code ??
      source.code,

    accessToken:
      target.accessToken ??
      source.accessToken,

    refreshToken:
      target.refreshToken ??
      source.refreshToken,

    tokenHash:
      target.tokenHash ??
      source.tokenHash,

    type:
      target.type ??
      source.type,

    error:
      target.error ??
      source.error,
  };
}

function parseRecoveryUrl(
  url: string,
): RecoveryData {
  let result: RecoveryData = {};

  const questionIndex =
    url.indexOf('?');

  const hashIndex =
    url.indexOf('#');

  if (questionIndex >= 0) {
    const queryEnd =
      hashIndex > questionIndex
        ? hashIndex
        : url.length;

    result =
      mergeRecoveryData(
        result,
        parseParameters(
          url.slice(
            questionIndex + 1,
            queryEnd,
          ),
        ),
      );
  }

  if (hashIndex >= 0) {
    result =
      mergeRecoveryData(
        result,
        parseParameters(
          url.slice(
            hashIndex + 1,
          ),
        ),
      );
  }

  return result;
}

function containsRecoveryData(
  data: RecoveryData,
) {
  return Boolean(
    data.code ||
      data.tokenHash ||
      (
        data.accessToken &&
        data.refreshToken
      ) ||
      data.error,
  );
}

export default function ResetPasswordScreen() {
  const linkingUrl =
    Linking.useLinkingURL();

  const routeParams =
    useLocalSearchParams<{
      code?: string | string[];
      access_token?: string | string[];
      refresh_token?: string | string[];
      token_hash?: string | string[];
      type?: string | string[];
      error?: string | string[];
      error_description?: string | string[];
      error_code?: string | string[];
    }>();

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
  ] =
    useState<string | null>(
      null,
    );

  const recoveryUserIdRef =
    useRef<string | null>(
      null,
    );

  const processingRef =
    useRef(false);

  const processedValueRef =
    useRef<string | null>(
      null,
    );

  useEffect(() => {
    let mounted = true;

    const markRecoveryReady =
      async () => {
        const {
          data: {
            user,
          },
          error,
        } =
          await supabase.auth
            .getUser();

        if (error) {
          throw error;
        }

        if (!user) {
          throw new Error(
            'Nie udało się ustalić użytkownika dla linku resetującego hasło.',
          );
        }

        recoveryUserIdRef.current =
          user.id;

        if (!mounted) {
          return;
        }

        setRecoveryReady(
          true,
        );

        setErrorMessage(
          null,
        );

        setIsPreparing(
          false,
        );
      };

    const processRecoveryData =
      async (
        data: RecoveryData,
      ) => {
        if (
          processingRef.current
        ) {
          return;
        }

        processingRef.current =
          true;

        try {
          if (mounted) {
            setIsPreparing(
              true,
            );

            setRecoveryReady(
              false,
            );

            setErrorMessage(
              null,
            );
          }

          /*
           * Supabase może zwrócić błąd
           * w query albo hash fragment.
           */
          if (data.error) {
            throw new Error(
              safeDecode(
                data.error,
              ),
            );
          }

          /*
           * FLOW 1:
           *
           * PKCE
           *
           * homevault://auth/reset-password
           * ?code=...
           */
          if (data.code) {
            const {
              data:
                exchangeData,
              error:
                exchangeError,
            } =
              await supabase.auth
                .exchangeCodeForSession(
                  data.code,
                );

            if (exchangeError) {
              throw exchangeError;
            }

            if (
              !exchangeData.session
            ) {
              throw new Error(
                'Supabase nie utworzył sesji po wymianie kodu recovery.',
              );
            }

            await markRecoveryReady();

            return;
          }

          /*
           * FLOW 2:
           *
           * token_hash
           *
           * homevault://auth/reset-password
           * ?token_hash=...
           * &type=recovery
           */
          if (data.tokenHash) {
            if (
              data.type &&
              data.type !==
                'recovery'
            ) {
              throw new Error(
                'Link nie jest linkiem resetującym hasło.',
              );
            }

            const {
              data:
                verifyData,
              error:
                verifyError,
            } =
              await supabase.auth
                .verifyOtp({
                  token_hash:
                    data.tokenHash,

                  type:
                    'recovery',
                });

            if (verifyError) {
              throw verifyError;
            }

            if (
              !verifyData.session
            ) {
              throw new Error(
                'Supabase nie utworzył sesji recovery po weryfikacji tokenu.',
              );
            }

            await markRecoveryReady();

            return;
          }

          /*
           * FLOW 3:
           *
           * Implicit flow
           *
           * homevault://auth/reset-password
           * #access_token=...
           * &refresh_token=...
           * &type=recovery
           */
          if (
            data.accessToken &&
            data.refreshToken
          ) {
            if (
              data.type &&
              data.type !==
                'recovery'
            ) {
              throw new Error(
                'Link nie jest linkiem resetującym hasło.',
              );
            }

            const {
              data:
                sessionData,
              error:
                sessionError,
            } =
              await supabase.auth
                .setSession({
                  access_token:
                    data.accessToken,

                  refresh_token:
                    data.refreshToken,
                });

            if (sessionError) {
              throw sessionError;
            }

            if (
              !sessionData.session
            ) {
              throw new Error(
                'Supabase nie utworzył sesji recovery.',
              );
            }

            await markRecoveryReady();

            return;
          }

          throw new Error(
            'Nie udało się odczytać danych recovery z linku. Wyślij nowy link resetujący hasło.',
          );
        } catch (error) {
          console.error(
            'Błąd linku resetowania hasła:',
            error,
          );

          recoveryUserIdRef.current =
            null;

          if (!mounted) {
            return;
          }

          setRecoveryReady(
            false,
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Nie udało się zweryfikować linku resetującego hasło.',
          );

          setIsPreparing(
            false,
          );
        } finally {
          processingRef.current =
            false;
        }
      };

    const initialize =
      async () => {
        try {
          /*
           * Najważniejsze źródło:
           * pełny URL przekazany przez OS.
           *
           * useLinkingURL obsługuje zarówno
           * cold start, jak i kolejne linki.
           */
          if (linkingUrl) {
            const marker =
              `url:${linkingUrl}`;

            if (
              processedValueRef.current !==
              marker
            ) {
              const urlData =
                parseRecoveryUrl(
                  linkingUrl,
                );

              if (
                containsRecoveryData(
                  urlData,
                )
              ) {
                processedValueRef.current =
                  marker;

                await processRecoveryData(
                  urlData,
                );

                return;
              }
            }
          }

          /*
           * Fallback:
           *
           * Expo Router potrafi zachować
           * query parameters nawet wtedy,
           * kiedy pełny URL nie jest już
           * dostępny.
           */
          const routerData:
            RecoveryData = {
            code:
              firstValue(
                routeParams.code,
              ),

            accessToken:
              firstValue(
                routeParams
                  .access_token,
              ),

            refreshToken:
              firstValue(
                routeParams
                  .refresh_token,
              ),

            tokenHash:
              firstValue(
                routeParams
                  .token_hash,
              ),

            type:
              firstValue(
                routeParams.type,
              ),

            error:
              firstValue(
                routeParams
                  .error_description,
              ) ??
              firstValue(
                routeParams.error,
              ) ??
              firstValue(
                routeParams
                  .error_code,
              ),
          };

          if (
            containsRecoveryData(
              routerData,
            )
          ) {
            const marker =
              JSON.stringify(
                routerData,
              );

            if (
              processedValueRef.current !==
              marker
            ) {
              processedValueRef.current =
                marker;

              await processRecoveryData(
                routerData,
              );

              return;
            }
          }

          /*
           * Nie używamy tu getSession()
           * jako fallbacku.
           *
           * Zwykła aktywna sesja
           * nie oznacza, że użytkownik
           * wszedł przez recovery link.
           */
          throw new Error(
            'Nie udało się odczytać danych recovery z linku. Wyślij nowy link resetujący hasło.',
          );
        } catch (error) {
          console.error(
            'Błąd przygotowania resetu hasła:',
            error,
          );

          recoveryUserIdRef.current =
            null;

          if (!mounted) {
            return;
          }

          setRecoveryReady(
            false,
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Nie udało się zweryfikować linku.',
          );

          setIsPreparing(
            false,
          );
        }
      };

    void initialize();

    return () => {
      mounted = false;
    };
  }, [
    linkingUrl,
    routeParams.code,
    routeParams.access_token,
    routeParams.refresh_token,
    routeParams.token_hash,
    routeParams.type,
    routeParams.error,
    routeParams.error_description,
    routeParams.error_code,
  ]);

  const showError = (
    title: string,
    message: string,
  ) => {
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
  };

  const showSuccess =
    () => {
      if (
        Platform.OS === 'web'
      ) {
        window.alert(
          'Hasło zostało zmienione. Możesz teraz zalogować się nowym hasłem.',
        );

        router.replace(
          '/login',
        );

        return;
      }

      Alert.alert(
        'Hasło zmienione',
        'Możesz teraz zalogować się nowym hasłem.',
        [
          {
            text: 'OK',

            onPress: () =>
              router.replace(
                '/login',
              ),
          },
        ],
      );
    };

  const handleSave =
    async () => {
      if (
        !recoveryReady ||
        !recoveryUserIdRef
          .current
      ) {
        showError(
          'Brak sesji recovery',
          'Wyślij nowy link resetujący hasło.',
        );

        return;
      }

      if (
        password.length < 6
      ) {
        showError(
          'Hasło jest za krótkie',
          'Hasło powinno mieć co najmniej 6 znaków.',
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        showError(
          'Hasła są różne',
          'Wpisz takie samo hasło w obu polach.',
        );

        return;
      }

      try {
        setIsSaving(
          true,
        );

        /*
         * Jeszcze raz sprawdzamy,
         * czy aktualna sesja należy
         * do użytkownika utworzonego
         * z recovery linka.
         */
        const {
          data: {
            user:
              currentUser,
          },
          error:
            userError,
        } =
          await supabase.auth
            .getUser();

        if (userError) {
          throw userError;
        }

        if (
          !currentUser ||
          currentUser.id !==
            recoveryUserIdRef
              .current
        ) {
          throw new Error(
            'Sesja użytkownika zmieniła się podczas resetowania hasła. Wyślij nowy link.',
          );
        }

        const {
          data,
          error,
        } =
          await supabase.auth
            .updateUser({
              password,
            });

        if (error) {
          throw error;
        }

        if (
          !data.user ||
          data.user.id !==
            recoveryUserIdRef
              .current
        ) {
          throw new Error(
            'Supabase zaktualizował nieoczekiwane konto.',
          );
        }

        /*
         * Po poprawnej zmianie hasła
         * usuwamy lokalną sesję recovery.
         */
        const {
          error:
            signOutError,
        } =
          await supabase.auth
            .signOut({
              scope: 'local',
            });

        if (signOutError) {
          console.warn(
            'Hasło zmienione, ale nie udało się usunąć lokalnej sesji:',
            signOutError,
          );
        }

        recoveryUserIdRef.current =
          null;

        setRecoveryReady(
          false,
        );

        showSuccess();
      } catch (error) {
        console.error(
          'Błąd zmiany hasła:',
          error,
        );

        showError(
          'Nie udało się zmienić hasła',
          error instanceof Error
            ? error.message
            : 'Spróbuj ponownie.',
        );
      } finally {
        setIsSaving(
          false,
        );
      }
    };

  if (isPreparing) {
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
        style={
          styles.container
        }
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
      style={
        styles.container
      }
    >
      <KeyboardAvoidingView
        style={
          styles.container
        }
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
          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.title
              }
            >
              Ustaw nowe hasło
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Podaj nowe hasło do konta HomeVault.
            </Text>

            <Text
              style={
                styles.label
              }
            >
              Nowe hasło
            </Text>

            <TextInput
              value={
                password
              }
              onChangeText={
                setPassword
              }
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              editable={
                !isSaving
              }
              style={
                styles.input
              }
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
              editable={
                !isSaving
              }
              style={
                styles.input
              }
            />

            <Pressable
              disabled={
                isSaving
              }
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
      alignItems:
        'center',
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
      alignSelf:
        'center',
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
      fontWeight:
        '700',
      color: '#111827',
    },

    errorTitle: {
      fontSize: 22,
      fontWeight:
        '700',
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
      fontWeight:
        '600',
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
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    primaryButtonText: {
      fontSize: 15,
      fontWeight:
        '700',
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.72,
    },

    disabled: {
      opacity: 0.55,
    },
  });