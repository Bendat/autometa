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
export abstract class FocusGroup {
  [key: string]: User<any>;
  static of = <T extends FocusGroup>(community: constructor<T>) => {
    // needs deorator construction
    const inst = constructFocusGroup(community)
    // inst.facilitator.start()
    return {
      begin: () => {
        // get facilitator metadata
        return inst
      },
      conclude: ()=>{
        for(const member in inst){
          inst[member].finish()  
        }
      },
      members: inst
    }
    // return {
    //   ...inst,   
    //   conclude: inst.facilitator.finish,
    //   following: async <TUser extends User>(
    //     chooses: keyof T | ((community: T) => TUser)
    //   ): Promise<TUser> => {
    //     const chosen: User =
    //       typeof chooses === 'function' ? chooses(inst as unknown as T) : inst[chooses] as  User;
    //     await chosen.start();
    //     return inst;
    //   },
    // };
  };
}

function constructFocusGroup(focusGroup: constructor<FocusGroup>){
  const cast: FocusGroup = new focusGroup();
  const names: Set<string> = Reflect.getMetadata(nameKey, cast.constructor);
  for (const name of names.values()) {
    const roleData = Reflect.getMetadata(roleKey(name), focusGroup);
    const siteData = Reflect.getMetadata(browsesKey(name), focusGroup);
    const driver: Builder =
      Reflect.getMetadata(namedDriverKey(name), focusGroup) ??
      Reflect.getMetadata(defaultDriverKey, focusGroup);
    const plans = Reflect.getMetadata(plansKey(name), focusGroup) ?? NoPlans;
    cast[name] = new UserDriver(
      name,
      roleData[name].role,
      siteData[name],
      new Browser(driver),
      plans
    ) as unknown as User;
    Reflect.defineProperty(cast[name], 'focusGroup', focusGroup);
  }
  return cast
}
