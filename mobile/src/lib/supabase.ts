import 'react-native-url-polyfill/auto';

import {
  AppState,
  Platform,
} from 'react-native';

import AsyncStorage from
  '@react-native-async-storage/async-storage';

import {
  createClient,
} from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL;

const supabasePublishableKey =
  process.env
    .EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Brak EXPO_PUBLIC_SUPABASE_URL',
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    'Brak EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );
}

export const supabase =
  createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      auth: {
        /*
         * Android / iOS:
         * trwała sesja w AsyncStorage.
         *
         * Web:
         * Supabase użyje browserowego
         * localStorage dopiero po stronie
         * przeglądarki.
         */
        ...(Platform.OS !== 'web'
          ? {
              storage:
                AsyncStorage,
            }
          : {}),

        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    },
  );

/*
 * Na urządzeniach mobilnych
 * odświeżamy token tylko wtedy,
 * gdy aplikacja jest aktywna.
 */
if (
  Platform.OS !== 'web'
) {
  AppState.addEventListener(
    'change',
    (state) => {
      if (
        state === 'active'
      ) {
        supabase.auth
          .startAutoRefresh();
      } else {
        supabase.auth
          .stopAutoRefresh();
      }
    },
  );
}