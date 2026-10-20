import { expect, it } from "vitest";
import { CITY_DESIGN } from "../city-design.js";

it("supplies shared group influence in content without exclusive Status ownership or intrinsic merchant corruption", () => {
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("All three groups contribute to shared"));
  for (const status of CITY_DESIGN.statuses) {
    expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining(status));
  }
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("conditions, buildings and future effects"));
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("No group owns a single Status"));
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("Merchants have no intrinsic corruption"));
});
