import {
  createClient,
} from '@supabase/supabase-js';

import {
  randomUUID,
} from 'node:crypto';

const {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
} = process.env;

if (!SUPABASE_URL) {
  throw new Error(
    'Brak SUPABASE_URL',
  );
}

if (!SUPABASE_SECRET_KEY) {
  throw new Error(
    'Brak SUPABASE_SECRET_KEY',
  );
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Brak SUPABASE_PUBLISHABLE_KEY',
  );
}

const admin =
  createClient(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

const client =
  createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    },
  );

const suffix =
  randomUUID()
    .replaceAll('-', '')
    .slice(0, 12);

const email =
  `homevault-delete-test-${suffix}@example.com`;

const password =
  `Hv!${randomUUID()}Aa1`;

let userId = null;

try {
  console.log(
    '1. Tworzę użytkownika testowego...',
  );

  const {
    data: createData,
    error: createError,
  } =
    await admin.auth.admin
      .createUser({
        email,
        password,
        email_confirm: true,
      });

  if (createError) {
    throw createError;
  }

  if (!createData.user) {
    throw new Error(
      'Supabase nie zwrócił użytkownika.',
    );
  }

  userId =
    createData.user.id;

  console.log(
    '   OK - użytkownik utworzony',
  );

  console.log(
    '2. Loguję użytkownika...',
  );

  const {
    data: loginData,
    error: loginError,
  } =
    await client.auth
      .signInWithPassword({
        email,
        password,
      });

  if (loginError) {
    throw loginError;
  }

  const accessToken =
    loginData.session
      ?.access_token;

  if (!accessToken) {
    throw new Error(
      'Brak access tokenu.',
    );
  }

  console.log(
    '   OK - sesja utworzona',
  );

  console.log(
    '3. Wywołuję DELETE /account...',
  );

  const response =
    await fetch(
      'http://localhost:3000/account',
      {
        method: 'DELETE',

        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
      },
    );

  const body =
    await response.text();

  console.log(
    `   HTTP ${response.status}`,
  );

  console.log(
    `   Response: ${body}`,
  );

  if (!response.ok) {
    throw new Error(
      `DELETE /account zwrócił HTTP ${response.status}`,
    );
  }

  console.log(
    '4. Sprawdzam Supabase Auth...',
  );

  const {
    data: verificationData,
    error: verificationError,
  } =
    await admin.auth.admin
      .getUserById(
        userId,
      );

  if (
    !verificationError &&
    verificationData.user
  ) {
    throw new Error(
      'Użytkownik nadal istnieje w Supabase Auth.',
    );
  }

  console.log('');
  console.log(
    'TEST ZAKOŃCZONY SUKCESEM ✅',
  );

  console.log(
    'Konto testowe zostało usunięte.',
  );

  userId = null;
} catch (error) {
  console.error('');
  console.error(
    'TEST NIEUDANY ❌',
  );

  console.error(
    error,
  );

  /*
   * Sprzątanie po nieudanym teście.
   * Nie wypisujemy żadnych tokenów
   * ani kluczy.
   */
  if (userId) {
    console.log(
      'Sprzątam konto testowe...',
    );

    await admin.auth.admin
      .deleteUser(
        userId,
      )
      .catch(() => undefined);
  }

  process.exitCode = 1;
}