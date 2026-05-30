# VSTEP Mobile V2

Expo mobile client for Backend V2.

## API Environment

Mobile reads the backend base URL from `EXPO_PUBLIC_API_URL`.

Important: use the API origin only. Do not append `/api/v1`.

```bash
EXPO_PUBLIC_API_URL=https://api.vstepgo.com
```

The app code calls endpoints like `/api/v1/auth/login` itself.

## Local Backend

Start Backend V2 first:

```bash
cd ../backend-v2
docker compose -f docker-compose.dev.yml up -d --build backend
```

Then choose the right mobile URL:

```bash
# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000

# iOS simulator
EXPO_PUBLIC_API_URL=http://localhost:8000

# Physical phone on the same Wi-Fi as your computer
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

On Windows, get your LAN IP:

```powershell
ipconfig
```

Use the IPv4 address of the active Wi-Fi/LAN adapter.

## Run Mobile

```bash
bun install
bun run start
```

For Android:

```bash
bun run android
```

## Production / EAS Builds

Production builds must point to a reachable production backend:

```bash
EXPO_PUBLIC_API_URL=https://api.vstepgo.com
```

Before building, verify:

```bash
curl https://api.vstepgo.com/api/v1/health
```

If this returns 404 or any non-2xx status, deployed mobile login will fail even if the mobile build is correct.

Because `.env` is gitignored, configure `EXPO_PUBLIC_API_URL` in EAS project environment variables or your local ignored `eas.json` build profile.

## Demo Login

After seeding Backend V2 locally:

```text
learner@vstep.test / password
learner2@vstep.test / password
teacher@vstep.test / password
staff@vstep.test / password
admin@vstep.test / password
```
