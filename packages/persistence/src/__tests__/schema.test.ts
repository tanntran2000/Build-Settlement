import { expectTypeOf, it } from "vitest";
import type { GameState } from "@haven/core";
import type { WorldSaveData } from "../schema.js";

// The typecheck:persistence gate enforces these equalities; Vitest alone does not check types.
it("preserves the six R1 save type contracts", () => {
  expectTypeOf<WorldSaveData["currentDate"]>().toEqualTypeOf<GameState["currentDate"]>();
  expectTypeOf<WorldSaveData["settlements"]>().toEqualTypeOf<GameState["settlements"]>();
  expectTypeOf<WorldSaveData["activeSettlementId"]>().toEqualTypeOf<GameState["activeSettlementId"]>();
  expectTypeOf<WorldSaveData["worldSeed"]>().toEqualTypeOf<GameState["worldMetadata"]["worldSeed"]>();
  expectTypeOf<WorldSaveData["gameVersion"]>().toEqualTypeOf<GameState["worldMetadata"]["gameVersion"]>();
  expectTypeOf<WorldSaveData["schemaVersion"]>().toEqualTypeOf<number>();
});
