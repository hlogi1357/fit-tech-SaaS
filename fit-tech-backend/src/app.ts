import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { InMemoryGymRepository } from "./repositories/gym-repository.js";
import { registerGymRoutes } from "./routes/gyms-routes.js";
import { BookingService } from "./services/booking-service.js";

export const buildApp = async (): Promise<FastifyInstance> => {
  // One Fastify instance per process.
  const app = Fastify({ logger: true });

  // CORS enabled for local mobile/web development.
  await app.register(cors, {
    origin: true,
  });

  // Composition root for repository + service wiring.
  const repository = new InMemoryGymRepository();
  const bookingService = new BookingService(repository);

  await registerGymRoutes(app, bookingService);

  app.get("/health", async () => ({ status: "ok" }));

  return app;
};
