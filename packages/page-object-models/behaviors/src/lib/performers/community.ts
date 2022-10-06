import { Browser } from '@autometa/page-components';
import { Builder } from 'selenium-webdriver';
import { constructor } from 'tsyringe/dist/typings/types';
import { plansKey, User, UserDriver } from '.';
import {
  browsesKey,
  defaultDriverKey,
  namedDriverKey,
  nameKey,
  NoPlans,
  roleKey,
} from '..';
export abstract class Community {
  [key: string]: User<any> | Browser;
  static of = <T extends Community>(community: constructor<T>) => {
    // needs deorator construction
    const inst = constructCommunity(community)

    return {
      following: async <TUser extends User>(
        chooses: keyof T | ((community: T) => TUser)
      ): Promise<TUser> => {
        const chosen: User =
          typeof chooses === 'function' ? chooses(inst as unknown as T) : inst[chooses] as  User;
        await chosen.start();
        return inst;
      },
    };
  };
}

function constructCommunity(community: constructor<Community>){
  const cast: Community = new community();
  const names: Set<string> = Reflect.getMetadata(nameKey, cast.constructor);
  for (const name of names.values()) {
    const roleData = Reflect.getMetadata(roleKey(name), community);
    const siteData = Reflect.getMetadata(browsesKey(name), community);
    const driver: Builder =
      Reflect.getMetadata(namedDriverKey(name), community) ??
      Reflect.getMetadata(defaultDriverKey, community);
    const plans = Reflect.getMetadata(plansKey(name), community) ?? NoPlans;
    cast[name] = new UserDriver(
      name,
      roleData[name].role,
      siteData[name],
      new Browser(driver),
      plans
    ) as unknown as User;
    Reflect.defineProperty(cast[name], 'community', community);
  }
  return cast
}
