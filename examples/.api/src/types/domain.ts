export type MenuItem = {
  name: string;
  price: number;
  size: string;
  seasonal: boolean;
  description?: string | null;
  season?: string | null;
};

export type Recipe = {
  name: string;
  slug: string;
  base: string;
  additions: string[];
  season: string | null;
  isSeasonal: boolean;
  tastingNotes?: string | null;
};

export type RecipeInput = {
  name: string;
  base: string;
  additions?: string[];
  season?: string | null;
  tastingNotes?: string | null;
};

export type OrderItem = {
  name: string;
  size?: string | null;
  shots?: number | null;
  milk?: string | null;
  sweetener?: string | null;
};

export type PaymentDetails = {
  method?: "tap" | "chip" | "cash" | "mobile";
  amount?: number;
  currency?: string;
};

export type Order = {
  id: string;
  ticket: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  loyaltyEmail?: string | null;
  pickupCode?: string | null;
  history: Array<{
    status: OrderStatus;
    at: string;
  }>;
};

export type OrderStatus = "queued" | "brewing" | "ready" | "paid" | "cancelled";

export type OrderInput = {
  items: OrderItem[];
  payment?: PaymentDetails;
  loyaltyEmail?: string | null;
};

export type InventoryItem = {
  item: string;
  quantity: number;
};

export type LoyaltyAccount = {
  email: string;
  points: number;
};
