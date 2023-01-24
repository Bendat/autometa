export interface ThenableParticipant<T = never> {
  private then<K = unknown>(
    onFulfilled?:
      | ((value: T) => K | PromiseLike<K>)
      | undefined
      | null
  ): Promise<Participant>;
}

export interface Conjunction {
  and: ParticipantPerformingAction | ParticipantMakingObservations;
}
export interface Will extends Conjunction {
  /**
   * Provides the same functionality as {@link Base.will},
   * while exposing the {@link Will.see} call when used as a property.
   */
  and: ParticipantPerformingAction & Base;
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
  see: ParticipantMakingObservations;
}
export interface See extends Conjunction, Base {
  /**
   * Provides the same functionality as {@link Will.see},
   * while exposing the {@link Base.will} call when used as a property.
   */
  and: ParticipantMakingObservations & Base & Will;
}
export interface Base{
  /**
   * `will` is both a property and a method. When used as a method, it will
   * execute an arbitrary number of actions in the order they are defined. As many
   * actions as you like may be executed by a single `will` but be aware you cannot
   * make observations until all actions in this group complete.
   *
   * When used as a property, `will` returns an instance of the User and can be
   * used to produce natural language-like test chains
   *
   *
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
  will: ParticipantPerformingAction;
}

export type Starting = Base;
interface NamedUser{
  name: string
}

export type Participant<T = Starting> = {
  [K in keyof T]: T[K];
} & ThenableParticipant & NamedUser;

/**
 * Describes a participant who's trying to 'see' {@link Will.see}
 * an observation on the page, and assert some expectation against it.
 *
 * For example, if observing the Webpage itself, a title may be asserted against
 *
 * ```
 * await Johnny.will.see(MyHomePage, HasTitle('Johnny's Blog'))
 * ```
 *
 * While for an observation of a button component `loginButton` that should have
 * the text `Log Me In`
 *
 * ```
 * await Johnny.will.see(LoginWidget, Is('Log Me In'))
 * ```
 */
export interface ParticipantMakingObservations extends Base {
  <T extends PageObject, K>(
    observer: Class<T> | Observation<T, K>,
    assertion: AssertionFn
  ): Participant<See>;
}

/**
 * Describes a participant who 'will'  {@link Starting.will} try and
 * perform an/a list of action(s) on the page or an observation
 *
 * For example, logging in with a `LoginWidget`
 *
 * ```
 * await Johnny.will(EnterUsername('Johnny'), EnterPassword('pw1234'), ClickLoginButton)
 *
 * ```
 * 
 * Exposes the {@link Will.see} method is used as a property member.
 */
export interface ParticipantPerformingAction {
  <T extends PageObject, K extends PageObject>(
    ...actions: Action<T, K>[]
  ): Participant<Will>;

  /**
   * When called, the Participant will assert some expectation
   * against the resulting value of an observation.
   *
   * {@link Will.see}
   */
  see: ParticipantMakingObservations;
}
