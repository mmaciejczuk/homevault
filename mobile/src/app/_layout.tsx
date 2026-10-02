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
      <Stack.Protected
        guard={!session}
      >
        <Stack.Screen
          name="login"
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="forgot-password"
          options={{
            title:
              'Reset hasła',
          }}
        />

        <Stack.Screen
          name="auth/reset-password"
          options={{
            title:
              'Nowe hasło',
          }}
        />

        <Stack.Screen
          name="auth/callback"
          options={{
            headerShown:
              false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected
        guard={!!session}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown:
              false,
          }}
        />

        <Stack.Screen
          name="account"
          options={{
            title:
              'Konto',
          }}
        />

        <Stack.Screen
          name="create-property"
          options={{
            title:
              'Dodaj dom',
          }}
        />

        <Stack.Screen
          name="property/[id]"
          options={{
            title:
              'Dom',
          }}
        />

        <Stack.Screen
          name="property/[id]/edit"
          options={{
            title:
              'Edytuj dom',
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
          name="room/[id]/edit"
          options={{
            title:
              'Edytuj pomieszczenie',
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
            title:
              'Wpis',
          }}
        />

        <Stack.Screen
          name="entry/[id]/edit"
          options={{
            title:
              'Edytuj wpis',
          }}
        />
      </Stack.Protected>
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