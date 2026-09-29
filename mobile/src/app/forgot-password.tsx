import { router } from 'expo-router';

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
  supabase,
} from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const [
    email,
    setEmail,
  ] = useState('');

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isSent,
    setIsSent,
  ] = useState(false);

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

  const handleReset = async () => {
    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    if (!normalizedEmail) {
      showMessage(
        'Brak adresu e-mail',
        'Podaj adres e-mail.',
      );

      return;
    }

    try {
      setIsLoading(true);

      const redirectTo =
        Platform.OS === 'web' &&
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/reset-password`
          : 'homevault://auth/reset-password';

      const {
        error,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            normalizedEmail,
            {
              redirectTo,
            },
          );

      if (error) {
        throw error;
      }

      setIsSent(true);
    } catch (error) {
      console.error(
        'Błąd resetowania hasła:',
        error,
      );

      showMessage(
        'Nie udało się wysłać wiadomości',
        error instanceof Error
          ? error.message
          : 'Spróbuj ponownie później.',
      );
    } finally {
      setIsLoading(false);
    }
  };

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
              Reset hasła
            </Text>

            {!isSent ? (
              <>
                <Text
                  style={
                    styles.description
                  }
                >
                  Podaj adres e-mail
                  przypisany do konta
                  HomeVault. Wyślemy link
                  umożliwiający ustawienie
                  nowego hasła.
                </Text>

                <Text style={styles.label}>
                  E-mail
                </Text>

                <TextInput
                  value={email}
                  onChangeText={
                    setEmail
                  }
                  placeholder="twoj@email.pl"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  editable={!isLoading}
                  style={styles.input}
                />

                <Pressable
                  disabled={isLoading}
                  onPress={
                    handleReset
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.primaryButton,

                    pressed &&
                      styles.pressed,

                    isLoading &&
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
                      Wyślij link
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.successTitle
                  }
                >
                  Sprawdź pocztę
                </Text>

                <Text
                  style={
                    styles.description
                  }
                >
                  Jeśli konto z tym
                  adresem istnieje,
                  otrzymasz wiadomość
                  z linkiem do ustawienia
                  nowego hasła.
                </Text>
              </>
            )}

            <Pressable
              disabled={isLoading}
              onPress={() =>
                router.replace(
                  '/login',
                )
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
                Wróć do logowania
              </Text>
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

    successTitle: {
      marginTop: 24,
      fontSize: 21,
      fontWeight: '700',
      color: '#111827',
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

    secondaryButton: {
      minHeight: 48,
      marginTop: 12,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    secondaryButtonText: {
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
  });