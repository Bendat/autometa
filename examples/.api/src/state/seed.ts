import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
  Recipe,
} from "../types/domain.js";

export type SeedState = {
  menu: MenuItem[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  loyalty: LoyaltyAccount[];
  orders: Order[];
};

export const defaultMenu = (): MenuItem[] => [
  { name: "Espresso", price: 3, size: "single", seasonal: false },
  { name: "Flat White", price: 4.5, size: "12oz", seasonal: false },
  { name: "Iced Cold Brew", price: 5, size: "16oz", seasonal: false },
  { name: "Golden Latte", price: 5.5, size: "12oz", seasonal: true, season: "East" },
  { name: "Midnight Mocha", price: 6, size: "16oz", seasonal: true, season: "West" },
  { name: "Citrus Cold Foam", price: 5.5, size: "12oz", seasonal: true, season: "EU" },
];

export const defaultRecipes = (): Recipe[] => [
  {
    name: "Espresso",
    slug: "espresso",
    base: "espresso",
    additions: [],
    season: null,
    isSeasonal: false,
  },
  {
    name: "Flat White",
    slug: "flat-white",
    base: "espresso",
    additions: ["steamed milk", "microfoam"],
    season: null,
    isSeasonal: false,
  },
];

export const defaultInventory = (): InventoryItem[] => [
  { item: "Espresso", quantity: 50 },
  { item: "Flat White", quantity: 50 },
  { item: "Iced Cold Brew", quantity: 30 },
];

export const defaultLoyalty = (): LoyaltyAccount[] => [
  { email: "lena@example.com", points: 120 },
];

export const defaultOrders = (): Order[] => [];

export const createSeedState = (): SeedState => ({
  menu: defaultMenu(),
  recipes: defaultRecipes(),
  inventory: defaultInventory(),
  loyalty: defaultLoyalty(),
  orders: defaultOrders(),
});
