import type { FastifyInstance } from "fastify";
import { BookingService, ConflictError, NotFoundError, ValidationError } from "../services/booking-service.js";
import type { BookSlotRequest } from "../types.js";

export const registerGymRoutes = async (app: FastifyInstance, bookingService: BookingService): Promise<void> => {
  // Read-only endpoint for current live capacity.
  app.get("/gyms/:id/capacity", async (request, reply) => {
    const params = request.params as { id: string };

    try {
      const capacity = await bookingService.getCapacity(params.id);
      return reply.status(200).send(capacity);
    } catch (error) {
      // Service errors are mapped to explicit HTTP codes.
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      request.log.error(error);
      return reply.status(500).send({ message: "Unexpected error" });
    }
  });

  // Command endpoint for creating a gym slot booking.
  app.post("/gyms/:id/book", async (request, reply) => {
    const params = request.params as { id: string };
    const body = request.body as BookSlotRequest;

    try {
      const booking = await bookingService.bookSlot(params.id, body);
      return reply.status(201).send(booking);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      if (error instanceof ValidationError) {
        return reply.status(400).send({ message: error.message });
      }

      if (error instanceof ConflictError) {
        return reply.status(409).send({ message: error.message });
      }

      request.log.error(error);
      return reply.status(500).send({ message: "Unexpected error" });
    }
  });
};
