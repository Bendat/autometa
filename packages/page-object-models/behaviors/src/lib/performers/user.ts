import 'reflect-metadata';
import {
  ExtendedActionFn,
  ExtendedObserverFn,
  ExtendedThoughtFn,
  Thenable,
} from '.';
import { NoPlans, Plans } from '../plans';
import { ContextHandler, WindowContext } from '../subplot';

export interface User<T extends Plans = NoPlans> extends Thenable<User<T>> {
 /**
  * `will` is both a property and a method. When used as a method, it will
  * execute an arbitrary number of actions in the order they are defined. As many
  * actions as you like may be executed by a single `will` but be aware you cannot
  * make observations until all actions in this group complete.
  * 
  * When used as a property, `will` returns an instance of the User and can be
  * used to produce natural language-like test chains
  * 
  * Te
  * Example:
  * ```
  * // Perform an action
  * await Johnny.will(LoginAs(credentials.Johnny), GoToBasket, ClearBasket)
  * 
  * // Semantic chains with other behaviors:
  * await Johnny.will.see(AValue, IsNumber(9)).and(AnotherValue, IsNumber(10)).and.will(PurchaseValues)
  * ```
  * 
  */
  will: ExtendedActionFn;
   /**
   * Attempts to make an observation on the web page, asserting that
   * some expected value was met or state was found.
   *
   * The observation result can be a component or a value extracted from a component (such as a text string)
   * Some assertions may require an actual Page Object such as `HasTitle`, which handles
   * extracting the web page title by itself, and can be given a max timeout for it to occur.
   * ```
   * await Johnny.will.see(SearchResultTitles, Includes('32 Piece Hardwood Jigsaw Puzzle'))
   * await Johnny.will.see(MyPage, HasTitle('Football', Within(10, Seconds)))
   * ```
   * @param observer The observation or WebPage blueprint whos value will be asserted
   * @param assertion The assertion to apply.
   * @returns An instance of this user.
   */
  see: ExtendedObserverFn;
  /**
   * Emulates a user pausing. A pause can occur for a specific amount of time, or
   * it can be until some WebDriver condition is met (e.g until.elementIsPresent) which
   * may be useful for slow-completing operations that a regular observation may fail due to timeout.
   * 
   * It can also be used in debugging to hold a point of execution for examination
   */
  think: ExtendedThoughtFn;
    /**
   * Starts the users story, enabling the WebDriver and sharing it with this
   * users community.
   */
  start: () => Promise<void>;

  /**
   * Finishes the users stor, quitting the WeDriver and finalizing the test
   */
  finish: () => Promise<void>;
  /**
   * Manually invoke the USER to begin executing their async actions. Must be called
   * with `await` or `.then`
   */
  run: () => Promise<void>;

  /**
   * Starts a subplot, allowing a second user to execute their userbehaviors
   * on a new window or tab etc before returning test execution back to the top
   * level test user
   */
  meanwhile: <K extends User>(
    user: K | (() => K) | (() => Promise<K>),
    context: WindowContext,
    then: ContextHandler
  ) => User;

  /**
   * Returns the {@see (import("..\..\").Plans)} associated with this user if any (defauls to NoPlans).
   */
  get plans(): T;
}
