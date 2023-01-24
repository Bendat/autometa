import { PageObject, WebPage, Website } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
/**
 * An Observation describes how a user will see parts of
 * the webpage that are relevant to them. From a Webpage,
 * a user ay want to, for example, focus on the search options sidebar.
 * To that effect, the observe the sidebar on the web page. They may also
 * want to further focus, for example, onto the "Visual Appearance" section
 * which has "color", "shape", and "size" options. For this, an observation
 * on that section can be derived from the sidebar observation on the web page.
 *
 * To construct, use the {@link Observe} function.
 */
export class Observation<T extends PageObject, K> {
  constructor(type: Class<T>, selector: (item: T) => K | Promise<K>);
  constructor(
    type: Observation<PageObject, T>,
    selector: (item: T) => K | Promise<K>
  );
  constructor(
    type: Class<T> | Observation<PageObject, T>,
    selector: (item: T) => K | Promise<K>
  );
  constructor(
    public readonly type: Class<T> | Observation<PageObject, T>,
    public readonly selector: (item: T) => K | Promise<K>
  ) {}
  /**
   * Retrieves the innermost value of this Observation, such as a component
   * from a WebPage, or from another Observation.
   * @param site The Website which the user is viewing
   * @returns The extracted innermost element or result from this observation chain
   */
  async select(site: Website) {
    const type = this.type;
    if (type instanceof Observation) {
      const innerType = await type.select(site);
      const inner = this.#innerAsWebPage(site, innerType);
      const po = innerType as T;
      return this.selector((inner ?? po) as T);
    }
    const page = site.switch(type as unknown as Class<WebPage>);
    return this.selector(page as unknown as T);
  }

  #innerAsWebPage(site: Website, innerType: Class<PageObject> | PageObject) {
    if (!(innerType instanceof PageObject)) {
      const inst = new innerType();
      return this.#checkInnerIsWebPage(site, innerType, inst);
    }
  }
  #checkInnerIsWebPage(
    site: Website,
    innerType: Class<PageObject> | PageObject,
    instance: PageObject
  ) {
    if (instance instanceof WebPage) {
      return site.switch(innerType as unknown as Class<WebPage>);
    } else {
      throw new Error(`Unrecognized type '${innerType}: ${typeof innerType}'`);
    }
  }
  /**
   * Does not work as expected.
   * @param from
   * @returns
   */
  static wrapOrReturn<T extends PageObject, K extends PageObject>(
    from: Class<T> | Observation<T, K>
  ) {
    if (from instanceof Observation) {
      return from;
    } else {
      return new Observation(from, () => from as unknown as K);
    }
  }
}
/**
 * Creates a new Observation from a class blueprint of
 * a WebPage, with a callback that describes how to extract a
 * value from that Web Page.
 *
 * An observation describes how a user would view a specific
 * part of a Webpage to extract information from it.
 * For example, given:
 * ```
 * class MyHomePage {
 *  ‎@component(By.ID('some-id'))
 *  login: Button
 * }
 * ```
 * We can observe the pages Login button with
 * ```
 * const LoginButtonText = Observer(MyHomePage, ({ login })=> login.text)
 * ```
 * Which in a test can be called by the `will.see` method with an assertion:
 * ```
 * await Billy.will.see(LoginButtonText, Is('Login'))
 * ```
 * @param type The Webpage class blueprint to select against
 * @param selector A function which can extract a value from the observed WebPage
 * @returns an {@link Observation} of a WebPage for a value
 */
export function Observe<T extends WebPage, K>(
  type: Class<T>,
  selector: (page: T) => K | Promise<K>
): Observation<T, K>;
/**
 * Creates a new Observation from a class blueprint of
 * another Observation, with a callback that describes how to extract a
 * value from that Observation.
 *
 * An observation describes how a user would view a specific
 * part of a Webpage to extract information from it.
 * For example, given (Where LoginModal has a `usernameField`, `passwordField`, `loginButton`):
 * ```
 * class MyHomePage {
 *  ‎@component(By.ID('some-id'))
 *  loginComponent: LoginComponent
 * }
 * ```
 * And an observer for the modal:
 * ```
 * const LoginModal = Observer(MyHomePage, ({ loginComponent })=> loginComponent)
 * ```
 *
 * We can further observe the modal and look directly for the `userNameField` property
 * ```
 * const Username = Observe(LoginModal, ({ usernameField }) => username)
 * ```
 * Whi
 * @param type The Webpage class blueprint to select against
 * @param selector A function which can extract a value from the observed WebPage
 * @returns an {@link Observation} of a an Observation for a value
 */
export function Observe<T extends PageObject, K>(
  type: Observation<PageObject, T>,
  selector: (page: T) => K | Promise<K>
): Observation<T, K>;

export function Observe<T extends PageObject, K>(
  type: Class<T> | Observation<PageObject, T>,
  selector: (page: T) => K | Promise<K>
): Observation<T, K> {
  return new Observation<T, K>(type, selector);
}
