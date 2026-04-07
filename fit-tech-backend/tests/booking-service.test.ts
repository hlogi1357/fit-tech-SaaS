import { describe, expect, it } from "vitest";
import { InMemoryGymRepository } from "../src/repositories/gym-repository.js";
import { BookingService, ConflictError } from "../src/services/booking-service.js";

describe("BookingService", () => {
  it("books up to slot capacity and rejects overflow during concurrent requests", async () => {
    const repository = new InMemoryGymRepository([
      {
        id: "gym-1",
        name: "Test Gym",
        maxCapacity: 100,
        currentOccupancy: 50,
        slotCapacity: 3,
      },
    ]);

    const service = new BookingService(repository);
    const slotStart = new Date("2026-04-06T18:00:00.000Z").toISOString();

    const attempts = await Promise.allSettled(
      Array.from({ length: 6 }, (_, index) =>
        service.bookSlot("gym-1", {
          userId: `user-${index}`,
          slotStart,
        }),
      ),
    );

    const fulfilled = attempts.filter((result) => result.status === "fulfilled");
    const rejected = attempts.filter((result) => result.status === "rejected");

    expect(fulfilled).toHaveLength(3);
    expect(rejected).toHaveLength(3);
    rejected.forEach((result) => {
      if (result.status === "rejected") {
        expect(result.reason).toBeInstanceOf(ConflictError);
      }
    });
  });

  it("prevents duplicate booking from the same user for the same slot", async () => {
    const repository = new InMemoryGymRepository();
    const service = new BookingService(repository);
    const slotStart = new Date("2026-04-06T18:30:00.000Z").toISOString();

    await service.bookSlot("gym-1", { userId: "alice", slotStart });

    await expect(
      service.bookSlot("gym-1", {
        userId: "alice",
        slotStart,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
