import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
  Recipe,
} from "../../../.api/src/types/domain.js";
import type { BrewBuddyWorldBase, TagRegistryEntry } from "../world";

export class BrewBuddyMemoryService {
  constructor(private readonly worldAccessor: () => BrewBuddyWorldBase) {}

  private get world(): BrewBuddyWorldBase {
    return this.worldAccessor();
  }

  rememberMenuSnapshot(items: MenuItem[]): void {
    this.world.scenario.menuSnapshot = items;
  }

  rememberLastMenuItem(item: MenuItem): void {
    this.world.scenario.lastMenuItem = item;
  }

  rememberOrder(order: Order): void {
    this.world.scenario.order = order;
    this.world.aliases.orders.set(order.ticket, order);
  }

  setTicketAlias(alias: string, ticket: string): void {
    this.world.aliases.tickets.set(alias, ticket);
  }

  resolveTicket(reference: string): string {
    return this.world.aliases.tickets.get(reference) ?? reference;
  }

  rememberLoyalty(account: LoyaltyAccount): void {
    this.world.scenario.loyaltyAccount = account;
  }

  rememberInventory(inventory: InventoryItem): void {
    this.world.scenario.lastInventory = inventory;
  }

  rememberRecipeSlug(name: string, slug: string): void {
    this.world.aliases.recipes.set(name.toLowerCase(), slug);
  }

  resolveRecipeSlug(name: string): string {
    return this.world.aliases.recipes.get(name.toLowerCase()) ?? name;
  }

  rememberRecipes(recipes: Recipe[]): void {
    for (const recipe of recipes) {
      this.rememberRecipeSlug(recipe.name, recipe.slug);
    }
  }

  rememberBrewRatio(ratio: string): void {
    this.world.scenario.brewRatio = ratio;
  }

  rememberTagRegistry(entries: TagRegistryEntry[]): void {
    this.world.scenario.tagRegistry = entries;
  }

  rememberTagExpression(expression: string, selected: string[]): void {
    this.world.scenario.tagExpression = expression;
    this.world.scenario.selectedScenarioNames = selected;
  }
}
