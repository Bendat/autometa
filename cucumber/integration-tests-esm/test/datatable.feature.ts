import {
  Feature,
  Given,
  Scenario,
  HTable,
  VTable,
  MTable,
  ListTable,
} from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
Feature(() => {
  Scenario("HTable", () => {
    Given(
      "a table",
      (table: HTable) => {
        expect(table.get("name")).toStrictEqual(["alien", "titanic"]);
        expect(table.get("name", 0)).toStrictEqual("alien");
        expect(table.get("director")).toStrictEqual([
          "Ridley Scott",
          "James Cameron",
        ]);
        expect(table.get("director", 0)).toStrictEqual("Ridley Scott");
        expect(table.toList()).toStrictEqual([
          { name: "alien", director: "Ridley Scott" },
          { name: "titanic", director: "James Cameron" },
        ]);
        expect(table.json(0)).toStrictEqual({
          name: "alien",
          director: "Ridley Scott",
        });
      },
      HTable
    );
  });
  Scenario("VTable", () => {
    Given(
      "a table",
      (table: VTable) => {
        console.log(table);
        expect(table.get("name")).toStrictEqual(["alien", "titanic"]);
        expect(table.get("name", 0)).toStrictEqual("alien");
        expect(table.get("director")).toStrictEqual([
          "Ridley Scott",
          "James Cameron",
        ]);
        expect(table.get("director", 0)).toStrictEqual("Ridley Scott");
        expect(table.toList()).toStrictEqual([
          { name: "alien", director: "Ridley Scott" },
          { name: "titanic", director: "James Cameron" },
        ]);
        expect(table.json(0)).toStrictEqual({
          name: "alien",
          director: "Ridley Scott",
        });
      },
      VTable
    );
  });
  Scenario("MTable", () => {
    Given(
      "a table",
      (table: MTable) => {
        expect(table.get("large", "green")).toBe("hill");
        expect(table.get("small", "red")).toBe("raspberry");
        expect(table.col("blue")).toEqual(["ocean", "pond", "puddle"]);
      },
      MTable
    );
  });
  Scenario.only("ListTable", () => {
    Given(
      "a table",
      (table: ListTable) => {
        expect(table.get(0)).toEqual(["alien", "Ridley Scott"]);
        expect(table.get(0, 0)).toEqual("alien");
      },
      ListTable
    );
  });
}, "./datatable.feature");
