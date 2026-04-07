import type { Booking, Gym } from "../types.js";

// Repository contract so business logic is decoupled from storage technology.
export interface GymRepository {
  getGymById(id: string): Promise<Gym | null>;
  getCurrentOccupancy(gymId: string): Promise<number>;
  getSlotBookingCount(gymId: string, slotStart: string): Promise<number>;
  hasUserBooking(gymId: string, slotStart: string, userId: string): Promise<boolean>;
  createBooking(booking: Omit<Booking, "id" | "createdAt">): Promise<Booking>;
}

export class InMemoryGymRepository implements GymRepository {
  // In-memory stores keep this case study lightweight and DB-free.
  private readonly gyms = new Map<string, Gym>();
  private readonly bookings: Booking[] = [];

  constructor(seedGyms?: Gym[]) {
    // Allow tests to inject custom gym configuration.
    const gyms =
      seedGyms ??
      [
        {
          id: "gym-1",
          name: "Fit-Tech Sandton",
          maxCapacity: 120,
          currentOccupancy: 78,
          slotCapacity: 10,
        },
      ];

    gyms.forEach((gym) => this.gyms.set(gym.id, gym));
  }

  async getGymById(id: string): Promise<Gym | null> {
    return this.gyms.get(id) ?? null;
  }

  async getCurrentOccupancy(gymId: string): Promise<number> {
    return this.gyms.get(gymId)?.currentOccupancy ?? 0;
  }

  async getSlotBookingCount(gymId: string, slotStart: string): Promise<number> {
    // In real DBs this would typically be a count query with gymId + slot index.
    return this.bookings.filter((booking) => booking.gymId === gymId && booking.slotStart === slotStart).length;
  }

  async hasUserBooking(gymId: string, slotStart: string, userId: string): Promise<boolean> {
    return this.bookings.some(
      (booking) => booking.gymId === gymId && booking.slotStart === slotStart && booking.userId === userId,
    );
  }

  async createBooking(booking: Omit<Booking, "id" | "createdAt">): Promise<Booking> {
    // Simple synthetic ID for demo purposes.
    const newBooking: Booking = {
      id: `booking-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      ...booking,
    };

    this.bookings.push(newBooking);
    return newBooking;
  }
}
