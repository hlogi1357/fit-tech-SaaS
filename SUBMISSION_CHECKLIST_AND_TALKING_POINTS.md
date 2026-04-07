# Fit-Tech Case Study: Submission Checklist + Review Talking Points

## 1) Submission Checklist

1. Confirm backend starts and health responds.
   - Command: `cd /Users/codespace/fit-tech/fit-tech-backend && npm run dev`
   - Check: `GET http://localhost:3001/health` returns `{ "status": "ok" }`
2. Confirm mobile app starts and can reach backend.
   - Command: `cd /Users/codespace/fit-tech/fit-tech-app && npx expo start`
   - If needed, set `EXPO_PUBLIC_API_BASE_URL`.
3. Confirm tests and type checks pass.
   - Backend: `npm run test`, `npm run typecheck`, `npm run build`
   - Mobile: `npm run lint`, `npx tsc --noEmit`
4. Confirm required endpoints are implemented.
   - `GET /gyms/:id/capacity`
   - `POST /gyms/:id/book`
5. Confirm concurrency protection is present and tested.
   - Locking and race protection in booking flow.
6. Confirm mobile states are visible.
   - Loading capacity state, booking loading state, success, and error.
7. Confirm “specific date & time booking” works.
   - Inputs: `YYYY-MM-DD` and `HH:mm`, validated and sent as ISO.
8. Confirm CDK snippet is included.
   - Lambda + API Gateway proxy in `infrastructure/gym-api-stack.ts`.
9. Confirm README explains run steps for both backend and app.
10. Create private repo and share URL with evaluators.

## 2) Suggested Technical Review Talking Points

### Problem Framing
- Goal was to solve peak-time gym crowding by exposing live capacity and allowing guaranteed-entry slot bookings.
- The key risk area was concurrency during request spikes (overbooking risk).

### Architecture Choices
- Separated concerns into route layer, service layer, repository interface, and storage adapter.
- Used an in-memory repository for the case study while keeping interface boundaries so swapping to DynamoDB/Postgres is straightforward.

### Concurrency Strategy (Most Important)
- Introduced a per-`gymId+slotStart` lock manager in the service layer.
- Performed capacity check and booking creation inside the same critical section.
- This prevents race-condition overbooking when many requests hit the same slot simultaneously.

### API Behavior
- `GET /capacity` provides occupancy and percentage for instant mobile rendering.
- `POST /book` enforces:
  - Valid payload
  - Gym existence
  - No duplicate booking for same user+slot
  - Slot capacity upper bound
- Service errors are mapped to meaningful HTTP responses (`400`, `404`, `409`).

### Mobile App Decisions
- Built a single-screen flow with strict typing and reusable `CapacityMeter` component.
- Implemented explicit UI states for resilience and user trust.
- Enhanced usefulness with explicit slot date/time input and client-side validation.

### Testing Strategy
- Added unit tests for the highest-risk business logic:
  - Concurrent bookings capped at slot capacity
  - Duplicate same-user booking prevention

### Infrastructure as Code
- Included AWS CDK snippet for Lambda + API Gateway proxy routing.
- Keeps deployment story aligned with “you build it, you run it”.

### How I’d Productionize Next
- Replace in-memory repository with transactional datastore primitives.
- Add idempotency keys and request tracing.
- Add auth, rate limiting, and observability dashboards/alerts.
- Add integration tests and load tests for peak-hour behavior.

## 3) Short Verbal Pitch (60–90 seconds)

“I focused on the highest-risk part first: preventing overbooking under concurrent demand. I modeled the backend with clear service and repository boundaries, then implemented per-slot locking so capacity checks and writes happen atomically for a gym slot. On mobile, I built a typed reusable capacity component and a robust booking flow with loading/success/error handling. I also improved product usefulness by allowing users to select a specific booking date and time instead of only a default slot. I covered critical logic with concurrency-focused unit tests and included a CDK snippet for Lambda and API Gateway so the solution is cloud-ready.”
