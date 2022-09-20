import { Feature, GlobalCacheAssembler } from "@autometa/cucumber";
import { useConsoleGroups } from "@autometa/logging";
import './step-defs.steps'
useConsoleGroups()
jest.setTimeout(100000)
const assembler = new GlobalCacheAssembler()
assembler.assembleFeature('./basic-scenario.feature')