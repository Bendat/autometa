import { Component } from ".";
import { ElementArray } from "../components/lazy-element-array";
import { ConstructionOptions } from "../types";

export interface Click {
  (): Promise<void>;
}
export interface Read {
  (): Promise<string>;
}
export interface Write {
  (): Promise<void>;
}
export interface Submit {
  (): Promise<void>;
}
export interface Find {
  <T extends Component>(
    options: ConstructionOptions<T>,
    name: string
  ): Promise<T>;
}
export interface FindAll {
  <T extends Component>(options: ConstructionOptions<T>): ElementArray<T>;
}
