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

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const suffix = randomUUID()
  .replaceAll('-', '')
  .slice(0, 10);

function createPublicClient() {
  return createClient(
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
}

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

  return text
    ? JSON.parse(text)
    : null;
}

async function createUser(
  label,
) {
  const email =
    `homevault-${label}-${suffix}@example.com`;

  const password =
    `Hv!${randomUUID()}Aa1`;

  const {
    data,
    error,
  } =
    await admin.auth.admin
      .createUser({
        email,
        password,
        email_confirm: true,
      });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(
      `Nie utworzono użytkownika ${label}`,
    );
  }

  const client =
    createPublicClient();

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
      `Brak tokenu użytkownika ${label}`,
    );
  }

  return {
    id: data.user.id,
    email,
    token,
  };
}

async function createTestData(
  label,
  token,
) {
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
            `${label} HOUSE ${suffix}`,
          address:
            `${label} Testowa 1`,
          yearBuilt: 2026,
        }),
      },
    );

  const room =
    await apiJson(
      `/properties/${property.id}/rooms`,
      {
        method: 'POST',
        headers:
          authHeaders(
            token,
            true,
          ),
        body: JSON.stringify({
          name:
            `${label} Room`,
          floor: '0',
          description:
            `Isolation test ${label}`,
        }),
      },
    );

  const entry =
    await apiJson(
      `/rooms/${room.id}/entries`,
      {
        method: 'POST',
        headers:
          authHeaders(
            token,
            true,
          ),
        body: JSON.stringify({
          title:
            `${label} Entry`,
          description:
            `Isolation test ${label}`,
          category: 'NOTE',
        }),
      },
    );

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

  const bytes =
    Buffer.from(
      pngBase64,
      'base64',
    );

  const formData =
    new FormData();

  formData.append(
    'file',
    new Blob(
      [bytes],
      {
        type: 'image/png',
      },
    ),
    `${label.toLowerCase()}-test.png`,
  );

  const uploadResponse =
    await fetch(
      `${API_URL}/entries/${entry.id}/attachments`,
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
      `Upload ${label} -> HTTP ${uploadResponse.status}: ${uploadText}`,
    );
  }

  const attachment =
    JSON.parse(
      uploadText,
    );

  const result =
    await pool.query(
      `SELECT "storagePath"
       FROM "Attachment"
       WHERE "id" = $1`,
      [
        attachment.id,
      ],
    );

  if (
    result.rows.length !==
    1
  ) {
    throw new Error(
      `Brak Attachment ${label} w DB`,
    );
  }

  return {
    propertyId:
      property.id,
    roomId:
      room.id,
    entryId:
      entry.id,
    attachmentId:
      attachment.id,
    storagePath:
      result.rows[0]
        .storagePath,
  };
}

async function countById(
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

  return result.rows[0]
    .count;
}

async function assertCount(
  label,
  table,
  id,
  expected,
) {
  const count =
    await countById(
      table,
      id,
    );

  console.log(
    `   ${label} ${table}: ${count}`,
  );

  if (
    count !== expected
  ) {
    throw new Error(
      `${label} ${table}: oczekiwano ${expected}, otrzymano ${count}`,
    );
  }
}

async function assertStorageExists(
  label,
  storagePath,
  expected,
) {
  const {
    data,
    error,
  } =
    await admin.storage
      .from(
        STORAGE_BUCKET,
      )
      .download(
        storagePath,
      );

  const exists =
    !error &&
    Boolean(data);

  console.log(
    `   ${label} Storage: ${
      exists
        ? 'istnieje'
        : 'brak'
    }`,
  );

  if (
    exists !== expected
  ) {
    throw new Error(
      `${label} Storage: oczekiwano exists=${expected}`,
    );
  }
}

async function deleteViaApi(
  token,
) {
  const response =
    await fetch(
      `${API_URL}/account`,
      {
        method: 'DELETE',
        headers:
          authHeaders(token),
      },
    );

  const body =
    await response.text();

  if (!response.ok) {
    throw new Error(
      `DELETE /account -> HTTP ${response.status}: ${body}`,
    );
  }

  return body;
}

async function cleanupUser(
  user,
  data,
) {
  if (!user) {
    return;
  }

  try {
    if (user.token) {
      await deleteViaApi(
        user.token,
      );

      return;
    }
  } catch {
    // fallback poniżej
  }

  try {
    if (
      data?.storagePath
    ) {
      await admin.storage
        .from(
          STORAGE_BUCKET,
        )
        .remove([
          data.storagePath,
        ]);
    }
  } catch {
    // ignorujemy
  }

  try {
    if (
      data?.attachmentId
    ) {
      await pool.query(
        `DELETE FROM "Attachment"
         WHERE "id" = $1`,
        [
          data.attachmentId,
        ],
      );
    }

    if (
      data?.entryId
    ) {
      await pool.query(
        `DELETE FROM "Entry"
         WHERE "id" = $1`,
        [
          data.entryId,
        ],
      );
    }

    if (
      data?.roomId
    ) {
      await pool.query(
        `DELETE FROM "Room"
         WHERE "id" = $1`,
        [
          data.roomId,
        ],
      );
    }

    if (
      data?.propertyId
    ) {
      await pool.query(
        `DELETE FROM "Property"
         WHERE "id" = $1`,
        [
          data.propertyId,
        ],
      );
    }
  } catch {
    // ignorujemy
  }

  try {
    await admin.auth.admin
      .deleteUser(
        user.id,
      );
  } catch {
    // ignorujemy
  }
}

let userA = null;
let userB = null;

let dataA = null;
let dataB = null;

try {
  console.log(
    '1. Tworzę użytkownika A...',
  );

  userA =
    await createUser(
      'user-a',
    );

  console.log(
    '   A OK',
  );

  console.log(
    '2. Tworzę użytkownika B...',
  );

  userB =
    await createUser(
      'user-b',
    );

  console.log(
    '   B OK',
  );

  console.log('');
  console.log(
    '3. Tworzę dane A...',
  );

  dataA =
    await createTestData(
      'A',
      userA.token,
    );

  console.log(
    '   Dane A OK',
  );

  console.log(
    '4. Tworzę dane B...',
  );

  dataB =
    await createTestData(
      'B',
      userB.token,
    );

  console.log(
    '   Dane B OK',
  );

  console.log('');
  console.log(
    '5. Stan PRZED usunięciem A:',
  );

  await assertCount(
    'A',
    'Property',
    dataA.propertyId,
    1,
  );

  await assertCount(
    'B',
    'Property',
    dataB.propertyId,
    1,
  );

  await assertStorageExists(
    'A',
    dataA.storagePath,
    true,
  );

  await assertStorageExists(
    'B',
    dataB.storagePath,
    true,
  );

  console.log('');
  console.log(
    '6. Usuwam konto A...',
  );

  const deleteResult =
    await deleteViaApi(
      userA.token,
    );

  console.log(
    `   ${deleteResult}`,
  );

  console.log('');
  console.log(
    '7. Sprawdzam dane A...',
  );

  await assertCount(
    'A',
    'Property',
    dataA.propertyId,
    0,
  );

  await assertCount(
    'A',
    'Room',
    dataA.roomId,
    0,
  );

  await assertCount(
    'A',
    'Entry',
    dataA.entryId,
    0,
  );

  await assertCount(
    'A',
    'Attachment',
    dataA.attachmentId,
    0,
  );

  await assertStorageExists(
    'A',
    dataA.storagePath,
    false,
  );

  console.log('');
  console.log(
    '8. Sprawdzam, czy B NIE został naruszony...',
  );

  await assertCount(
    'B',
    'Property',
    dataB.propertyId,
    1,
  );

  await assertCount(
    'B',
    'Room',
    dataB.roomId,
    1,
  );

  await assertCount(
    'B',
    'Entry',
    dataB.entryId,
    1,
  );

  await assertCount(
    'B',
    'Attachment',
    dataB.attachmentId,
    1,
  );

  await assertStorageExists(
    'B',
    dataB.storagePath,
    true,
  );

  console.log('');
  console.log(
    '9. Sprawdzam dostęp B przez API...',
  );

  const propertiesB =
    await apiJson(
      '/properties',
      {
        method: 'GET',
        headers:
          authHeaders(
            userB.token,
          ),
      },
    );

  const hasPropertyB =
    propertiesB.some(
      (property) =>
        property.id ===
        dataB.propertyId,
    );

  if (!hasPropertyB) {
    throw new Error(
      'Użytkownik B nie widzi własnego Property.',
    );
  }

  console.log(
    '   B nadal widzi własne dane ✅',
  );

  console.log('');
  console.log(
    '10. Sprawdzam Supabase Auth...',
  );

  const {
    data: authA,
    error: authAError,
  } =
    await admin.auth.admin
      .getUserById(
        userA.id,
      );

  if (
    !authAError &&
    authA.user
  ) {
    throw new Error(
      'Użytkownik A nadal istnieje.',
    );
  }

  const {
    data: authB,
    error: authBError,
  } =
    await admin.auth.admin
      .getUserById(
        userB.id,
      );

  if (
    authBError ||
    !authB.user
  ) {
    throw new Error(
      'Użytkownik B został usunięty lub uszkodzony.',
    );
  }

  console.log(
    '   A usunięty ✅',
  );

  console.log(
    '   B nadal istnieje ✅',
  );

  /*
   * A już poprawnie usunięty.
   */
  userA = null;
  dataA = null;

  console.log('');
  console.log(
    '11. Sprzątam konto B...',
  );

  await deleteViaApi(
    userB.token,
  );

  userB = null;
  dataB = null;

  console.log(
    '   B usunięty po teście ✅',
  );

  console.log('');
  console.log(
    '=======================================',
  );

  console.log(
    'TEST IZOLACJI ZAKOŃCZONY SUKCESEM ✅',
  );

  console.log(
    '=======================================',
  );
} catch (error) {
  console.error('');
  console.error(
    'TEST IZOLACJI NIEUDANY ❌',
  );

  console.error(error);

  await cleanupUser(
    userA,
    dataA,
  );

  await cleanupUser(
    userB,
    dataB,
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}