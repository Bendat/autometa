import { WebBrowser } from '@autometa/page-components';
import { Class } from '@autometa/shared-utilities';
import highlight from 'cli-highlight';
import {
  getBrowserMetadata,
  getParticipants,
  getFacilitatorMetadata,
} from '../decorators';
import { Participant } from '../participant';
import { configureParticipant } from '../participant/participant-driver';
import { Participants } from './participants';
import { Builder } from 'selenium-webdriver';

export function createFocusGroupAndFacilitator<T extends Participants<T>>(participants: Class<T>) {
  const group: Participants<T> = new participants();
  const driver = getBrowserMetadata(participants);
  throwIfNoDriverAssigned(driver);
  const participantNames: string[] = getParticipants(participants);
  const facilitatorMetadata = getFacilitatorMetadata(participants);
  const browser = new WebBrowser(driver); 
  const facilitator: Participant = createParticipants(
    participantNames,
    participants,
    group,
    browser,
    facilitatorMetadata
  );
  return {  group, facilitator };
}

function throwIfNoDriverAssigned(driver: Builder) {
  if (!driver) {
    throw new Error(`A Focus group must be configured with a WebDriver builder to start a browser session. 
  To configure a Builder, decorate the Focus Group class with the \`@browser()\` decorator.
  ${highlight(
    `const firefoxBuilder =  new Builder().forBrowser('firefox');
  
  @browser(firefoxBuilder)
  export class Shoppers {
    @browses('myawesomesite.com')
    Robert: User;
  }`,
    { language: 'typescript', ignoreIllegals: true }
  )}
  
  `);
  }
}

function createParticipants<T extends Participants<T>>(
  participants: string[],
  constructor: Class<T>,
  cast: T,
  browser: WebBrowser,
  facilitatorMetadata: string
) {
  let facilitator: Participant;
  for (const participantName of participants) {
    const participant = configureParticipant(
      cast,
      constructor,
      participantName,
      browser
    );
    cast[participantName] = participant as unknown as Participant;
    if (participantName === facilitatorMetadata) {
      facilitator = participant;
    }
  }
  facilitator = facilitator ?? assignSoleParticipantAsFacilitator(participants, cast);
  throwIfNoFacilitatorDefined(facilitator, constructor);
  return facilitator;
}

function assignSoleParticipantAsFacilitator<T extends Participants<T>>(
  participants: string[],
  cast: T
) {
  if (participants.length == 1) {
    const [participant] = participants;
    return cast[participant]
  }
}

function throwIfNoFacilitatorDefined<T extends Participants<T>>(
  facilitator: Participant,
  focusGroup: Class<T>
) {
  if (!facilitator) {
    throw new Error(
      `No facilitator was found for ${focusGroup.name}. A Facilitator is necessary to automatically execute the Webdriver session. 
  To add a facilitator, simply decorate one of the participants (users) of your focus group with the 
  
  \`@facilitator\` 
  
  decorator.`
    );
  }
}
