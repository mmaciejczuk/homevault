import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

function getOAuthParams(url: string) {
  const queryPart =
    url.includes('?')
      ? url.split('?')[1].split('#')[0]
      : '';

  const hashPart =
    url.includes('#')
      ? url.split('#')[1]
      : '';

  const combined =
    [queryPart, hashPart]
      .filter(Boolean)
      .join('&');

  return new URLSearchParams(combined);
}

async function createSessionFromUrl(
  url: string,
) {
  const params =
    getOAuthParams(url);

  const error =
    params.get('error_description') ??
    params.get('error');

  if (error) {
    throw new Error(error);
  }

  /*
   * PKCE flow
   */
  const code =
    params.get('code');

  if (code) {
    const {
      error: exchangeError,
    } =
      await supabase.auth
        .exchangeCodeForSession(
          code,
        );

    if (exchangeError) {
      throw exchangeError;
    }

    return;
  }

  /*
   * Implicit OAuth flow
   */
  const accessToken =
    params.get(
      'access_token',
    );

  const refreshToken =
    params.get(
      'refresh_token',
    );

  if (
    accessToken &&
    refreshToken
  ) {
    const {
      error: sessionError,
    } =
      await supabase.auth
        .setSession({
          access_token:
            accessToken,

          refresh_token:
            refreshToken,
        });

    if (sessionError) {
      throw sessionError;
    }

    return;
  }

  throw new Error(
    'Callback OAuth nie zawiera tokenu ani kodu autoryzacyjnego.',
  );
}

export default function AuthCallbackScreen() {
  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let active = true;

    const finishLogin =
      async () => {
        try {
          /*
           * Najpierw obserwujemy sesję.
           *
           * Przy normalnym powrocie z
           * openAuthSessionAsync()
           * googleAuth.ts może już
           * utworzyć sesję.
           */
          const {
            data: {
              session,
            },
          } =
            await supabase.auth
              .getSession();

          if (session) {
            router.replace('/');
            return;
          }

          /*
           * Obsługa sytuacji,
           * gdy aplikacja została
           * uruchomiona bezpośrednio
           * przez callback OAuth.
           */
          const initialUrl =
            await Linking
              .getInitialURL();

          if (
            initialUrl &&
            initialUrl.startsWith(
              'homevault://auth/callback',
            )
          ) {
            await createSessionFromUrl(
              initialUrl,
            );

            if (active) {
              router.replace('/');
            }
          }
        } catch (err) {
          console.error(
            'Błąd callback OAuth:',
            err,
          );

          if (!active) {
            return;
          }

          setError(
            err instanceof Error
              ? err.message
              : 'Nie udało się zakończyć logowania.',
          );
        }
      };

    /*
     * Przy zwykłym powrocie
     * z przeglądarki googleAuth.ts
     * wykona setSession().
     *
     * AuthCallback czeka wtedy
     * na pojawienie się sesji.
     */
    const {
      data: {
        subscription,
      },
    } =
      supabase.auth
        .onAuthStateChange(
          (
            _event,
            session,
          ) => {
            if (
              active &&
              session
            ) {
              router.replace('/');
            }
          },
        );

    finishLogin();

    return () => {
      active = false;

      subscription.unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <View
        style={
          styles.container
        }
      >
        <Text
          style={
            styles.errorTitle
          }
        >
          Logowanie nieudane
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <Pressable
          onPress={() =>
            router.replace(
              '/login',
            )
          }
          style={
            styles.button
          }
        >
          <Text
            style={
              styles.buttonText
            }
          >
            Wróć do logowania
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      <ActivityIndicator
        size="large"
      />

      <Text
        style={
          styles.text
        }
      >
        Kończenie logowania
        przez Google...
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        '#F7F8FA',
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 24,
    },

    text: {
      marginTop: 16,
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },

    errorTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#111827',
      textAlign: 'center',
    },

    errorText: {
      marginTop: 12,
      fontSize: 15,
      lineHeight: 22,
      color: '#6B7280',
      textAlign: 'center',
    },

    button: {
      marginTop: 24,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor:
        '#111827',
    },

    buttonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });