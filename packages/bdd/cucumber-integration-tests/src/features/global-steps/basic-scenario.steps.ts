import 'reflect-metadata'
import { Feature, TopLevelRun, GlobalRun } from "@autometa/cucumber";
import { useConsoleGroups } from "@autometa/logging";
// import {Foo} from './test-class'
import './step-class.steps'
import path from 'path';
useConsoleGroups()
jest.setTimeout(100000)

new GlobalRun().assembleFeature('./basic-scenario.feature')
