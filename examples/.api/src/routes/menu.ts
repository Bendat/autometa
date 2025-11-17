import { Router } from "express";

import { addMenuItem, listMenu, removeMenuItem, updateMenuPrices } from "../state/database.js";
import { sendError } from "../utils/http.js";

export const menuRouter = Router();

menuRouter.get("/menu", (_req, res) => {
  res.json({ items: listMenu() });
});

menuRouter.post("/menu", (req, res) => {
  const { name, price, size, season, seasonal, description } = req.body ?? {};
  if (!name || typeof name !== "string" || typeof price !== "number" || typeof size !== "string") {
    return sendError(res, 422, {
      error: "VALIDATION_ERROR",
      details: {
        name: typeof name === "string" ? undefined : "NAME_REQUIRED",
        price: typeof price === "number" ? undefined : "PRICE_REQUIRED",
        size: typeof size === "string" ? undefined : "SIZE_REQUIRED",
      },
    });
  }

  const item = addMenuItem({ name, price, size, season: season ?? null, seasonal, description });
  res.status(201).location(`/menu/${encodeURIComponent(item.name)}`).json(item);
});

menuRouter.delete("/menu/:drink", (req, res) => {
  const { drink } = req.params;
  const removed = removeMenuItem(drink);
  if (!removed) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: `Menu item ${drink} not found` });
  }
  res.status(204).send();
});

menuRouter.patch("/menu/prices", (req, res) => {
  const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
  if (updates.length === 0) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "updates array required" });
  }
  const normalized: Array<{ name: string; price: number }> = [];
  for (const entry of updates) {
    if (typeof entry?.name === "string" && typeof entry?.price === "number") {
      normalized.push({ name: entry.name, price: entry.price });
    }
  }

  res.json({ items: updateMenuPrices(normalized) });
});
