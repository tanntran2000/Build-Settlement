# WP-VALIDATION-GUARDS-01 — R1 Closure Implementation Plan v1.1

> Antigravity single-writer; Codex review, Tester độc lập. Thực hiện theo `superpowers:executing-plans`; không thêm writer. Scope validation sau tooling đã được Human duyệt, Human yêu cầu vững R1 trước khi cân nhắc demo. Coordinator ghi nhận exact WP v1.1/hash trước G2. Bản này thay draft trước; mọi liên hệ demo/launcher/đóng gói trong draft trước **bị hoãn**, không phải authorization triển khai.

**Goal:** sửa đúng 4 nhóm runtime-validation gap đã tái hiện và bổ sung regression còn thiếu cho acceptance R1 gốc. **Architecture:** chỉ thêm pure guards trong validateGameState, dùng dispatcher pre/post validation đã có; giữ all-or-nothing và taxonomy. Không clamp/sanitize, không mới subsystem/save schema. **Tech stack:** TypeScript/Vitest hiện có, không thêm package/config. **Spec:** AGENTS LAW-01/02/03/04/05/06/07/08, WP-R1-r2 §1.1/§1.3/§2/§3; R1-CLOSURE-CHECKLIST.md kèm gói.

## 1. Điều kiện bắt đầu / scope

- [x] **Chốt tooling trước:** 2 MD012 ở verification supported-format:102 và WP supported-format:85, cùng evidence binding, hiện vẫn HOLD chờ Agy sửa/review. Không gán “đã xong” từ Builder hoặc runtime PASS. Sau audit, khóa HEAD/branch + toàn bộ raw file hashes, source/config/lock và accepted log identity làm base mới. HEAD hiện là 0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675 / fix/foundation-state-boundaries-01; không dùng snapshot đang viết làm final base.
- [x] **Modify source:** chỉ `packages/core/src/domain/gamestate.ts`. **Modify regression:** chỉ `packages/core/src/domain/__tests__/domain.test.ts`, `packages/simulation/src/__tests__/dispatcher.test.ts`. **Docs:** append HANDOFF/tracker, tạo exact WP `docs/work_packages/WP-VALIDATION-GUARDS-01.md` và evidence `docs/verification/VALIDATION-GUARDS-01.md`. Freeze mọi source/test khác, configs/lock/CI, economy, UI, persistence schema và historical specs/plans. Không sửa demo artifact.
- [x] Dispatcher production giữ nguyên: callers `executeCommand` prevalidation :12, postvalidation :72 đã nhận guard mới tự nhiên. UI vẫn gọi dispatcher :85, không sửa state trực tiếp. Private predicates trong gamestate.ts được phép; giữ public signature/result-code set, không export thêm API. Dùng `INVALID_STATE` cho các guard mới, dispatcher failure vẫn nested `error.code`. Không gọi factory để clone/chữa state.

## 2. Contract guard chính xác

| Nhóm | Điều phải thực hiện | Ranh giới không tự suy diễn |
| --- | --- | --- |
| Metadata | Required finite number worldSeed; required typeof string gameVersion | WorldMetadata/schema chỉ khóa number/string. Chấp nhận seed finite 0/âm/phân số trong WP này; không uint32/positive/integer/RNG mới. Không semver/nonblank rule cho gameVersion; empty string chưa bị current contract cấm. |
| Authority/reputation | Required finite number [0,100], decimal trong miền hợp lệ | Chỉ Settlement fields theo settlement.ts:41–42,54–59. Không áp cho prestige/diplomatic reputation khác. Không clamp. Nếu có spec signed-reputation mâu thuẫn phải HOLD đối chiếu, không tự đổi factory/law. |
| Status | Required đúng union unexplored/discovered/active/handoff/legacy | Giữ pointer 0/1 active hai chiều. Không đòi governor/charter ở legacy/handoff hoặc tự chạy legacy AI. |
| Facilities | Required array; member object non-null, không array; id/name/type strings; stage thuộc planning/site_prep/construction/operational/damaged; level/capacity/assignedWorkerCount finite numbers; optional assignedManagerId absent/string | Theo Facility interface. Chưa tự ép nonempty/unique IDs, blueprint membership, stage transition, referenced manager existence hoặc số nguyên/nonnegative/maximum worker/capacity nếu chưa có contract riêng. Không biến sửa validation thành xây assignment/building system. |

Giữ unknown extension keys như hiện tại để clone-error regression vẫn đi vào EXECUTION_ERROR, không reject mọi extra field. Không thêm guards dayCreated/enum Cohort/memory/relations beyond scope đã duyệt; phát hiện mới thì báo chốt scope riêng. Không đổi schemaVersion, save/load hoặc migration. Guard trả false/error rõ, không throw với malformed plain JSON-like payload trong bảng.

## 3. RED/GREEN + regression guards (2 test files hiện có)

- [x] **Metadata RED:** {} hoặc thiếu riêng từng trường, seed string/null/NaN/±Infinity, version undefined/null/number phải false INVALID_STATE không throw/mutate. Positive controls valid metadata, finite 0/âm/phân số seed và string version (kể cả empty theo current contract). Mỗi payload chỉ sai một điều để pin guard độc lập.
- [x] **Authority/reputation RED:** từng field riêng tại -1, >100, NaN, ±Infinity, string/null/undefined reject; 0,50.5,100 valid. Source `createSettlement` là căn cứ miền [0,100], không phải giả định của Reviewer; không sửa factory để test xanh.
- [x] **Status/facility RED:** mỗi union value với pointer đúng vẫn valid, unknown/null/number/missing status reject. [] và shelter template UI valid; null/nonarray facilities, null/array/primitive member, thiếu/sai required field, stage lạ, numeric nonfinite reject; optional manager absent/string valid, wrong type reject. Không gộp nhiều field sai trong một fixture hoặc thêm domain bounds chưa duyệt.
- [x] **Pre-gate tests:** mỗi nhóm invalid qua executeCommand trả INVALID_STATE trước command syntax/authority/handler; spy handler không chạy. Trả cùng state reference, deep snapshot gồm clock/kho/NPC/cohort không đổi, không effects/audit success. Dùng malformed-command control để chứng minh thứ tự state gate, không sửa dispatcher implementation khi gate sẵn có đủ.
- [x] **Post-gate tests:** mock handler trong fixture tạo lần lượt một invalid metadata/authority/reputation/status/facility draft; mong INVARIANT_VIOLATION và rollback cùng input reference + deep state, không successful effects/audit. Giữ test throw Error/string/structuredClone noncloneable, negative inventory, duplicate NPC, 0/1 active và forbidden legacy trước đó. Restore spies, không skip hoặc xóa assertions.

Chạy RED trước production edit trên isolated copy của base vừa chốt + đúng new tests; expected failures phải chỉ ra guard missing. Lưu output/exit/count (không filter tên không tồn tại). Sau source fix GREEN cùng tests, positive controls và full suite; không reset/switch checkout shared. Test fixtures hợp lệ phải có đủ required fields; nếu test cũ cố ý malformed phải giữ failure expectation, không biến nó valid để né regression. Test count tăng từ baseline 220; ghi số thực, không ép vẫn 220 hoặc cộng lượt chạy lặp thành case mới.

## 4. Bổ sung bằng chứng R1 còn thiếu — không gameplay mới

- [x] Trong **dispatcher.test.ts**, thêm replay deterministic regression: hai deep-clone cùng initial state/seed, cùng 3 ADVANCE_DAY; mỗi bước compare full nextState/effects/auditEntries/data; input gốc deep unchanged, các dates/report đúng. Đây là đưa independent evidence đã có thành test repo bền vững, không thêm seeded event RNG.
- [x] Thêm dispatcher regression **day365/week53/year1 → day366/week53/year2**, `fromDay/report.day=365`, `toDay=366`, resource deltas/audit thuộc ngày365, input/legacy không đổi. Pure clock year test domain:587 đã có; không viết lại clock hoặc economy nếu không có failing proof.
- [x] Extend test **0 active** hiện có tại dispatcher.test.ts:449: clock tiến, report null và không consumption; deep compare toàn bộ Legacy settlement (inventory, facilities, NPC, cohort, metadata fields) trước/sau. Legacy không tự vận hành trong R1 là acceptance gốc §2.2.3, không phải thiếu feature cần làm trong WP này.
- [x] Thêm/extend **economic boundary tests** trong dispatcher.test.ts: 0 dân (cohorts=[], namedCharacters=[]) tiêu thụ 0, không deficit và clock vẫn tiến. Với 45 cohort +1 NPC, demand mỗi loại=23: stock food/water (0,0) cho allocated(0,0)/deficit(23,23); (23,23) cho allocated(23,23)/deficit(0,0)/closing(0,0); (8,100) chỉ food thiếu 15, water closing77; (100,5) chỉ water thiếu18, food closing77. Existing (8,5) thiếu cả hai vẫn giữ. Mỗi case so report.day=T, clock T+1, allocations/deficits/stock, input deep unchanged. Extend 1-active test để deep compare toàn bộ Legacy, không chỉ food/water.
- [x] **Test-only scope cần điều phối chốt trong WP v1.1:** bổ sung `tests/e2e/smoke.spec.ts` ngoài 2 unit-test paths của guard draft trước. Chỉ thêm assertions: default water100 (`resource.ts:15–28`) và demand23/ngày với 45 cohort +1 NPC (`App.svelte:13–68`), nên header ngày1…8 có water100→77→54→31→8→0→0→0; tiến đến ngày8, audit cho ngày7 trong lúc header ngày8; đã có food floor/WHY thì giữ nguyên. Không đổi UI/app/fixture runtime để làm smoke xanh. Nếu coordinator chưa ghi nhận phần test-only mở rộng này thì Tester có thể đo cùng assertions bên ngoài repo trước; không tự sửa file ngoài allowlist. Đây là expected từ source, chưa phải smoke vừa chạy.
- [x] **LAW-06 compile-only evidence ngoài repo:** tạo fixture TypeScript trong workspace kiểm chứng, import type GameState và WorldSaveData từ đúng isolated candidate. Assert type equality của currentDate, settlements, activeSettlementId, WorldSaveData.worldSeed↔GameState.worldMetadata.worldSeed và gameVersion tương ứng; schemaVersion vẫn number. Chạy TypeScript hiện có với noEmit/strict/ES2022/ESNext/moduleResolution bundler/skipLibCheck. Expected exit0; một negative-control fixture đổi expected clock field sang string phải compile fail (ví dụ TS2344) để chứng minh check hoạt động. Không kiểm round-trip/save load: R1 chỉ yêu cầu schema. Không thêm source/schema/test file persistence vào live repo.

```typescript
import type { GameState } from "<candidate>/packages/core/src/domain/gamestate.js";
import type { WorldSaveData } from "<candidate>/packages/persistence/src/schema.js";
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type Clock = Assert<Equal<WorldSaveData["currentDate"], GameState["currentDate"]>>;
type Settlements = Assert<Equal<WorldSaveData["settlements"], GameState["settlements"]>>;
type Active = Assert<Equal<WorldSaveData["activeSettlementId"], GameState["activeSettlementId"]>>;
type Seed = Assert<Equal<WorldSaveData["worldSeed"], GameState["worldMetadata"]["worldSeed"]>>;
type Version = Assert<Equal<WorldSaveData["gameVersion"], GameState["worldMetadata"]["gameVersion"]>>;
type Schema = Assert<Equal<WorldSaveData["schemaVersion"], number>>;
```

Muốn lưu một schema regression vào `packages/persistence/src/__tests__/...` hoặc đổi tsconfig/script/CI để chạy nó tự động là **vượt allowlist validation này**, phải chốt riêng; không dùng khoảng trống đó làm lý do tự mở subsystem. External compile evidence đủ để đo acceptance type-only hiện tại; không thay bằng một Vitest assertion đã bị transpile bỏ type mà không chạy compiler.

## 5. Acceptance / close R1

- [x] Sau patch: targeted guards/R1 tests GREEN, full unit (đúng case count, không skip), architectural suite, six lint safety fixtures, lint/typecheck/build/smoke, npm ci/tree/audit với exact accepted lock. Giữ state boundaries/legacy protection/immutability/zero floor và UI single-apply. Một independent runner duy nhất; Reviewer không chạy trùng expensive gates.
- [x] Đối chiếu từng dòng R1-CLOSURE-CHECKLIST.md: đã đạt / chưa đạt / chưa đủ evidence. Ghi candidate source/lock/raw hashes, Node/npm/tools, test names/counts/exit và raw log paths. Không dùng CI old-main chứng nhận patch mới; không báo close G4/G6 trước CI commit cuối/Human merge theo lifecycle. Scope docs Markdown 0 và final diff/secret-pattern check thực chạy, có giới hạn rõ.
- [x] Review whole diff: đúng 1 source +2 test files và docs allowlist; configs/lock/CI/UI/economy/persistence/historical specs không đổi. Nếu chỉ docs đổi sau runtime proof, so runtime hashes; không bịa rằng rerun trên snapshot docs mới. Không thêm save/load, building/production, Support dynamics, handoff transaction hay demo như “để R1 hoàn chỉnh”.
- [x] Nếu test R1 bổ sung phát hiện bug khác ngoài 4 nhóm guards thì ghi RED/source/impact và HOLD phạm vi sửa sản phẩm; không tự sửa economy/clock/advanceDay/UI để “làm chắc R1”. Khi smoke test-only scope được chốt, diff được phép thêm đúng smoke.spec.ts assertions, không mở runtime file. UI business-mutation rule được kiểm bằng review App.svelte:83–90 + smoke (state từ dispatcher, không double-apply); không tạo một test soi chuỗi source thay thế kiểm hành vi.

**HOLD:** tooling chưa audit, concurrent writer/hash drift, seed/reputation contract mâu thuẫn, cần ngoài allowlist, một lỗi vẫn fail sau 2 lượt sửa, hoặc gate/RED-control không chứng minh đúng lỗi. Giữ logs và báo nguyên nhân/phạm vi, không disable rule/skip test/force peer/bypass policy. Không commit/push/merge/release. Demo được xem xét lại sau khi sửa+bổ sung+run tests và review R1; không tự tiếp tục packet demo cũ.
