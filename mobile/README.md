# HomeVault

HomeVault to aplikacja mobilna i webowa do przechowywania cyfrowej dokumentacji domu.

Pozwala organizować informacje według struktury:

```text
Dom
└── Pomieszczenia
    └── Wpisy
        └── Zdjęcia / załączniki
```

## Przykładowe zastosowania

* dokumentacja instalacji elektrycznej,
* hydraulika,
* ogrzewanie,
* ściany i zabudowy,
* podłogi,
* urządzenia,
* zdjęcia instalacji przed zakryciem,
* notatki techniczne,
* dokumentacja remontowa i budowlana.

---

# Stack

## Backend

* Node.js
* NestJS
* Prisma 7
* PostgreSQL
* Supabase
* Supabase Storage

## Frontend

* React Native
* Expo
* Expo Router
* TypeScript
* Expo Image Picker

## Hosting

* API: Railway
* Database: Supabase PostgreSQL
* Storage: Supabase Storage
* Android builds: Expo EAS

---

# Struktura projektu

```text
homevault/
├── api/                # NestJS API
├── mobile/             # Expo / React Native
├── package.json        # wspólne komendy developerskie
├── package-lock.json
├── .gitignore
└── README.md
```

---

# Wymagania

Do uruchomienia projektu potrzebne są:

* Node.js
* npm
* Git
* konto Supabase
* konto Railway
* konto Expo / EAS

Sprawdzenie wersji:

```powershell
node --version
npm.cmd --version
git --version
```

---

# Instalacja

Po sklonowaniu repozytorium:

```powershell
git clone https://github.com/mmaciejczuk/homevault.git
cd homevault
```

Instalacja zależności głównych:

```powershell
npm.cmd install
```

Instalacja backendu:

```powershell
npm.cmd --prefix api install
```

Instalacja mobile:

```powershell
npm.cmd --prefix mobile install
```

---

# Environment variables

## API

Plik:

```text
api/.env
```

Przykład:

```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SECRET_KEY=...
```

Sekrety nie mogą być commitowane do Git.

---

## Mobile

Lokalny plik:

```text
mobile/.env.local
```

Przykład dla Railway:

```env
EXPO_PUBLIC_API_URL=https://homevault-production.up.railway.app
```

`.env.local` również nie jest przechowywany w repozytorium.

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

Frontend korzysta wtedy z lokalnego API:

```text
http://localhost:3000
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

bez uruchamiania lokalnego backendu.

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

Po uruchomieniu Expo można nacisnąć:

```text
w
```

aby otworzyć wersję webową.

Można również użyć:

```powershell
npm.cmd run web
```

Android:

```powershell
npm.cmd run android
```

---

# API

## Properties

```http
GET /properties
POST /properties
GET /properties/:id
```

## Rooms

```http
GET /properties/:propertyId/rooms
POST /properties/:propertyId/rooms
GET /rooms/:id
```

## Entries

```http
GET /rooms/:roomId/entries
POST /rooms/:roomId/entries
GET /entries/:id
```

## Attachments

```http
GET /entries/:entryId/attachments
POST /entries/:entryId/attachments
DELETE /attachments/:id
```

Upload zdjęć korzysta z prywatnego bucketu Supabase Storage.

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

---

# Android / APK

Projekt korzysta z Expo EAS Build.

## Logowanie

```powershell
npx.cmd eas-cli@latest login
```

Sprawdzenie konta:

```powershell
npx.cmd eas-cli@latest whoami
```

---

# Konfiguracja środowiska EAS

Produkcja API dla profilu `preview`:

```powershell
npx.cmd eas-cli@latest env:set `
  --name EXPO_PUBLIC_API_URL `
  --value https://homevault-production.up.railway.app `
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
npx.cmd eas-cli@latest build --platform android --profile preview
```

Profil `preview` generuje instalowalny plik APK.

Po zakończeniu EAS zwraca link oraz kod QR do instalacji aplikacji na Androidzie.

---

# Build produkcyjny Android

Build przeznaczony docelowo do Google Play:

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
```

Wersja produkcyjna generuje artefakt przeznaczony do publikacji w Google Play.

---

# Prisma

## Generowanie klienta

```powershell
cd C:\Code\homevault\api
npx.cmd prisma generate
```

## Migracje lokalne

```powershell
npx.cmd prisma migrate dev
```

## Deploy migracji

```powershell
npx.cmd prisma migrate deploy --config=prisma7.config.ts
```

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

Railway automatycznie wdraża backend po zmianach na branchu:

```text
main
```

---

# Git

Cały projekt jest jednym repozytorium Git.

```text
homevault/.git
```

`api` i `mobile` nie posiadają własnych repozytoriów Git.

## Sprawdzenie zmian

```powershell
cd C:\Code\homevault
git status
```

## Dodanie zmian

```powershell
git add -A
```

## Commit

```powershell
git commit -m "Update HomeVault"
```

## Push

```powershell
git push
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

---

# Aktualny przepływ aplikacji

```text
HomeVault Android / Web
        ↓
Railway
        ↓
NestJS API
        ↓
Prisma
        ↓
Supabase PostgreSQL
        ↓
Supabase Storage
```

W trybie lokalnym:

```text
HomeVault Web / Expo
        ↓
localhost:3000
        ↓
NestJS API
        ↓
Prisma
        ↓
Supabase PostgreSQL
        ↓
Supabase Storage
```

---

# Status MVP

Aktualna wersja MVP obsługuje:

* dodawanie domów,
* dodawanie pomieszczeń,
* dodawanie wpisów,
* kategorie wpisów,
* dodawanie zdjęć z galerii,
* wykonywanie zdjęć aparatem,
* upload zdjęć do Supabase Storage,
* wyświetlanie zdjęć,
* podgląd zdjęć,
* usuwanie zdjęć,
* backend wdrożony na Railway,
* instalowalny build Android APK.

---

# Planowane

* Supabase Auth,
* konta użytkowników,
* przypisanie domów do właściciela,
* dokumenty PDF,
* wyszukiwanie,
* analiza zdjęć z wykorzystaniem AI,
* RAG,
* funkcja „Zapytaj swój dom”,
* publikacja w Google Play.
