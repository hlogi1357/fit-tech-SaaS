# Fit-Tech Technical Case Study

This workspace contains a complete implementation of the Senior Full Stack Mobile Engineer case study across three areas:

- **Task A (Backend API):** `fit-tech-backend` (Fastify + TypeScript)
- **Task B (Mobile UI):** `fit-tech-app` (Expo + React Native + TypeScript)
- **Task C (Infrastructure as Code):** `fit-tech-backend/infrastructure/gym-api-stack.ts` (AWS CDK snippet)

## 1) Backend (Task A)

```bash
cd /Users/codespace/fit-tech-SaaS/fit-tech-backend
npm install
npm run dev
```

API runs on `http://localhost:3001`.

### Endpoints

- `GET /gyms/:id/capacity`
- `POST /gyms/:id/book`

Example booking payload:

```json
{
  "userId": "member-001",
  "slotStart": "2026-04-06T18:00:00.000Z"
}
```

### Test + quality checks

```bash
npm run test
npm run typecheck
npm run build
```

## 2) Mobile App (Task B)

```bash
cd /Users/codespace/fit-tech-SaaS/fit-tech-app
npm install
npx expo start
```

By default, API base URL resolves to:

- Android emulator: `http://10.0.2.2:3001`
- iOS simulator/web: `http://localhost:3001`

You can override with:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<your-host>:3001
```

The screen includes:

- Live capacity progress meter
- Book Slot action
- Loading, success, and error states
- Strictly typed and reusable UI component (`CapacityMeter`)

## 3) CDK Snippet (Task C)

See:

- `fit-tech-backend/infrastructure/gym-api-stack.ts`

This defines:

- Lambda function (`Node.js 20`)
- API Gateway REST API
- Proxy integration routing all paths to Lambda/Fastify

## Concurrency Strategy

Booking logic is concurrency-safe via a **per-gym-slot lock** in:

- `fit-tech-backend/src/utils/lock-manager.ts`
- `fit-tech-backend/src/services/booking-service.ts`

This prevents overbooking during burst traffic (e.g., multiple simultaneous requests for the same slot).
