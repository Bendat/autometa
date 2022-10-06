import {
  action,
  HasTitle,
  observation,
  Plans,
  StepOf,
} from '@autometa/behaviors';
import { LoginAs } from '../behaviours/actions/homepage-actions';
import { credentials } from '../communities/credentials';
import { SauceDemo } from '../page-objects/pages/homepage';

type JohnnyStep = StepOf<JohnnyLoginPlans>;

export class JohnnyLoginPlans extends Plans {
  @action(LoginAs(credentials.Johnny))
  toLoginWithCredentials: JohnnyStep;

  @observation(SauceDemo, HasTitle('Swag Labs'))
  toSeeTitle: JohnnyStep;
}

export class JennyGooglePlans extends Plans {
  toSearchForPuppies: StepOf<JennyGooglePlans>;
}
