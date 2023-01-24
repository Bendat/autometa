import { Website } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import { Participants } from '..';
import { Participant } from '../participant';
import { assignPerformance } from '../participant/participant-driver';
import { TechnicalPerformance } from '../performances';
import { createFocusGroupAndFacilitator } from './construct-focus-group';

export class FocusGroup {
  /**
   * Instantiates a class which defines {@link Participants} for its
   * properties. Constructs the participants according to their decorator
   * data.
   *
   * Once instantiated, assigns a facilitator who will automatically start the
   * Webdriver once they are executed in a test.
   * @param participants A Class implementing {@link Participants}
   * @returns A {@link Participant} who has been decorated as the facilitator, that has
   * been configured to start a WebDriver when executed.
   */
  static begin<T extends Participants<T>>(participants: Class<T>): Participant {
    const { facilitator } = createFocusGroupAndFacilitator(participants);
    const site: Website = Reflect.getMetadata('participant:site', facilitator);
    const startupPerformance = new TechnicalPerformance(
      'start',
      async () =>  await site.start()
    );
    assignPerformance(facilitator, startupPerformance);
    return facilitator;
  }
}
