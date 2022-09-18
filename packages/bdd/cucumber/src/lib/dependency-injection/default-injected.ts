import { registerProvider } from '@autometa/utils-dependency-injection';
import { World, Store } from '@autometa/utils-store';

registerProvider({
  World: World,
  Store: Store,
});
