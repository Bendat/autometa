import { Router } from "express";

import { clearInventory, listInventory, setInventory } from "../state/database.js";
import { sendError } from "../utils/http.js";

export const inventoryRouter = Router();

inventoryRouter.get("/inventory", (_req, res) => {
  res.json({ inventory: listInventory() });
});

inventoryRouter.patch("/inventory/:item", (req, res) => {
  const { item } = req.params;
  const quantity = Number(req.body?.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "quantity must be >= 0" });
  }
  res.json(setInventory(item, quantity));
});

inventoryRouter.delete("/inventory/:item", (req, res) => {
  const removed = clearInventory(req.params.item);
  if (!removed) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Inventory item not found" });
  }
  res.status(204).send();
});
