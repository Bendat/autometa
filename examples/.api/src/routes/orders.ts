import { Router } from "express";

import {
  adjustInventory,
  adjustLoyaltyPoints,
  createOrder,
  getOrder,
  listOrders,
  updateOrderStatus,
} from "../state/database.js";
import { broadcast, registerClient } from "../state/events.js";
import { sendError } from "../utils/http.js";
import type { OrderInput, OrderItem } from "../types/domain.js";

const LOYALTY_POINTS_PER_ORDER = 10;

export const ordersRouter = Router();

ordersRouter.get("/orders", (_req, res) => {
  res.json({ orders: listOrders() });
});

ordersRouter.post("/orders", (req, res) => {
  const body = req.body as OrderInput;
  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "items are required" });
  }

  if (!validateItems(body.items)) {
    return sendError(res, 422, { error: "VALIDATION_ERROR", reason: "each item requires a name" });
  }

  const adjustments: Array<{ name: string; rollback: () => void }> = [];
  for (const item of body.items) {
    const result = adjustInventory(item.name, -1);
    if (!result) {
      for (const recorded of adjustments) {
        recorded.rollback();
      }
      return sendError(res, 409, { error: "OUT_OF_STOCK", reason: `Inventory depleted for ${item.name}` });
    }
    adjustments.push({
      name: item.name,
      rollback: () => {
        adjustInventory(item.name, 1);
      },
    });
  }

  const orderInput: OrderInput = { items: body.items };
  if (body.payment) {
    orderInput.payment = body.payment;
  }
  if (body.loyaltyEmail !== undefined) {
    orderInput.loyaltyEmail = body.loyaltyEmail;
  }

  const order = createOrder(orderInput);

  if (body.loyaltyEmail) {
    const account = adjustLoyaltyPoints(body.loyaltyEmail, LOYALTY_POINTS_PER_ORDER);
    broadcast({ event: "loyalty-earned", data: { ticket: order.ticket, email: account.email, points: account.points } });
  }

  if (body.payment?.method) {
    const paidOrder = updateOrderStatus(order.ticket, "paid");
    if (paidOrder) {
      broadcast({ event: "order-status", data: { ticket: paidOrder.ticket, status: paidOrder.status } });
      return res.status(201).location(`/orders/${paidOrder.id}`).json(paidOrder);
    }
  }

  broadcast({ event: "order-created", data: { ticket: order.ticket, status: order.status } });

  res.status(201).location(`/orders/${order.id}`).json(order);
});

ordersRouter.get("/orders/stream", (_req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  broadcast({ event: "stream-connected", data: {} });
  res.write("\n");

  registerClient(res);
});

ordersRouter.get("/orders/:id", (req, res) => {
  const order = getOrder(req.params.id);
  if (!order) {
    return sendError(res, 404, { error: "NOT_FOUND", reason: "Order not found" });
  }
  res.json(order);
});

function validateItems(items: OrderItem[]): boolean {
  return items.every((item) => typeof item?.name === "string" && item.name.trim().length > 0);
}
