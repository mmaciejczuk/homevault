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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

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

  const validate = () => {
    if (!email.trim()) {
      showMessage(
        'Brak adresu e-mail',
        'Podaj adres e-mail.',
      );

      return false;
    }

    if (password.length < 6) {
      showMessage(
        'Hasło',
        'Hasło musi mieć co najmniej 6 znaków.',
      );

      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      router.replace('/');
    } catch (error) {
      console.error(
        'Błąd logowania:',
        error,
      );

      showMessage(
        'Nie udało się zalogować',
        error instanceof Error
          ? error.message
          : 'Nieznany błąd.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    try {
      setIsLoading(true);

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.session) {
        showMessage(
          'Konto utworzone',
          'Sprawdź skrzynkę e-mail i potwierdź konto.',
        );

        return;
      }

      router.replace('/');
    } catch (error) {
      console.error(
        'Błąd rejestracji:',
        error,
      );

      showMessage(
        'Nie udało się utworzyć konta',
        error instanceof Error
          ? error.message
          : 'Nieznany błąd.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.card}>
          <Text style={styles.logo}>
            🏠
          </Text>

          <Text style={styles.title}>
            HomeVault
          </Text>

          <Text style={styles.subtitle}>
            Twoja cyfrowa dokumentacja domu
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="E-mail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Hasło"
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
          />

          <Pressable
            disabled={isLoading}
            onPress={handleLogin}
            style={({ pressed }) => [
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
                Zaloguj się
              </Text>
            )}
          </Pressable>

          <Pressable
            disabled={isLoading}
            onPress={handleRegister}
            style={({ pressed }) => [
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
              Utwórz konto
            </Text>
          </Pressable>

          <View style={styles.divider}>
            <View
              style={styles.dividerLine}
            />

            <Text
              style={styles.dividerText}
            >
              wkrótce
            </Text>

            <View
              style={styles.dividerLine}
            />
          </View>

          <View style={styles.socialRow}>
            <View
              style={styles.socialDisabled}
            >
              <Text>
                Google
              </Text>
            </View>

            <View
              style={styles.socialDisabled}
            >
              <Text>
                Facebook
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  keyboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  logo: {
    fontSize: 48,
    textAlign: 'center',
  },

  title: {
    marginTop: 12,
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },

  subtitle: {
    marginTop: 6,
    marginBottom: 28,
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
  },

  input: {
    height: 52,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },

  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  secondaryButton: {
    minHeight: 52,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  secondaryButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },

  divider: {
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  dividerText: {
    paddingHorizontal: 12,
    color: '#9CA3AF',
    fontSize: 12,
  },

  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },

  socialDisabled: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },
});