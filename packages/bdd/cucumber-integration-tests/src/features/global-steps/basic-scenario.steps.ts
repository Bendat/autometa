import 'reflect-metadata';
import { GlobalRun } from '@autometa/cucumber';
import { useConsoleGroups } from '@autometa/logging';
import './step-class.step-defs';

useConsoleGroups();

jest.setTimeout(100000);

new GlobalRun().assembleFeature('./basic-scenario.feature');
