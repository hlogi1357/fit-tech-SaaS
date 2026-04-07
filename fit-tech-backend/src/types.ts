export type Gym = {
  id: string;
  name: string;
  maxCapacity: number;
  currentOccupancy: number;
  slotCapacity: number;
};

export type Booking = {
  id: string;
  gymId: string;
  userId: string;
  slotStart: string;
  createdAt: string;
};

export type CapacityResponse = {
  gymId: string;
  gymName: string;
  currentOccupancy: number;
  maxCapacity: number;
  capacityPercentage: number;
};

export type BookSlotRequest = {
  userId: string;
  slotStart: string;
};

export type BookSlotResponse = {
  bookingId: string;
  gymId: string;
  userId: string;
  slotStart: string;
  message: string;
};
