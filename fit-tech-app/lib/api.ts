import { Platform } from "react-native";

// Mirrors backend response for GET /gyms/:id/capacity.
export type CapacityResponse = {
  gymId: string;
  gymName: string;
  currentOccupancy: number;
  maxCapacity: number;
  capacityPercentage: number;
};

// Payload expected by POST /gyms/:id/book.
export type BookSlotPayload = {
  userId: string;
  slotStart: string;
};

// Mirrors backend response for successful booking creation.
export type BookSlotResponse = {
  bookingId: string;
  gymId: string;
  userId: string;
  slotStart: string;
  message: string;
};

// Resolve API URL per platform so the same code works in Android emulator and iOS/web.
const resolveBaseUrl = (): string => {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured) {
    return configured;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3001";
  }

  return "http://localhost:3001";
};

const BASE_URL = resolveBaseUrl();

// Backend sends structured errors as { message }, so we try to surface that first.
const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { message?: string };
    return data.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

// Fetch current gym capacity from backend.
export const getCapacity = async (gymId: string): Promise<CapacityResponse> => {
  const response = await fetch(`${BASE_URL}/gyms/${gymId}/capacity`);

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as CapacityResponse;
};

// Create a slot booking for a user.
export const bookSlot = async (gymId: string, payload: BookSlotPayload): Promise<BookSlotResponse> => {
  const response = await fetch(`${BASE_URL}/gyms/${gymId}/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return (await response.json()) as BookSlotResponse;
};
