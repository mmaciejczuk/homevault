import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

const API_URL = 'http://localhost:3000';
const STORAGE_BUCKET = 'entry-attachments';

const {
  DATABASE_URL,
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_PUBLISHABLE_KEY,
} = process.env;

if (!DATABASE_URL) {
  throw new Error('Brak DATABASE_URL');
}

if (!SUPABASE_URL) {
  throw new Error('Brak SUPABASE_URL');
}

if (!SUPABASE_SECRET_KEY) {
  throw new Error('Brak SUPABASE_SECRET_KEY');
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Brak SUPABASE_PUBLISHABLE_KEY',
  );
}

const admin = createClient(
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

const client = createClient(
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

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const suffix = randomUUID()
  .replaceAll('-', '')
  .slice(0, 12);

const email =
  `homevault-delete-full-${suffix}@example.com`;

const password =
  `Hv!${randomUUID()}Aa1`;

let userId = null;
let propertyId = null;
let roomId = null;
let entryId = null;
let attachmentId = null;
let storagePath = null;

function authHeaders(
  token,
  json = false,
) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  if (json) {
    headers['Content-Type'] =
      'application/json';
  }

  return headers;
}

async function apiJson(
  path,
  options,
) {
  const response = await fetch(
    `${API_URL}${path}`,
    options,
  );

  const text =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `${options.method ?? 'GET'} ${path} -> HTTP ${response.status}: ${text}`,
    );
  }

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function getCount(
  table,
  id,
) {
  const result =
    await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM "${table}"
       WHERE "id" = $1`,
      [id],
    );

  return result.rows[0].count;
}

async function assertCount(
  table,
  id,
  expected,
) {
  const count =
    await getCount(
      table,
      id,
    );

  console.log(
    `   ${table}: ${count}`,
  );

  if (count !== expected) {
    throw new Error(
      `${table} id=${id}: oczekiwano ${expected}, otrzymano ${count}`,
    );
  }
}

async function cleanup() {
  console.log('');
  console.log(
    'Sprzątanie po teście...',
  );

  try {
    if (storagePath) {
      await admin.storage
        .from(STORAGE_BUCKET)
        .remove([
          storagePath,
        ]);
    }
  } catch {
    // ignorujemy
  }

  try {
    if (attachmentId) {
      await pool.query(
        `DELETE FROM "Attachment"
         WHERE "id" = $1`,
        [attachmentId],
      );
    }

    if (entryId) {
      await pool.query(
        `DELETE FROM "Entry"
         WHERE "id" = $1`,
        [entryId],
      );
    }

    if (roomId) {
      await pool.query(
        `DELETE FROM "Room"
         WHERE "id" = $1`,
        [roomId],
      );
    }

    if (propertyId) {
      await pool.query(
        `DELETE FROM "Property"
         WHERE "id" = $1`,
        [propertyId],
      );
    }
  } catch {
    // ignorujemy
  }

  try {
    if (userId) {
      await admin.auth.admin
        .deleteUser(userId);
    }
  } catch {
    // ignorujemy
  }
}

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
      'Nie utworzono użytkownika.',
    );
  }

  userId =
    createData.user.id;

  console.log(
    '   OK',
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

  const token =
    loginData.session
      ?.access_token;

  if (!token) {
    throw new Error(
      'Brak access tokenu.',
    );
  }

  console.log(
    '   OK',
  );

  console.log(
    '3. Tworzę Property...',
  );

  const property =
    await apiJson(
      '/properties',
      {
        method: 'POST',
        headers:
          authHeaders(
            token,
            true,
          ),
        body: JSON.stringify({
          name:
            `DELETE TEST ${suffix}`,
          address:
            'Testowa 1',
          yearBuilt: 2026,
        }),
      },
    );

  propertyId =
    property.id;

  console.log(
    `   Property ID: ${propertyId}`,
  );

  console.log(
    '4. Tworzę Room...',
  );

  const room =
    await apiJson(
      `/properties/${propertyId}/rooms`,
      {
        method: 'POST',
        headers:
          authHeaders(
            token,
            true,
          ),
        body: JSON.stringify({
          name:
            'Pokój testowy',
          floor: '0',
          description:
            'DELETE ACCOUNT TEST',
        }),
      },
    );

  roomId =
    room.id;

  console.log(
    `   Room ID: ${roomId}`,
  );

  console.log(
    '5. Tworzę Entry...',
  );

  const entry =
    await apiJson(
      `/rooms/${roomId}/entries`,
      {
        method: 'POST',
        headers:
          authHeaders(
            token,
            true,
          ),
        body: JSON.stringify({
          title:
            'Test usuwania konta',
          description:
            'Rekord zostanie usunięty',
          category:
            'NOTE',
        }),
      },
    );

  entryId =
    entry.id;

  console.log(
    `   Entry ID: ${entryId}`,
  );

  console.log(
    '6. Wysyłam testowy PNG...',
  );

  /*
   * Minimalny poprawny PNG 1x1.
   */
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  const pngBytes =
    Buffer.from(
      pngBase64,
      'base64',
    );

  const formData =
    new FormData();

  formData.append(
    'file',
    new Blob(
      [pngBytes],
      {
        type: 'image/png',
      },
    ),
    'delete-test.png',
  );

  const uploadResponse =
    await fetch(
      `${API_URL}/entries/${entryId}/attachments`,
      {
        method: 'POST',
        headers:
          authHeaders(token),
        body: formData,
      },
    );

  const uploadText =
    await uploadResponse.text();

  if (!uploadResponse.ok) {
    throw new Error(
      `Upload -> HTTP ${uploadResponse.status}: ${uploadText}`,
    );
  }

  const uploaded =
    JSON.parse(uploadText);

  attachmentId =
    uploaded.id;

  console.log(
    `   Attachment ID: ${attachmentId}`,
  );

  /*
   * Pobieramy storagePath bezpośrednio
   * z DB — dzięki temu możemy potem
   * sprawdzić Storage niezależnie od API.
   */
  const attachmentResult =
    await pool.query(
      `SELECT "storagePath"
       FROM "Attachment"
       WHERE "id" = $1`,
      [attachmentId],
    );

  if (
    attachmentResult.rows.length !==
    1
  ) {
    throw new Error(
      'Nie znaleziono Attachment w DB.',
    );
  }

  storagePath =
    attachmentResult.rows[0]
      .storagePath;

  console.log(
    '   Storage path znaleziony',
  );

  console.log('');
  console.log(
    '7. Sprawdzam dane PRZED usunięciem...',
  );

  await assertCount(
    'Property',
    propertyId,
    1,
  );

  await assertCount(
    'Room',
    roomId,
    1,
  );

  await assertCount(
    'Entry',
    entryId,
    1,
  );

  await assertCount(
    'Attachment',
    attachmentId,
    1,
  );

  console.log('');
  console.log(
    '8. Wywołuję DELETE /account...',
  );

  const deleteResponse =
    await fetch(
      `${API_URL}/account`,
      {
        method: 'DELETE',
        headers:
          authHeaders(token),
      },
    );

  const deleteText =
    await deleteResponse.text();

  console.log(
    `   HTTP ${deleteResponse.status}`,
  );

  console.log(
    `   ${deleteText}`,
  );

  if (!deleteResponse.ok) {
    throw new Error(
      `DELETE /account -> HTTP ${deleteResponse.status}`,
    );
  }

  console.log('');
  console.log(
    '9. Sprawdzam PostgreSQL PO usunięciu...',
  );

  await assertCount(
    'Property',
    propertyId,
    0,
  );

  await assertCount(
    'Room',
    roomId,
    0,
  );

  await assertCount(
    'Entry',
    entryId,
    0,
  );

  await assertCount(
    'Attachment',
    attachmentId,
    0,
  );

  console.log('');
  console.log(
    '10. Sprawdzam Supabase Storage...',
  );

  const {
    data: storageData,
    error: storageError,
  } =
    await admin.storage
      .from(STORAGE_BUCKET)
      .download(storagePath);

  if (
    !storageError &&
    storageData
  ) {
    throw new Error(
      'Plik nadal istnieje w Storage.',
    );
  }

  console.log(
    '   Plik nie istnieje ✅',
  );

  console.log('');
  console.log(
    '11. Sprawdzam Supabase Auth...',
  );

  const {
    data: authData,
    error: authError,
  } =
    await admin.auth.admin
      .getUserById(userId);

  if (
    !authError &&
    authData.user
  ) {
    throw new Error(
      'Użytkownik nadal istnieje w Supabase Auth.',
    );
  }

  console.log(
    '   Użytkownik nie istnieje ✅',
  );

  /*
   * Endpoint wykonał pełne usunięcie.
   * Wyłączamy cleanup dla już
   * skasowanych danych.
   */
  userId = null;
  propertyId = null;
  roomId = null;
  entryId = null;
  attachmentId = null;
  storagePath = null;

  console.log('');
  console.log(
    '================================',
  );

  console.log(
    'PEŁNY TEST ZAKOŃCZONY SUKCESEM ✅',
  );

  console.log(
    '================================',
  );
} catch (error) {
  console.error('');
  console.error(
    'PEŁNY TEST NIEUDANY ❌',
  );

  console.error(error);

  await cleanup();

  process.exitCode = 1;
} finally {
  await pool.end();
}