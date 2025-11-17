import { Router } from "express";

import { getLoyalty, setLoyaltyPoints } from "../state/database.js";
import { sendError } from "../utils/http.js";

export const loyaltyRouter = Router();

loyaltyRouter.get("/loyalty/:email", (req, res) => {
  const account = getLoyalty(req.params.email);
  if (!account) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Loyalty account not found" });
  }
  res.json(account);
});

loyaltyRouter.patch("/loyalty/:email", (req, res) => {
  const points = Number(req.body?.points);
  if (!Number.isFinite(points)) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "points must be numeric" });
  }
  res.json(setLoyaltyPoints(req.params.email, points));
});
