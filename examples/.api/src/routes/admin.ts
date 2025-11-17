import { Router } from "express";

import {
  DatabaseScope,
  getOrder,
  resetAll,
  updateOrderStatus,
} from "../state/database.js";
import { broadcast, closeAll } from "../state/events.js";
import { sendError } from "../utils/http.js";
import type { OrderStatus } from "../types/domain.js";

const ORDER_STATUSES: OrderStatus[] = ["queued", "brewing", "ready", "paid", "cancelled"];

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);

export const adminRouter = Router();

adminRouter.post("/admin/reset", (req, res) => {
  const scopes: DatabaseScope[] | undefined = Array.isArray(req.body?.scopes)
    ? (req.body.scopes as DatabaseScope[])
    : undefined;
  resetAll(scopes);
  closeAll();
  res.status(204).send();
});

adminRouter.post("/admin/orders/:ticket/status-sequence", (req, res) => {
  const { ticket } = req.params;
  const statuses: string[] = Array.isArray(req.body?.statuses) ? req.body.statuses : [];
  if (statuses.length === 0) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "statuses array required" });
  }
  const updates = [];
  for (const status of statuses) {
    if (!isOrderStatus(status)) {
      return sendError(res, 422, { error: "VALIDATION_ERROR", reason: `unknown status ${status}` });
    }
    const next = updateOrderStatus(ticket, status);
    if (!next) {
      return sendError(res, 404, { error: "NOT_FOUND", reason: "Order not found" });
    }
    broadcast({ event: "order-status", data: { ticket: next.ticket, status: next.status } });
    updates.push(next);
  }
  res.json({ updates });
});

adminRouter.post("/admin/orders/:ticket/complete", (req, res) => {
  const { ticket } = req.params;
  const pickupCode = typeof req.body?.pickupCode === "string" ? req.body.pickupCode : undefined;
  const completedAt = new Date().toISOString();
  const order = updateOrderStatus(ticket, "ready", pickupCode ? { pickupCode } : undefined);
  if (!order) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Order not found" });
  }
  broadcast({ event: "completed", data: { ticket: order.ticket, pickupCode: pickupCode ?? null, completedAt } });
  res.json(order);
});

adminRouter.post("/admin/orders/:ticket/events", (req, res) => {
  const { ticket } = req.params;
  const order = getOrder(ticket);
  if (!order) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Order not found" });
  }
  const eventName = typeof req.body?.event === "string" ? req.body.event : undefined;
  const data = req.body?.data && typeof req.body.data === "object" ? req.body.data : {};
  if (!eventName) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "event name required" });
  }
  broadcast({ event: eventName, data: { ...data, ticket: order.ticket } });
  res.status(204).send();
});
