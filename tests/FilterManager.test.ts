import "jest";
import { FilterManager } from "../src/FilterManager";

describe("FilterManager", () => {
    it("should build an empty filter manager", () => {
        const fm = new FilterManager();
        expect(fm).toBeDefined();
    });

    it ("should process logical operations", () => {
        const fm = new FilterManager();

        expect(fm.applyOperation("!=", 1, 2)).toBeTruthy();
        expect(fm.applyOperation("!=", 1, 1)).toBeFalsy();

        expect(fm.applyOperation("=", 1, 1)).toBeTruthy();
        expect(fm.applyOperation("=", 1, 2)).toBeFalsy();

        expect(fm.applyOperation(">", 1, 0)).toBeTruthy();
        expect(fm.applyOperation(">", 1, 1)).toBeFalsy();
        expect(fm.applyOperation(">", 1, 2)).toBeFalsy();

        expect(fm.applyOperation("<", 1, 2)).toBeTruthy();
        expect(fm.applyOperation("<", 1, 1)).toBeFalsy();
        expect(fm.applyOperation("<", 1, 0)).toBeFalsy();
    });

    it("should update filters", () => {
        const fm = new FilterManager();
        fm.update("sample-filter", "socket-id");
    });

    it("should remove filters", () => {
        const fm = new FilterManager();
        fm.removeFilter("socket-id");
    });
});
