import { randomUUID } from "node:crypto";

import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
  OrderInput,
  Recipe,
  RecipeInput,
} from "../types/domain.js";
import { createSeedState } from "./seed.js";
import { slugify } from "../utils/slugify.js";

export type DatabaseScope = "menu" | "recipes" | "inventory" | "loyalty" | "orders";

const menu = new Map<string, MenuItem>();
const recipes = new Map<string, Recipe>();
const inventory = new Map<string, number>();
const inventoryLabels = new Map<string, string>();
const loyaltyAccounts = new Map<string, LoyaltyAccount>();
const orders = new Map<string, Order>();

resetAll();

export function resetAll(scopes: DatabaseScope[] = ["menu", "recipes", "inventory", "loyalty", "orders"]): void {
  const defaults = createSeedState();
  if (scopes.includes("menu")) {
    menu.clear();
    for (const item of defaults.menu) {
      menu.set(item.name.toLowerCase(), { ...item });
    }
  }
  if (scopes.includes("recipes")) {
    recipes.clear();
    for (const recipe of defaults.recipes) {
      recipes.set(recipe.slug, { ...recipe });
    }
  }
  if (scopes.includes("inventory")) {
    inventory.clear();
    inventoryLabels.clear();
    for (const item of defaults.inventory) {
      inventory.set(item.item.toLowerCase(), item.quantity);
      inventoryLabels.set(item.item.toLowerCase(), item.item);
    }
  }
  if (scopes.includes("loyalty")) {
    loyaltyAccounts.clear();
    for (const account of defaults.loyalty) {
      loyaltyAccounts.set(account.email.toLowerCase(), { ...account });
    }
  }
  if (scopes.includes("orders")) {
    orders.clear();
  }
}

export function listMenu(): MenuItem[] {
  return Array.from(menu.values()).map((item) => ({ ...item }));
}

export function addMenuItem(payload: Omit<MenuItem, "seasonal"> & { seasonal?: boolean }): MenuItem {
  const seasonal = payload.seasonal ?? Boolean(payload.season);
  const item: MenuItem = {
    ...payload,
    seasonal,
    season: payload.season ?? null,
  };
  menu.set(item.name.toLowerCase(), item);
  if (!inventory.has(item.name.toLowerCase())) {
    inventory.set(item.name.toLowerCase(), 50);
    inventoryLabels.set(item.name.toLowerCase(), item.name);
  }
  return { ...item };
}

export function updateMenuPrices(updates: Array<{ name: string; price: number }>): MenuItem[] {
  for (const update of updates) {
    const key = update.name.toLowerCase();
    const item = menu.get(key);
    if (!item) continue;
    menu.set(key, { ...item, price: update.price });
  }
  return listMenu();
}

export function removeMenuItem(name: string): boolean {
  const key = name.toLowerCase();
  inventory.delete(key);
  return menu.delete(key);
}

export function listRecipes(): Recipe[] {
  return Array.from(recipes.values()).map((recipe) => ({ ...recipe, additions: [...recipe.additions] }));
}

const allowedRecipePatchKeys = new Set<string>([
  "name",
  "base",
  "additions",
  "season",
  "isSeasonal",
  "tastingNotes",
]);

export function createRecipe(input: RecipeInput): Recipe {
  const slug = slugify(input.name);
  const recipe: Recipe = {
    name: input.name,
    slug,
    base: input.base,
    additions: [...(input.additions ?? [])],
    season: input.season ?? null,
    isSeasonal: Boolean(input.season),
    tastingNotes: input.tastingNotes ?? null,
  };
  recipes.set(slug, recipe);
  return { ...recipe, additions: [...recipe.additions] };
}

export function ensureRecipe(name: string): Recipe | undefined {
  const slug = slugify(name);
  return recipes.get(slug);
}

export function getRecipe(slug: string): Recipe | undefined {
  const recipe = recipes.get(slug);
  if (!recipe) return undefined;
  return { ...recipe, additions: [...recipe.additions] };
}

export function patchRecipe(slug: string, updates: Partial<Recipe>): Recipe | undefined {
  const recipe = recipes.get(slug);
  if (!recipe) return undefined;
  let currentSlug = slug;
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedRecipePatchKeys.has(key)) {
      throw new Error(`unsupported_property:${key}`);
    }
    if (key === "additions" && Array.isArray(value)) {
      recipe.additions = value.map(String);
      continue;
    }
    if (key === "season") {
      recipe.season = value as string | null;
      recipe.isSeasonal = Boolean(value && String(value).trim().length > 0);
      continue;
    }
    if (key === "isSeasonal" && typeof value === "boolean") {
      recipe.isSeasonal = value;
      continue;
    }
    if (key === "name" && typeof value === "string" && value.trim().length > 0) {
      const nextSlug = slugify(value);
      recipes.delete(currentSlug);
      recipe.name = value;
      recipe.slug = nextSlug;
      recipes.set(nextSlug, recipe);
      currentSlug = nextSlug;
      continue;
    }
    if (key === "base" && typeof value === "string") {
      recipe.base = value;
      continue;
    }
    if (key === "tastingNotes") {
      recipe.tastingNotes = value === null ? null : String(value);
      continue;
    }
  }
  return { ...recipe, additions: [...recipe.additions] };
}

export function deleteRecipe(slug: string): boolean {
  return recipes.delete(slug);
}

export function listInventory(): InventoryItem[] {
  return Array.from(inventory.entries()).map(([key, quantity]) => ({
    item: inventoryLabels.get(key) ?? key,
    quantity,
  }));
}

export function setInventory(item: string, quantity: number): InventoryItem {
  const key = item.toLowerCase();
  inventory.set(key, Math.max(0, Math.trunc(quantity)));
  inventoryLabels.set(key, item);
  return { item, quantity: inventory.get(key) ?? 0 };
}

export function adjustInventory(item: string, delta: number): InventoryItem | undefined {
  const key = item.toLowerCase();
  if (!inventory.has(key)) {
    inventory.set(key, 0);
    inventoryLabels.set(key, item);
  }
  const next = (inventory.get(key) ?? 0) + delta;
  if (next < 0) {
    return undefined;
  }
  inventory.set(key, next);
  return { item: inventoryLabels.get(key) ?? item, quantity: next };
}

export function clearInventory(item: string): boolean {
  const key = item.toLowerCase();
  inventoryLabels.delete(key);
  return inventory.delete(key);
}

const ticketSequence = (() => {
  let counter = 1000;
  return () => {
    counter += 1;
    return `TCK-${counter}`;
  };
})();

export function createOrder(input: OrderInput): Order {
  const id = randomUUID();
  const ticket = ticketSequence();
  const status: Order["status"] = "queued";
  const items = input.items.map((item) => ({ ...item }));
  const total = calculateOrderTotal(items);
  const order: Order = {
    id,
    ticket,
    status,
    items,
    total,
    loyaltyEmail: input.loyaltyEmail ?? null,
    history: [{ status, at: new Date().toISOString() }],
  };
  orders.set(ticket, order);
  return cloneOrder(order);
}

export function getOrder(ticketOrId: string): Order | undefined {
  const order = orders.get(ticketOrId) ?? Array.from(orders.values()).find((o) => o.id === ticketOrId);
  return order ? cloneOrder(order) : undefined;
}

export function updateOrderStatus(ticket: string, status: Order["status"], metadata?: Partial<Order>): Order | undefined {
  const order = orders.get(ticket);
  if (!order) return undefined;
  order.status = status;
  order.history.push({ status, at: new Date().toISOString() });
  if (metadata?.pickupCode) {
    order.pickupCode = metadata.pickupCode;
  }
  return cloneOrder(order);
}

export function deleteOrder(ticket: string): boolean {
  return orders.delete(ticket);
}

export function listOrders(): Order[] {
  return Array.from(orders.values()).map(cloneOrder);
}

export function getLoyalty(email: string): LoyaltyAccount | undefined {
  const account = loyaltyAccounts.get(email.toLowerCase());
  return account ? { ...account } : undefined;
}

export function setLoyaltyPoints(email: string, points: number): LoyaltyAccount {
  const key = email.toLowerCase();
  const account: LoyaltyAccount = { email: email.toLowerCase(), points: Math.max(0, points) };
  loyaltyAccounts.set(key, account);
  return { ...account };
}

export function adjustLoyaltyPoints(email: string, delta: number): LoyaltyAccount {
  const current = loyaltyAccounts.get(email.toLowerCase()) ?? { email: email.toLowerCase(), points: 0 };
  const next = Math.max(0, current.points + delta);
  const updated: LoyaltyAccount = { ...current, points: next };
  loyaltyAccounts.set(email.toLowerCase(), updated);
  return { ...updated };
}

export function calculateOrderTotal(items: OrderInput["items"]): number {
  let total = 0;
  for (const item of items) {
    const menuItem = menu.get(item.name.toLowerCase());
    total += menuItem?.price ?? 0;
  }
  return Number(total.toFixed(2));
}

function cloneOrder(order: Order): Order {
  return {
    ...order,
    items: order.items.map((item) => ({ ...item })),
    history: order.history.map((entry) => ({ ...entry })),
  };
}
