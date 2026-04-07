# Fit-Tech Mobile App (Task B)

Single-screen Expo app for live gym capacity and booking.

## Run

```bash
cd /Users/codespace/fit-tech/fit-tech-app
npm install
npx expo start
```

## API Configuration

Set backend base URL via `EXPO_PUBLIC_API_BASE_URL` if needed.

Defaults in code:

- Android emulator: `http://10.0.2.2:3001`
- iOS simulator/web: `http://localhost:3001`

## What this screen demonstrates

- Live capacity visualization with reusable typed component (`components/capacity-meter.tsx`)
- Booking flow via `POST /gyms/:id/book`
- Explicit loading, success, and error states
- Strict TypeScript typing for API contracts and UI state
