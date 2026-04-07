import type { GymRepository } from "../repositories/gym-repository.js";
import type { BookSlotRequest, BookSlotResponse, CapacityResponse } from "../types.js";
import { LockManager } from "../utils/lock-manager.js";

// Service-level error types mapped by route handlers to HTTP status codes.
export class NotFoundError extends Error {}
export class ConflictError extends Error {}
export class ValidationError extends Error {}

export class BookingService {
  constructor(
    private readonly repository: GymRepository,
    private readonly lockManager = new LockManager(),
  ) {}

  async getCapacity(gymId: string): Promise<CapacityResponse> {
    // Verify gym exists before reading occupancy.
    const gym = await this.repository.getGymById(gymId);
    if (!gym) {
      throw new NotFoundError("Gym not found");
    }

    // Current occupancy is read separately to model real repository behavior.
    const currentOccupancy = await this.repository.getCurrentOccupancy(gymId);
    const capacityPercentage = Math.round((currentOccupancy / gym.maxCapacity) * 100);

    return {
      gymId: gym.id,
      gymName: gym.name,
      currentOccupancy,
      maxCapacity: gym.maxCapacity,
      capacityPercentage,
    };
  }

  async bookSlot(gymId: string, payload: BookSlotRequest): Promise<BookSlotResponse> {
    // Basic payload validation.
    if (!payload.userId?.trim()) {
      throw new ValidationError("userId is required");
    }

    if (!payload.slotStart?.trim()) {
      throw new ValidationError("slotStart is required");
    }

    const slotDate = new Date(payload.slotStart);
    if (Number.isNaN(slotDate.getTime())) {
      throw new ValidationError("slotStart must be a valid ISO date string");
    }

    // Ensure gym exists and we know slot capacity rules.
    const gym = await this.repository.getGymById(gymId);
    if (!gym) {
      throw new NotFoundError("Gym not found");
    }

    // Normalize slot to canonical ISO format to avoid mismatch between equivalent timestamps.
    const normalizedSlot = slotDate.toISOString();
    const lockKey = `${gymId}:${normalizedSlot}`;

    // Critical section: only one request can evaluate+write this gym-slot at a time.
    return this.lockManager.withLock(lockKey, async () => {
      // Prevent same user from booking the same slot twice.
      const hasBooking = await this.repository.hasUserBooking(gymId, normalizedSlot, payload.userId);
      if (hasBooking) {
        throw new ConflictError("User already has a booking for this slot");
      }

      // Capacity check inside the lock prevents race-condition overbooking.
      const currentSlotBookings = await this.repository.getSlotBookingCount(gymId, normalizedSlot);
      if (currentSlotBookings >= gym.slotCapacity) {
        throw new ConflictError("Slot is full");
      }

      // Persist booking after all checks pass.
      const created = await this.repository.createBooking({
        gymId,
        userId: payload.userId,
        slotStart: normalizedSlot,
      });

      return {
        bookingId: created.id,
        gymId,
        userId: created.userId,
        slotStart: created.slotStart,
        message: "Slot booked successfully",
      };
    });
  }
}
