import { supabase } from './supabase';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://homevault-production.up.railway.app';

export async function apiFetch(
  path: string,
  options: RequestInit = {},
) {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.access_token) {
    throw new Error(
      'Brak aktywnej sesji użytkownika.',
    );
  }

  const headers = new Headers(
    options.headers,
  );

  headers.set(
    'Authorization',
    `Bearer ${session.access_token}`,
  );

  return fetch(
    `${API_URL}${path}`,
    {
      ...options,
      headers,
    },
  );
}