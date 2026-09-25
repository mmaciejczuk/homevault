# HomeVault

HomeVault to aplikacja mobilna i webowa do przechowywania cyfrowej dokumentacji domu.

Pozwala organizować informacje według struktury:

```text
Użytkownik
└── Dom
    └── Pomieszczenia
        └── Wpisy
            └── Zdjęcia / załączniki
```

Każdy użytkownik posiada własne dane. Dostęp do domów, pomieszczeń, wpisów oraz załączników jest zabezpieczony przy pomocy Supabase Auth oraz JWT.

---

# Przykładowe zastosowania

- dokumentacja instalacji elektrycznej,
- hydraulika,
- ogrzewanie,
- ściany i zabudowy,
- podłogi,
- urządzenia,
- zdjęcia instalacji przed zakryciem,
- notatki techniczne,
- dokumentacja remontowa i budowlana,
- dokumentacja techniczna domu dostępna z telefonu,
- przechowywanie zdjęć przypisanych do konkretnego pomieszczenia lub elementu domu.

---

# Stack

## Backend

- Node.js
- NestJS
- Prisma 7
- PostgreSQL
- Supabase
- Supabase Auth
- Supabase Storage
- `@prisma/adapter-pg`

## Frontend

- React Native
- Expo
- Expo Router
- TypeScript
- Supabase JS
- Expo Image Picker
- Expo File System
- Expo Web Browser

## Hosting

- API: Railway
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Storage: Supabase Storage
- Android builds: Expo EAS

---

# Struktura projektu

```text
homevault/
├── api/                     # NestJS API
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── auth/
│       ├── properties/
│       ├── rooms/
│       ├── entries/
│       ├── attachments/
│       ├── storage/
│       └── prisma/
│
├── mobile/                  # Expo / React Native
│   ├── src/
│   │   ├── app/
│   │   ├── context/
│   │   └── lib/
│   ├── app.json
│   └── eas.json
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

---

# Model danych

Aktualna struktura danych:

```text
Supabase User
     │
     │ ownerId
     ▼
Property
     │
     ▼
Room
     │
     ▼
Entry
     │
     ▼
Attachment
```

`Property.ownerId` przechowuje identyfikator użytkownika z Supabase Auth.

Relacje niższego poziomu są zabezpieczane przez właściciela nieruchomości:

```text
User
└── Property
    └── Room
        └── Entry
            └── Attachment
```

---

# Authentication

HomeVault korzysta z Supabase Auth.

Aktualnie obsługiwane:

- rejestracja e-mail + hasło,
- logowanie e-mail + hasło,
- trwała sesja użytkownika,
- automatyczne odświeżanie tokenu,
- JWT przekazywany do NestJS API,
- zabezpieczone endpointy backendu,
- izolacja danych pomiędzy użytkownikami.

Przygotowana jest również integracja:

- Google OAuth.

Docelowo możliwe będzie również dodanie:

- Facebook OAuth,
- Apple Sign In.

---

# Bezpieczeństwo danych

Każdy request do danych użytkownika wymaga:

```http
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

Backend:

1. pobiera JWT,
2. weryfikuje użytkownika przez Supabase Auth,
3. zapisuje użytkownika w `request.user`,
4. pobiera dane wyłącznie dla jego `user.id`.

Przykład:

```text
request.user.id
        │
        ▼
Property.ownerId
```

Użytkownik nie może odczytać danych innego użytkownika nawet po ręcznym podaniu ID zasobu.

Przykład:

```text
User A
└── Property 1
    └── Room 1
        └── Entry 1
            └── Attachment 1

User B
├── GET /properties/1
│   └── 404
├── GET /rooms/1
│   └── 404
├── GET /entries/1
│   └── 404
└── GET /entries/1/attachments
    └── 404
```

Zwracanie `404` zamiast `403` dodatkowo nie ujawnia, czy zasób należący do innego użytkownika istnieje.

Izolacja danych została przetestowana przy użyciu dwóch oddzielnych kont Supabase.

---

# Environment variables

## API

Plik lokalny:

```text
api/.env
```

Przykład:

```env
DATABASE_URL=postgresql://...

SUPABASE_URL=https://PROJECT.supabase.co

SUPABASE_PUBLISHABLE_KEY=...

SUPABASE_SECRET_KEY=...
```

Znaczenie:

```text
DATABASE_URL
→ połączenie Prisma / PostgreSQL

SUPABASE_URL
→ adres projektu Supabase

SUPABASE_PUBLISHABLE_KEY
→ weryfikacja użytkownika / Supabase Auth

SUPABASE_SECRET_KEY
→ operacje backendowe, np. prywatny Supabase Storage
```

Sekrety nie mogą być commitowane do Git.

---

## Mobile

Lokalny plik:

```text
mobile/.env.local
```

Przykład:

```env
EXPO_PUBLIC_API_URL=https://homevault-production.up.railway.app

EXPO_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co

EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Do aplikacji mobilnej **nie wolno** przekazywać:

```text
SUPABASE_SECRET_KEY
```

Mobile korzysta wyłącznie z klucza publicznego / publishable key.

`.env.local` nie jest przechowywany w repozytorium.

---

# Uruchamianie projektu

## Lokalny development

Z katalogu głównego:

```powershell
cd C:\Code\homevault
npm.cmd run dev
```

Uruchamia jednocześnie:

```text
API     → http://localhost:3000
Mobile  → Expo / Metro
```

---

## Mobile z produkcyjnym API

```powershell
cd C:\Code\homevault
npm.cmd run prod
```

Mobile korzysta wtedy z:

```text
https://homevault-production.up.railway.app
```

bez konieczności uruchamiania lokalnego backendu.

---

# Uruchamianie pojedynczych projektów

## API

```powershell
cd C:\Code\homevault\api
npm.cmd run dev
```

API:

```text
http://localhost:3000
```

---

## Expo / Mobile

```powershell
cd C:\Code\homevault\mobile
npm.cmd run dev
```

Można również uruchomić Expo bezpośrednio:

```powershell
npx.cmd expo start --tunnel --clear
```

Po uruchomieniu Expo można nacisnąć:

```text
w
```

aby otworzyć wersję webową.

Web:

```powershell
npm.cmd run web
```

Android:

```powershell
npm.cmd run android
```

---

# API

Wszystkie poniższe endpointy danych wymagają poprawnego tokenu użytkownika.

## Auth

```http
GET /auth/me
```

Przykładowa odpowiedź:

```json
{
  "id": "supabase-user-id",
  "email": "user@example.com"
}
```

Bez tokenu:

```http
401 Unauthorized
```

---

## Properties

```http
GET /properties
POST /properties
GET /properties/:id
```

`POST /properties` automatycznie przypisuje:

```text
ownerId = request.user.id
```

Klient nie przekazuje `ownerId`.

---

## Rooms

```http
GET /properties/:propertyId/rooms
POST /properties/:propertyId/rooms
GET /rooms/:id
```

Backend sprawdza, czy `Property.ownerId` odpowiada aktualnie zalogowanemu użytkownikowi.

---

## Entries

```http
GET /rooms/:roomId/entries
POST /rooms/:roomId/entries
GET /entries/:id
```

Dostęp jest sprawdzany przez relację:

```text
Entry
→ Room
→ Property
→ ownerId
```

---

## Attachments

```http
GET /entries/:entryId/attachments
POST /entries/:entryId/attachments
DELETE /attachments/:id
```

Dostęp jest sprawdzany przez:

```text
Attachment
→ Entry
→ Room
→ Property
→ ownerId
```

Upload zdjęć korzysta z prywatnego bucketu Supabase Storage.

---

# Upload zdjęć

## Web

Web korzysta ze standardowego:

```text
File
FormData
fetch
```

Request przechodzi przez autoryzowany wrapper API.

---

## Android / iOS

Mobile wykorzystuje:

```text
expo-file-system
expo/fetch
FormData
```

Przykładowy flow:

```text
ImagePicker
    ↓
File(asset.uri)
    ↓
FormData
    ↓
expoFetch
    ↓
Authorization: Bearer JWT
    ↓
NestJS
    ↓
Supabase Storage
```

Maksymalny rozmiar uploadu:

```text
10 MB
```

Aktualnie obsługiwane są obrazy.

---

# Supabase Storage

Bucket:

```text
entry-attachments
```

Bucket jest prywatny.

Backend generuje tymczasowe signed URLs umożliwiające wyświetlanie zdjęć w aplikacji.

Przykładowa struktura:

```text
entry-attachments/
└── entries/
    └── <entryId>/
        └── <uuid>.jpg
```

---

# Kategorie wpisów

```text
ELECTRICAL
PLUMBING
HEATING
WALL
FLOOR
DEVICE
NOTE
OTHER
```

Przykładowe znaczenie:

```text
ELECTRICAL  → elektryka
PLUMBING    → hydraulika
HEATING     → ogrzewanie
WALL        → ściany
FLOOR       → podłoga
DEVICE      → urządzenia
NOTE        → notatki
OTHER       → pozostałe
```

---

# Google OAuth

HomeVault posiada przygotowaną obsługę logowania Google przez Supabase Auth.

Flow:

```text
HomeVault
    ↓
Supabase Auth
    ↓
Google OAuth
    ↓
Supabase callback
    ↓
homevault://auth/callback
    ↓
HomeVault
```

W Supabase należy skonfigurować:

```text
Authentication
→ Sign In / Providers
→ Google
```

Wymagane:

```text
Google Client ID
Google Client Secret
```

Google OAuth callback kieruje najpierw do Supabase:

```text
https://PROJECT.supabase.co/auth/v1/callback
```

Następnie Supabase może przekierować użytkownika do aplikacji:

```text
homevault://auth/callback
```

W Supabase:

```text
Authentication
→ URL Configuration
→ Redirect URLs
```

należy dodać:

```text
homevault://auth/callback
```

---

# Deep linking

Aplikacja korzysta z własnego URL scheme:

```json
{
  "scheme": "homevault"
}
```

Dzięki temu OAuth może wrócić z przeglądarki do aplikacji:

```text
homevault://auth/callback
```

Zmiana `scheme` wymaga wykonania nowego natywnego buildu Android/iOS.

---

# Android / APK

Projekt korzysta z Expo EAS Build.

## Logowanie EAS

```powershell
npx.cmd eas-cli@latest login
```

Sprawdzenie konta:

```powershell
npx.cmd eas-cli@latest whoami
```

---

# Konfiguracja środowiska EAS

Profil `preview` powinien posiadać:

```text
EXPO_PUBLIC_API_URL

EXPO_PUBLIC_SUPABASE_URL

EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Przykład:

```powershell
npx.cmd eas-cli@latest env:set `
  --name EXPO_PUBLIC_API_URL `
  --value https://homevault-production.up.railway.app `
  --environment preview `
  --visibility plaintext
```

Supabase URL:

```powershell
npx.cmd eas-cli@latest env:set `
  --name EXPO_PUBLIC_SUPABASE_URL `
  --value https://PROJECT.supabase.co `
  --environment preview `
  --visibility plaintext
```

Publishable key:

```powershell
npx.cmd eas-cli@latest env:set `
  --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY `
  --value YOUR_PUBLISHABLE_KEY `
  --environment preview `
  --visibility plaintext
```

Sprawdzenie:

```powershell
npx.cmd eas-cli@latest env:list --environment preview
```

---

# Build APK

Przejście do projektu mobile:

```powershell
cd C:\Code\homevault\mobile
```

Na Windows, przy obecnej strukturze monorepo:

```powershell
$env:EAS_NO_VCS="1"
$env:EAS_PROJECT_ROOT="C:\Code\homevault\mobile"
```

Build:

```powershell
npx.cmd eas-cli@latest build `
  --platform android `
  --profile preview
```

Profil `preview` generuje instalowalny plik APK.

Po zmianach natywnych, np.:

```text
scheme
android.package
pluginy Expo
```

należy wykonać nowy build APK.

---

# Build produkcyjny Android

Build przeznaczony docelowo do Google Play:

```powershell
npx.cmd eas-cli@latest build `
  --platform android `
  --profile production
```

Wersja produkcyjna generuje artefakt przeznaczony do publikacji w Google Play.

Aktualny Android package:

```text
com.mmaciejczuk.homevault
```

---

# Prisma

Projekt korzysta z Prisma 7 oraz konfiguracji:

```text
api/prisma7.config.ts
```

## Walidacja schematu

```powershell
cd C:\Code\homevault\api

npx.cmd prisma validate `
  --config=prisma7.config.ts
```

---

## Generowanie klienta

```powershell
npx.cmd prisma generate `
  --config=prisma7.config.ts
```

---

## Migracje lokalne

```powershell
npx.cmd prisma migrate dev `
  --config=prisma7.config.ts
```

---

## Status migracji

```powershell
npx.cmd prisma migrate status `
  --config=prisma7.config.ts
```

---

## Deploy migracji

```powershell
npx.cmd prisma migrate deploy `
  --config=prisma7.config.ts
```

Railway wykonuje migracje przed uruchomieniem nowej wersji backendu.

---

# Owner migration

Do modelu `Property` został dodany:

```prisma
ownerId String

@@index([ownerId])
```

Migracje:

```text
20260925100445_add_property_owner
20260925124316_make_property_owner_required
```

Pierwsza migracja dodaje kolumnę.

Druga wymusza:

```sql
ALTER COLUMN "ownerId" SET NOT NULL;
```

Dzięki temu nieruchomość zawsze musi posiadać właściciela.

---

# Railway

Backend produkcyjny:

```text
https://homevault-production.up.railway.app
```

Przykładowy endpoint:

```text
https://homevault-production.up.railway.app/properties
```

Bez JWT endpointy zabezpieczone zwracają:

```http
401 Unauthorized
```

Railway automatycznie wdraża backend po zmianach na branchu:

```text
main
```

---

# Railway build

Root Directory:

```text
/api
```

Build:

```text
npm ci && npx prisma generate && npm run build
```

Start:

```text
npm run start:prod
```

Pre-deploy:

```text
npx prisma migrate deploy --config=prisma7.config.ts
```

---

# Git

Cały projekt jest jednym repozytorium Git.

```text
homevault/.git
```

`api` i `mobile` nie posiadają własnych repozytoriów Git.

Repozytorium:

```text
https://github.com/mmaciejczuk/homevault.git
```

---

## Sprawdzenie zmian

```powershell
cd C:\Code\homevault

git status --short
```

---

## Kontrola przed commitem

Backend:

```powershell
npm.cmd --prefix api run build
```

Mobile:

```powershell
cd C:\Code\homevault\mobile
npx.cmd tsc --noEmit
```

Git:

```powershell
cd C:\Code\homevault
git diff --check
```

---

## Dodanie zmian

```powershell
git add -A
```

---

## Commit

```powershell
git commit -m "Update HomeVault"
```

---

## Push

```powershell
git push origin HEAD
```

---

# Pliki ignorowane przez Git

Do repozytorium nie powinny trafiać:

```text
node_modules/
.env
.env.local
dist/
.expo/
coverage/
*.log
cache/
```

Sprawdzenie:

```powershell
git check-ignore node_modules
git check-ignore api/node_modules
git check-ignore mobile/node_modules
git check-ignore mobile/.env.local
```

Sprawdzenie, czy żaden `.env` nie jest śledzony:

```powershell
git ls-files |
Select-String -Pattern "\.env"
```

---

# Aktualny przepływ aplikacji

## Produkcja

```text
HomeVault Android / Web
        │
        ▼
Supabase Auth
        │
        │ JWT
        ▼
Railway
        │
        ▼
NestJS API
        │
        ▼
SupabaseAuthGuard
        │
        ▼
request.user.id
        │
        ▼
Prisma
        │
        ├──────────────► Supabase PostgreSQL
        │
        └──────────────► Supabase Storage
```

---

## Dane użytkownika

```text
Supabase Auth User
        │
        │ user.id
        ▼
Property.ownerId
        │
        ▼
Room
        │
        ▼
Entry
        │
        ▼
Attachment
```

---

## Upload zdjęcia

```text
HomeVault
   │
   │ JWT
   ▼
NestJS Attachments API
   │
   ├── sprawdzenie ownerId
   │
   ▼
Supabase Storage
   │
   ▼
Private file
   │
   ▼
Signed URL
   │
   ▼
HomeVault
```

---

# Status MVP

Aktualna wersja MVP obsługuje:

- rejestrację użytkownika,
- logowanie e-mail + hasło,
- trwałą sesję użytkownika,
- JWT pomiędzy aplikacją a API,
- zabezpieczone endpointy NestJS,
- przypisanie nieruchomości do właściciela,
- izolację danych pomiędzy użytkownikami,
- dodawanie domów,
- dodawanie pomieszczeń,
- dodawanie wpisów,
- kategorie wpisów,
- dodawanie zdjęć z galerii,
- wykonywanie zdjęć aparatem,
- upload zdjęć do Supabase Storage,
- prywatny bucket Storage,
- generowanie signed URLs,
- wyświetlanie zdjęć,
- podgląd zdjęć,
- usuwanie zdjęć,
- zabezpieczenie załączników według właściciela,
- backend wdrożony na Railway,
- automatyczne migracje Prisma podczas deploymentu,
- instalowalny build Android APK,
- przygotowaną integrację Google OAuth,
- obsługę deep linku `homevault://auth/callback`.

---

# Testy bezpieczeństwa

Izolacja została sprawdzona przy użyciu dwóch różnych użytkowników.

Użytkownik B nie może odczytać danych użytkownika A:

```text
GET /properties/1
→ 404

GET /rooms/1
→ 404

GET /entries/1
→ 404

GET /entries/1/attachments
→ 404
```

Bez JWT:

```text
GET /properties
→ 401

GET /rooms/1
→ 401

GET /entries/1
→ 401

GET /entries/1/attachments
→ 401
```

---

# Planowane

Najbliższe:

- finalny test Google OAuth na Android APK,
- Facebook OAuth,
- profil użytkownika,
- wylogowanie / zarządzanie kontem w UI,
- reset hasła.

Kolejne funkcje:

- dokumenty PDF,
- dokumenty techniczne,
- wyszukiwanie,
- tagi,
- współrzędne / lokalizacja elementów na zdjęciu,
- urządzenia,
- historia serwisowa,
- gwarancje,
- instrukcje obsługi,
- analiza zdjęć z wykorzystaniem AI,
- automatyczne rozpoznawanie elementów instalacji,
- RAG,
- wyszukiwanie semantyczne,
- funkcja „Zapytaj swój dom”,
- publikacja w Google Play.

---

# Docelowa wizja

HomeVault ma być cyfrową pamięcią domu.

Użytkownik powinien móc zapisać:

```text
co znajduje się w domu,
gdzie się znajduje,
jak zostało wykonane,
jak wyglądało przed zakryciem,
jakie urządzenia zostały zamontowane,
jakie dokumenty są z nimi związane,
kiedy były wykonywane prace,
kiedy wymagany jest serwis.
```

Docelowo użytkownik będzie mógł zadać pytanie:

```text
Gdzie przebiega przewód do gniazdka w salonie?
```

lub:

```text
Jakiej firmy jest pompa ciepła?
```

lub:

```text
Pokaż zdjęcia instalacji hydraulicznej w łazience
przed położeniem płytek.
```

HomeVault wykorzysta zapisane dane, zdjęcia i dokumenty do udzielenia odpowiedzi.