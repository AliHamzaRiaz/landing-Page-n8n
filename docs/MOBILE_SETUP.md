# Mobile setup

`apps/mobile` is an **Expo (React Native)** app. It uses the **same NestJS API and JWT accounts** as the web app.

Never put Meta secrets, OAuth client secrets, or AI keys in the mobile app. The only env var is `EXPO_PUBLIC_API_URL`.

Expo dependencies stay under `apps/mobile/node_modules` (`installConfig.hoistingLimits`) so they do not replace the web app’s React 19.2.x.

## Install and run

From the repo root (after a normal `npm install`):

```bash
npm install --workspace=mobile
cp apps/mobile/.env.example apps/mobile/.env
npm run dev:mobile
```

Or:

```bash
cd apps/mobile
npx expo start
```

Scan the QR code with **Expo Go** (a phone on the same Wi‑Fi).

### API URL

`apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

- Physical device: `localhost` is the phone. Use your PC LAN IP, e.g. `http://192.168.1.10:3001/api`.
- Android emulator: `http://10.0.2.2:3001/api`.
- Production API: `https://landing-page-n8n.onrender.com/api`.

Restart Expo after changing `.env`.

The API CORS config already allows requests with no `Origin` (native apps). Keep `dev:api` running.

## Login

Phone + password, same as web (`POST /auth/login`). New accounts still need OTP verify (`POST /auth/verify`) before login succeeds.

## Native store builds

```bash
cd apps/mobile
npx eas login
npx eas build -p android
npx eas build -p ios
```

Apple Developer and Google Play accounts are required.
