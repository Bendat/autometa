import express from "express";
import cors from "cors";

import { adminRouter } from "./routes/admin.js";
import { inventoryRouter } from "./routes/inventory.js";
import { loyaltyRouter } from "./routes/loyalty.js";
import { menuRouter } from "./routes/menu.js";
import { ordersRouter } from "./routes/orders.js";
import { recipesRouter } from "./routes/recipes.js";

export const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(menuRouter);
  app.use(recipesRouter);
  app.use(ordersRouter);
  app.use(inventoryRouter);
  app.use(loyaltyRouter);
  app.use(adminRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (res.headersSent) {
      return;
    }
    if (err instanceof SyntaxError) {
      res.status(400).json({ error: "BAD_JSON", reason: "Request body must be valid JSON" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "INTERNAL_ERROR" });
  });

  return app;
};
