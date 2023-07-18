import { DataTable } from "../table-types/data-table";
import { Class } from "@autometa/types";

export const TableTypeSymbol = Symbol("tableType");

export function Table<T extends DataTable>(tableType: Class<T>) {
    return function (target: unknown) {
        Object.defineProperty(target, TableTypeSymbol, {
            value: tableType,
            enumerable: false,
            writable: false,
            configurable: false
        });
    };
}
