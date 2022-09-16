import { registerProvider } from '@automaton/utils-dependency-injection';
import { World, Store } from '@automaton/utils-store';

registerProvider({
  World: World,
  Store: Store,
});
