import type { Response } from "express";

export type OrderEvent = {
  event: string;
  data: Record<string, unknown>;
};

const clients = new Set<Response>();

export function registerClient(res: Response): void {
  clients.add(res);
  res.on("close", () => {
    clients.delete(res);
  });
}

export function broadcast(event: OrderEvent): void {
  const payload = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}

export function closeAll(): void {
  for (const client of clients) {
    client.end();
  }
  clients.clear();
}
