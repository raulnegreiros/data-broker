import "jest";
import { Notification } from "../src/subscription/Notification";

describe("Notification", () => {
    it ("should build an empty Notification", (done) => {
        const obj = new Notification();
        expect(obj.topic).toEqual("");
        expect(obj.attrs).toEqual([]);
        done();
    });
});
