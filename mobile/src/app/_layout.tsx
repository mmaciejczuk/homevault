import {
  ActivityIndicator,
  View,
} from 'react-native';

import {
  Stack,
} from 'expo-router';

import {
  AuthProvider,
  useAuth,
} from '../context/AuthContext';

function RootNavigator() {
  const {
    session,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent:
            'center',
          alignItems:
            'center',
        }}
      >
        <ActivityIndicator
          size="large"
        />
      </View>
    );
  }

  return (
    <Stack>
      {/*
       * Bez sesji pierwszym
       * dostępnym ekranem musi
       * być login.
       */}
      <Stack.Protected
        guard={!session}
      >
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="forgot-password"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>

      {/*
       * Po zalogowaniu pierwszym
       * dostępnym ekranem jest index.
       */}
      <Stack.Protected
        guard={!!session}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="account"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="create-property"
          options={{
            title: 'Dodaj dom',
            headerBackTitle:
              'Wróć',
          }}
        />

        <Stack.Screen
          name="property/[id]"
          options={{
            title: 'Dom',
          }}
        />

        <Stack.Screen
          name="property/[id]/rooms"
          options={{
            title:
              'Pomieszczenia',
          }}
        />

        <Stack.Screen
          name="property/[id]/create-room"
          options={{
            title:
              'Dodaj pomieszczenie',
          }}
        />

        <Stack.Screen
          name="room/[id]"
          options={{
            title:
              'Pomieszczenie',
          }}
        />

        <Stack.Screen
          name="room/[id]/create-entry"
          options={{
            title:
              'Dodaj wpis',
          }}
        />

        <Stack.Screen
          name="entry/[id]"
          options={{
            title: 'Wpis',
          }}
        />
      </Stack.Protected>

      {/*
       * Callbacki muszą być dostępne
       * niezależnie od sesji,
       * ale NIE mogą być pierwszymi
       * trasami w Stacku.
       */}
      <Stack.Screen
        name="auth/callback"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="auth/reset-password"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}