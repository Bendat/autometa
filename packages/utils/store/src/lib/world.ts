import { Injectable } from "@autometa/dependency-injection";

/**
 * Simple storage cache containing name:value pairs.
 *
 * Example:
 * ```
 * World.userCount = 1;
 * expect(World.userCount).toBe(1)
 * ```
 */
@Injectable()
export class World {
  [key: string]: unknown;
}
