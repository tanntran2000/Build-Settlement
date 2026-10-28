import { expect, it } from "vitest";
import { CITY_DESIGN } from "../city-design.js";

it("preserves the three specialist groups and appends The Bound as a display-only stratum", () => {
  expect(CITY_DESIGN.groups.map(group => group.label)).toEqual(['Makers', 'Luminaries', 'Merchants', 'The Bound']);
  expect(CITY_DESIGN.groups).toEqual([
    { label: 'Makers', name: 'The Makers’ Union', duties: 'Production, building and maintenance.' },
    { label: 'Luminaries', name: 'The Luminary Circle', duties: 'Research, education, planning and technical standards.' },
    { label: 'Merchants', name: 'The Mercantile League', duties: 'Trade and distribution.' },
    { label: 'The Bound', name: '', duties: 'Lower resident stratum.' },
  ]);
});

it("supplies shared group influence in content without exclusive Status ownership or intrinsic merchant corruption", () => {
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("All three groups contribute to shared"));
  for (const status of CITY_DESIGN.statuses) {
    expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining(status));
  }
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("conditions, buildings and future effects"));
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("No group owns a single Status"));
  expect(CITY_DESIGN.groupInfluence).toEqual(expect.stringContaining("Merchants have no intrinsic corruption"));
});
