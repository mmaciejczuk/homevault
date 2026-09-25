import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const MOBILE_REDIRECT_URL =
  'homevault://auth/callback';

function getTokensFromUrl(url: string) {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');

  const rawParams =
    hashIndex >= 0
      ? url.substring(hashIndex + 1)
      : queryIndex >= 0
        ? url.substring(queryIndex + 1)
        : '';

  const params =
    new URLSearchParams(rawParams);

  return {
    accessToken:
      params.get('access_token'),

    refreshToken:
      params.get('refresh_token'),

    error:
      params.get('error_description') ??
      params.get('error'),
  };
}

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const redirectTo =
      typeof window !== 'undefined'
        ? window.location.origin
        : undefined;

    const {
      error,
    } =
      await supabase.auth.signInWithOAuth({
        provider: 'google',

        options: {
          redirectTo,
        },
      });

    if (error) {
      throw error;
    }

    return;
  }

  const {
    data,
    error,
  } =
    await supabase.auth.signInWithOAuth({
      provider: 'google',

      options: {
        redirectTo:
          MOBILE_REDIRECT_URL,

        skipBrowserRedirect:
          true,
      },
    });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error(
      'Supabase nie zwrócił adresu OAuth.',
    );
  }

  const result =
    await WebBrowser.openAuthSessionAsync(
      data.url,
      MOBILE_REDIRECT_URL,
    );

  if (result.type === 'cancel') {
    return;
  }

  if (result.type !== 'success') {
    throw new Error(
      `Logowanie Google zakończyło się statusem: ${result.type}`,
    );
  }

  const {
    accessToken,
    refreshToken,
    error: oauthError,
  } =
    getTokensFromUrl(
      result.url,
    );

  if (oauthError) {
    throw new Error(
      oauthError,
    );
  }

  if (
    !accessToken ||
    !refreshToken
  ) {
    throw new Error(
      'Google nie zwrócił kompletnej sesji Supabase.',
    );
  }

  const {
    error: sessionError,
  } =
    await supabase.auth.setSession({
      access_token:
        accessToken,

      refresh_token:
        refreshToken,
    });

  if (sessionError) {
    throw sessionError;
  }
}