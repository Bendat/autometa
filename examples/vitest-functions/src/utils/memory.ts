import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
  Recipe,
} from "../../../.api/src/types/domain";
import type { BrewBuddyWorldBase, TagRegistryEntry } from "../world";

export class BrewBuddyMemoryService {
  // World reference is injected lazily via the test container.
  // Using definite assignment assertion because the decorator ensures the property is populated on first access.
  private world!: BrewBuddyWorldBase;

  private get state(): BrewBuddyWorldBase {
    const world = this.world;
    if (!world) {
      throw new Error("BrewBuddyMemoryService is missing world scope binding");
    }
    return world;
  }

  rememberMenuSnapshot(items: MenuItem[]): void {
    this.state.scenario.menuSnapshot = items;
  }

  rememberLastMenuItem(item: MenuItem): void {
    this.state.scenario.lastMenuItem = item;
  }

  rememberOrder(order: Order): void {
    this.state.scenario.order = order;
    this.state.aliases.orders.set(order.ticket, order);
  }

  setTicketAlias(alias: string, ticket: string): void {
    this.state.aliases.tickets.set(alias, ticket);
  }

  resolveTicket(reference: string): string {
    return this.state.aliases.tickets.get(reference) ?? reference;
  }

  rememberLoyalty(account: LoyaltyAccount): void {
    this.state.scenario.loyaltyAccount = account;
  }

  rememberInventory(inventory: InventoryItem): void {
    this.state.scenario.lastInventory = inventory;
  }

  rememberRecipeSlug(name: string, slug: string): void {
    this.state.aliases.recipes.set(name.toLowerCase(), slug);
  }

  resolveRecipeSlug(name: string): string {
    return this.state.aliases.recipes.get(name.toLowerCase()) ?? name;
  }

  rememberRecipes(recipes: Recipe[]): void {
    for (const recipe of recipes) {
      this.rememberRecipeSlug(recipe.name, recipe.slug);
    }
  }

  rememberBrewRatio(ratio: string): void {
    this.state.scenario.brewRatio = ratio;
  }

  rememberTagRegistry(entries: TagRegistryEntry[]): void {
    this.state.scenario.tagRegistry = entries;
  }

  rememberTagExpression(expression: string, selected: string[]): void {
    this.state.scenario.tagExpression = expression;
    this.state.scenario.selectedScenarioNames = selected;
  }
}
