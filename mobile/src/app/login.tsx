import {
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
  signInWithGoogle,
} from '../lib/googleAuth';

import {
  supabase,
} from '../lib/supabase';

export default function LoginScreen() {
  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(false);

  const [
    isGoogleLoading,
    setIsGoogleLoading,
  ] =
    useState(false);

  const showMessage = (
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

  const validateForm = () => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      showMessage(
        'Brak adresu e-mail',
        'Podaj adres e-mail.',
      );

      return null;
    }

    if (!password) {
      showMessage(
        'Brak hasła',
        'Podaj hasło.',
      );

      return null;
    }

    if (
      password.length < 6
    ) {
      showMessage(
        'Hasło jest za krótkie',
        'Hasło powinno mieć co najmniej 6 znaków.',
      );

      return null;
    }

    return {
      email:
        normalizedEmail,

      password,
    };
  };

  const handleSignIn =
    async () => {
      const credentials =
        validateForm();

      if (!credentials) {
        return;
      }

      try {
        setIsLoading(true);

        const {
          error,
        } =
          await supabase.auth
            .signInWithPassword(
              credentials,
            );

        if (error) {
          throw error;
        }
      } catch (error) {
        console.error(
          'Błąd logowania:',
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Nie udało się zalogować.';

        showMessage(
          'Logowanie nieudane',
          message,
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleRegister =
    async () => {
      const credentials =
        validateForm();

      if (!credentials) {
        return;
      }

      try {
        setIsLoading(true);

        const {
          data,
          error,
        } =
          await supabase.auth
            .signUp(
              credentials,
            );

        if (error) {
          throw error;
        }

        if (
          data.session
        ) {
          showMessage(
            'Konto utworzone',
            'Konto zostało utworzone i zalogowano Cię do HomeVault.',
          );

          return;
        }

        showMessage(
          'Sprawdź pocztę',
          'Konto zostało utworzone. Otwórz wiadomość od HomeVault i potwierdź adres e-mail.',
        );
      } catch (error) {
        console.error(
          'Błąd rejestracji:',
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Nie udało się utworzyć konta.';

        showMessage(
          'Rejestracja nieudana',
          message,
        );
      } finally {
        setIsLoading(false);
      }
    };

  const handleGoogleSignIn =
    async () => {
      try {
        setIsGoogleLoading(
          true,
        );

        await signInWithGoogle();
      } catch (error) {
        console.error(
          'Błąd Google OAuth:',
          error,
        );

        const message =
          error instanceof Error
            ? error.message
            : 'Nie udało się zalogować przez Google.';

        showMessage(
          'Google',
          message,
        );
      } finally {
        setIsGoogleLoading(
          false,
        );
      }
    };

  const isBusy =
    isLoading ||
    isGoogleLoading;

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <KeyboardAvoidingView
        style={
          styles.keyboardView
        }
        behavior={
          Platform.OS ===
          'ios'
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
              styles.header
            }
          >
            <Text
              style={
                styles.logoIcon
              }
            >
              🏠
            </Text>

            <Text
              style={
                styles.logo
              }
            >
              HomeVault
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Twoja cyfrowa
              dokumentacja domu
            </Text>
          </View>

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
              Zaloguj się
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Uzyskaj dostęp do
              swoich domów,
              pomieszczeń,
              dokumentacji
              i zdjęć.
            </Text>

            <Pressable
              disabled={
                isBusy
              }
              onPress={
                handleGoogleSignIn
              }
              style={({
                pressed,
              }) => [
                styles.googleButton,

                pressed &&
                  styles.pressed,

                isBusy &&
                  styles.disabled,
              ]}
            >
              {isGoogleLoading ? (
                <ActivityIndicator />
              ) : (
                <>
                  <View
                    style={
                      styles.googleIcon
                    }
                  >
                    <Text
                      style={
                        styles.googleIconText
                      }
                    >
                      G
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.googleButtonText
                    }
                  >
                    Kontynuuj z Google
                  </Text>
                </>
              )}
            </Pressable>

            <View
              style={
                styles.dividerRow
              }
            >
              <View
                style={
                  styles.divider
                }
              />

              <Text
                style={
                  styles.dividerText
                }
              >
                lub
              </Text>

              <View
                style={
                  styles.divider
                }
              />
            </View>

            <Text
              style={
                styles.label
              }
            >
              E-mail
            </Text>

            <TextInput
              value={email}
              onChangeText={
                setEmail
              }
              placeholder="twoj@email.pl"
              autoCapitalize="none"
              autoCorrect={
                false
              }
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={
                !isBusy
              }
              style={
                styles.input
              }
            />

            <Text
              style={[
                styles.label,
                styles.passwordLabel,
              ]}
            >
              Hasło
            </Text>

            <TextInput
              value={
                password
              }
              onChangeText={
                setPassword
              }
              placeholder="••••••••"
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              editable={
                !isBusy
              }
              style={
                styles.input
              }
            />

            <Pressable
              disabled={
                isBusy
              }
              onPress={
                handleSignIn
              }
              style={({
                pressed,
              }) => [
                styles.primaryButton,

                pressed &&
                  styles.pressed,

                isBusy &&
                  styles.disabled,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Zaloguj się
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={
                isBusy
              }
              onPress={
                handleRegister
              }
              style={({
                pressed,
              }) => [
                styles.registerButton,

                pressed &&
                  styles.pressed,

                isBusy &&
                  styles.disabled,
              ]}
            >
              <Text
                style={
                  styles.registerButtonText
                }
              >
                Utwórz konto
              </Text>
            </Pressable>
          </View>

          <Text
            style={
              styles.footer
            }
          >
            HomeVault
            zabezpiecza dane
            każdego użytkownika
            oddzielnie.
          </Text>
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

    keyboardView: {
      flex: 1,
    },

    content: {
      flexGrow: 1,
      justifyContent:
        'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },

    header: {
      alignItems: 'center',
      marginBottom: 30,
    },

    logoIcon: {
      fontSize: 50,
    },

    logo: {
      marginTop: 12,
      fontSize: 34,
      fontWeight: '800',
      color: '#111827',
    },

    subtitle: {
      marginTop: 7,
      fontSize: 15,
      color: '#6B7280',
      textAlign: 'center',
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
      fontSize: 26,
      fontWeight: '700',
      color: '#111827',
    },

    description: {
      marginTop: 8,
      marginBottom: 22,
      fontSize: 14,
      lineHeight: 21,
      color: '#6B7280',
    },

    googleButton: {
      minHeight: 52,
      borderWidth: 1,
      borderColor:
        '#D1D5DB',
      borderRadius: 12,
      backgroundColor:
        '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 16,
      gap: 12,
    },

    googleIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#E5E7EB',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    googleIconText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#4285F4',
    },

    googleButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#111827',
    },

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 22,
    },

    divider: {
      flex: 1,
      height: 1,
      backgroundColor:
        '#E5E7EB',
    },

    dividerText: {
      marginHorizontal: 12,
      fontSize: 13,
      color: '#9CA3AF',
    },

    label: {
      marginBottom: 7,
      fontSize: 14,
      fontWeight: '600',
      color: '#374151',
    },

    passwordLabel: {
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

    registerButton: {
      minHeight: 48,
      marginTop: 12,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    registerButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#374151',
    },

    pressed: {
      opacity: 0.72,
    },

    disabled: {
      opacity: 0.55,
    },

    footer: {
      maxWidth: 440,
      alignSelf: 'center',
      marginTop: 24,
      textAlign: 'center',
      color: '#9CA3AF',
      fontSize: 12,
      lineHeight: 18,
    },
  });