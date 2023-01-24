import { PageObject, WebPage, Website } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { Observation } from './observation';

/**
 * Defines an action which can be taken on a {@link WebPage} or an
 * {@link Observation} of a WebPage. An action may include
 * clicking a button or typing text into a field.
 *
 * Construct an Action with {@link ActionOn}
 */
export class Action<T extends PageObject, K extends PageObject> {
  #observer: Observation<T, K>;
  constructor(
    on: Class<T> | Observation<T, K>,
    public readonly action: (item: K) => unknown | Promise<unknown>
  ) {
    this.#observer = Observation.wrapOrReturn(on);
  }

  execute = async (site: Website) => {
    const element = (await this.target.select(site)) as K;
    await this.action(element);
  };

  get target() {
    return this.#observer;
  }
}
/**
 * Creates a new {@link Action} which describes how a user
 * will interact with an {@link WebPage}.
 *
 * For example, a user may want to click on a `HomePage`'s
 * search button.
 *
 * Example:
 * ```
 * const ClickSearch = ActionOn(HomePage, (page) => page.search.click());
 * ```
 * Which in a test can be called by the `will` method:
 * ```
 * await Billy.will(ClickSearch)
 * ```
 * @param subject The WebPage to perform an action on
 * @param action the action that will be performed
 * @returns an Action which can be executed later.
 */
export function ActionOn<T extends WebPage>(
  subject: Class<T>,
  action: (object: T) => unknown | Promise<unknown>
): Action<T, PageObject>;
/**
 * Creates a new {@link Action} which describes how a user
 * will interact with an {@link Observation}.
 *
 * For example, if a user is already observing a `LoginModalComponent`
 * which observes the Login Modal that has a `usernameField`, `passwordField`
 * and `loginButton` and a method `login(username: string, password: string)`
 * which clicks `loginButton` we can perform a login action on that
 * modal:
 * ```
 * const LoginAs = (username: string, password: string) => ActionOn(LoginModalComponent, ({ login }) => login(username, password))
 * ```
 *
 * Which in a test can be called by the `will` function:
 * ```
 * await Robert.will(LoginAs(Credentials.username, Credentials.password))
 * ```
 * Where `Credentials` is some object which contains the users
 * login credentials.
 *
 * @param subject The {@link Observation} to perform an action on.
 * @param action The action to perform on an {@link Observation}
 */
export function ActionOn<T extends PageObject, K extends PageObject>(
  subject: Observation<T, K>,
  action: (object: K) => unknown | Promise<unknown>
): Action<T, K>;
export function ActionOn<T extends PageObject, K extends PageObject>(
  subject: Class<T> | Observation<T, K>,
  action: (object: K) => unknown | Promise<unknown>
) {
  return new Action(subject, action);
}
 