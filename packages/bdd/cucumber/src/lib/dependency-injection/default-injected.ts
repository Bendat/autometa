import { registerProvider } from '@autometa/dependency-injection';
import { World, Store } from '@autometa/store';

registerProvider({
  World: World,
  Store: Store,
});
