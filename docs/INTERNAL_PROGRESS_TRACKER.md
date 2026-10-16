# Bảng Theo Dõi Tiến Độ Kỹ Thuật Nội Bộ (INTERNAL_PROGRESS_TRACKER.md)

> **Mục đích**: Bảng đối chiếu tiến độ trung thực giữa Bạn và các AI Agent. Tuyệt đối không đánh giá "Hoàn thành" khi chỉ mới dừng ở mức khai báo Interface/Type.

---

## 1. Thang Đo Trạng Thái (4 Cấp Độ Nghiêm Ngặt)

| Cấp Độ | Tên Trạng Thái | Định Nghĩa Kỹ Thuật |
| :---: | :--- | :--- |
| **L1** | **Đã định nghĩa (Defined)** | Mới chỉ có khai báo Type, Interface, Enum hoặc Schema rỗng. |
| **L2** | **Đã triển khai (Implemented)** | Đã có hàm logic thực thi (Business Logic / Calculator / Factory). |
| **L3** | **Đã kiểm thử (Tested)** | Có Unit Test tự động (Vitest) chứng minh hành vi và các trường hợp biên. |
| **L4** | **Đã tích hợp (Integrated)** | Đã kết nối vào vòng chơi (Loop), người chơi thao tác được qua UI và lưu/tải bền vững. |

---

## 2. Ma Trận Trạng Thái Thực Tế Từng Module (Codebase Reality Matrix)

| Package | Đường dẫn File | Chức Năng Cốt Lõi | Trạng Thái Thực Tế | Ghi Chú Kỹ Thuật Chi Tiết |
| :--- | :--- | :--- | :---: | :--- |
| **core** | `src/domain/character.ts` | 3 trục thân phận, Nhu cầu, Cảm xúc | **L3 (Đã kiểm thử)** | Đã có factory `createNamedCharacter` với strict validation (chặn tuổi âm, kiểm tra [0, 100], reject NaN/Infinity) và Deep Clone cô lập object. |
| **core** | `src/domain/relationship.ts` | Ma trận quan hệ 8 chiều | **L2 (Đã triển khai)** | Đã có interface và default factory. Tính toán biến thiên quan hệ chuyên sâu chờ R4/R5. |
| **core** | `src/domain/memory.ts` | Hệ thống Ký ức động | **L1 (Đã định nghĩa)** | Mới chỉ có Interface `Memory`. Chưa có hàm decay hay scheduler. |
| **core** | `src/domain/settlement.ts` | Vòng đời lãnh địa & Handoff | **L3 (Đã kiểm thử)** | Đã có factory `createSettlement` chặn kho âm ban đầu, cô lập object; logic chuyển giao Handoff chờ R4. |
| **core** | `src/domain/population.ts` | Quần thể dân cư Cohort | **L3 (Đã kiểm thử)** | Đã bổ sung trường bắt buộc `socialClass: SocialClass` và factory `createPopulationCohort` có kiểm định biên. |
| **core** | `src/domain/resource.ts` | Kho tài nguyên lãnh địa | **L3 (Đã kiểm thử)** | Đã kiểm thử default inventory. Logic sàn 0 và Cấp phát - Thiếu hụt đã được bảo vệ tại simulation. |
| **core** | `src/domain/gamestate.ts` | Chân lý dữ liệu toàn thể & Invariant | **L3 (Đã kiểm thử)** | Đã có `validateGameState` kiểm tra Invariant 0/1 Active hai chiều, Key-ID matching, kho tài nguyên không âm, đầy đủ dictionary chỉ số, từ chối `NamedCharacter` trùng ID toàn `GameState`, cùng 4 nhóm runtime-validation guard (`WP-VALIDATION-GUARDS-01`): `worldMetadata` (`worldSeed` finite, `gameVersion` string), `authority`/`reputation` ($[0, 100]$), `status` (canonical union), và `facilities` (mảng đối tượng `Facility` hợp lệ). |
| **core** | `src/time/clock.ts` | Đồng hồ thời gian mô phỏng | **L3 (Đã kiểm thử)** | Đã kiểm thử tiến ngày, tuần, năm deterministic. Tích hợp làm clock duy nhất trong `GameState`. |
| **core** | `src/command/command.ts` | Hệ thống Lệnh (Commands) | **L3 (Đã kiểm thử)** | Đã có `Command`, `CommandResult`, `AdvanceDayResultData`, `AuditEntry`. Dispatcher điều phối tại simulation. |
| **core** | `src/command/effect.ts` | Hệ thống Effect & Audit Log | **L3 (Đã kiểm thử)** | Bổ sung `CLOCK_ADVANCE` và trường `allocated`/`deficit` vào `RESOURCE_DELTA`. |
| **core** | `src/social/calculator.ts` | Tính toán năng lực xã hội vĩ mô (POP-01A + Workforce v2) | **L3 (Đã kiểm thử — Module nội bộ)** | Pure snapshot calculator (`calculateSocialResourceBreakdown`, `calculateSocialResources`): tính `headcount`, `populationBlocks`, `laborCapacityMilli` (theo chuẩn Workforce v2 `/ 10` ở PR #5 `699f32c`, `upper = 0`, thay cho công thức `/ 100` và `upper = 500` của POP-01A ban đầu), `purchaseDemandCapacityMilli`, `survivalFoodNeedMilli`, `lifestyleFoodDemandMilli`. **Chưa export ở `packages/core/src/index.ts`, chưa nối vào `simulation`/UI/persistence (chưa đạt L4).** |
| **core** | `src/social/workforce.ts` | Tổng hợp nhân lực & Ranh giới số học Effective WF | **L3 (Đã kiểm thử — Module nội bộ)** | Cung cấp `calculateWorkforceHeadcount` và `calculateEffectiveWorkforceMilli` (áp dụng `modifierBps` một lần); không tự động tích hợp City Effects; không bao gồm phân bổ công việc. **Chưa export ở `packages/core/src/index.ts`, chưa nối vào `simulation`/UI/persistence (chưa đạt L4).** |
| **core** | `src/resource/allocation.ts` | Nguyên tắc phân bổ tài nguyên sàn 0 | **L3 (Đã kiểm thử — Module nội bộ)** | Các hàm nguyên thủy phân bổ tài nguyên vật lý (Demand -> Allocated -> Deficit), bảo toàn tài nguyên sàn 0 và bảo toàn số lượng, kiểm định RangeError. **Chưa export ở `packages/core/src/index.ts`, chưa thay thế phép tính prototype trong `simulation/src/economy.ts` (chưa đạt L4).** |
| **core** | `src/status/effects.ts` | Vòng đời hiệu ứng đô thị (City Effects) | **L3 (Đã kiểm thử — Module nội bộ)** | Kiểm định candidate (`assertCandidate`), vòng đời timed City Effect 3 tuần dùng chung, thay thế bậc và chống làm mới chu kỳ (anti-refresh). Chưa chứa bộ giải mã Status -> City Effect. **Chưa export ở `packages/core/src/index.ts`, chưa nối vào `simulation`/UI/persistence (chưa đạt L4).** |
| **core** | `src/medal/*` (`types.ts`, `validation.ts`, `loadout.ts`, `projection.ts`, `index.ts`) | Nền tảng Huân chương (Medal Core Loadout & Modifier Projection) | **L3 (Đã kiểm thử — Module nội bộ)** | Triển khai tại `WP-HAVEN-MEDAL-CORE-FOUNDATION-01` (PR #9, merge commit `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`): kiểm định `MedalDefinition` & `PlayerMedalState` (`validateMedalDefinition`, `validateMedalRegistry`, `validatePlayerMedalState`), điều kiện trang bị & chuyển đổi nguyên tử 3-slot (`getMedalSlotOptions`, `assignMedalToSlot`, `unequipMedalFromSlot`), chiếu danh sách `ModifierContribution` bảo toàn thứ tự (`projectEquippedMedalModifiers`), barrel nội bộ `src/medal/index.ts`. **Chưa export ở `packages/core/src/index.ts`, chưa gắn vào `GameState`/`Settlement`, chưa kết nối `simulation`/UI/persistence (chưa đạt L4).** |
| **simulation** | `src/dispatcher.ts` | Command Dispatcher & Authority Gate | **L3 (Đã kiểm thử)** | Pipeline 4 bước (state -> command -> authority -> handler); phân biệt rõ lỗi `FORBIDDEN` (Legacy) và `COMMAND_NOT_YET_IMPLEMENTED` (Active); đưa `structuredClone` vào trong error boundary `try/catch` để trả `EXECUTION_ERROR` và bảo toàn state gốc khi gặp trường không clone được như function (`WP-FOUNDATION-STATE-BOUNDARIES-01`). |
| **simulation** | `src/economy.ts` | Tính toán sản xuất & Tiêu thụ (Prototype R1) | **L3 (Đã kiểm thử)** | Đã sửa lỗi ngày báo cáo (truyền ngày hiện tại); thực thi cơ chế Nhu cầu -> Cấp phát -> Thiếu hụt (Sàn 0) trên công thức prototype R1 (`0.5` food/water mỗi đầu người từ `cohorts` + `namedCharacters`). Chưa tích hợp calculator của `POP-01A`/Foundation v2. |
| **content** | `src/buildings.json` | Danh mục bản vẽ công trình | **L2 (Đã triển khai)** | Có 3 bản vẽ mẫu. Sẽ kết nối vào Foundation II / future production integration. |
| **persistence** | `src/schema.ts` | Lược đồ lưu trữ Save Game | **L1 (Đã định nghĩa)** | Đã cấu trúc `WorldSaveData` đồng bộ với `GameState` R1. **Chưa có logic đọc/ghi save, chưa đạt L2–L4.** |
| **ui** | `src/App.svelte` | Giao diện Dashboard Svelte 5 (Prototype R1) | **L3 (Đã kiểm thử — Prototype chạy trong RAM, chưa có save/load bền vững)** | Đã xóa bỏ toàn bộ state mutation trực tiếp; UI dispatch `ADVANCE_DAY` tới `simulation` và render state mới trong RAM; đã pass Playwright smoke test. **Chưa đạt L4** vì mới là prototype chạy trong RAM, hoàn toàn chưa có lưu/tải bền vững (`persistence` còn ở L1) và chưa tích hợp UI cho `social`, `status/effects`, hay `medal`. |

---

## 3. Trạng Thái Kiểm Thử Thật Sự (Audit Verification)

* **Bản Ghi Nghiệm Thu G4–G6 — `R1-COHORT-SOCIALCLASS-GUARD-01` / PR #12 (merge ngày 2026-10-16)**:
  * **Phạm vi đã hợp nhất**: [PR #12: fix(core): validate cohort social class at state boundaries](https://github.com/tanntran2000/Build-Settlement/pull/12), nhánh `fix/r1-cohort-socialclass-guard-01`; chỉ bốn file `packages/core/src/domain/population.ts`, `packages/core/src/domain/gamestate.ts`, `packages/core/src/domain/__tests__/domain.test.ts` và `packages/simulation/src/__tests__/dispatcher.test.ts`.
  * **Hợp đồng được bảo vệ**: factory cohort và `validateGameState` từ chối `socialClass` thiếu, sai kiểu hoặc ngoài năm giá trị hiện có (`lower`, `common`, `skilled`, `administrative`, `elite`). State lỗi trả `INVALID_POPULATION`; dispatcher pre-gate trả `INVALID_STATE`, không gọi handler, giữ input reference/toàn bộ state và không rò effects/audit. Draft sai invariant trả `INVARIANT_VIOLATION` và rollback nguyên tử; các giá trị hợp lệ, kể cả cohort enslaved, vẫn được chấp nhận.
  * **Định danh lifecycle**: base `main` `1ae315a0b8314550a81cb962bae50552c8a842f9`; feature HEAD `0f32566b3a81919d5a2977aef9f41c77a46ad352`; merge/main tại hậu kiểm `f9c025b6f475187986b1dab1ce7d84cb5ac61a69`, merge lúc `2026-10-16T23:41:33Z` bởi `tanntran2000`; audited/merge tree `d322419c5004d77930ad8f9b12d6977d39470b7c`.
  * **CI PR — SUCCESS**: Run [`38982625102`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38982625102), [Job `117246751325`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38982625102/job/117246751325); checkout synthetic merge `e72588f496693ac4dca287b428588116be781257`, log gắn đúng feature HEAD và base nêu trên. Raw log SHA256 `76fcf8398ee81863e305e971eff0b857d3a9ca630b2ae8800a8b6820dc13af02`.
  * **CI main — SUCCESS**: Run [`38982759581`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38982759581), [Job `117247176006`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38982759581/job/117247176006); log checkout đúng merge/main `f9c025b6f475187986b1dab1ce7d84cb5ac61a69`. Raw log SHA256 `31078be4a4b4eb8848ad99de9315725f1c2a5bd583299897a53c6a37aa1bcf88`.
  * **Số ca CI thực chạy**: mỗi run PR và main có **260 repo unit tests** (11 files) + **1 browser smoke test** = **261 ca PASS**; các bước install/audit/lint/typecheck/build cũng SUCCESS. Đây là hai lượt thực thi riêng, không cộng dồn thành số ca distinct.
  * **Bằng chứng local riêng biệt**: **327 ca distinct PASS = 260 unit + 66 probe độc lập + 1 smoke**. Targeted 93 là subset; năm mutation controls bị bắt là đối chứng, không cộng vào 327. Không gọi 66 probe local là đã chạy trên GitHub CI. Manifest Tester correction `C:/Users/Admin/Documents/Codex/2026-10-16/task-2/cohort-socialclass-correction-tester-evidence/manifest.json`, SHA256 `095f4211ad981fa1c4fecd10194a84b40a18efae2d4706f275a9631d53ef032c`.
  * **Hậu kiểm kỹ thuật và nguồn bằng chứng**: raw GitHub API/log đã lưu xác nhận PR merged, main/tree khớp candidate đã audit, đúng bốn file thay đổi và 86 file còn lại giữ nguyên; checkout sạch, không bypass protection. Báo cáo `C:/Users/Admin/Documents/Codex/2026-10-16/task-4/cohort-release/outcome.json` và `delivery-manifest.json` cùng thư mục là bằng chứng local Admin-PC, không phải artifact đã upload lên GitHub. Bản ghi này đối chiếu lại hash của 11 artifact đã lưu, không tuyên bố chạy lại runtime hoặc CI trong lượt soạn tài liệu.
  * **Điều kiện đóng G6**: hậu kiểm code/CI của PR #12 đã đạt; phần ghi nhận G6 của WP/PR #12 chỉ đóng khi chính bản cập nhật tracker này đã qua review và được đưa vào `main`. Khi còn là candidate chưa commit, chưa nhận G6 hoàn tất. Không tạo vòng cập nhật tracker tiếp theo chỉ để ghi nhận PR tài liệu này; giữ nguyên lịch sử PR #10/#11.
  * **Giới hạn nghiệm thu R1**: chỉ bổ sung guard/atomic-regression trong phạm vi trên; không xác nhận toàn bộ game hoàn thành, không mở thêm gameplay/API công khai/dependency/persistence. Các module nền tảng vẫn L3/module nội bộ, UI chạy trong RAM, persistence L1, POP tiếp theo DESIGN ONLY; chưa phát hành demo, tag hoặc release.
* **Checkpoint Tích Hợp & Đóng Gói G4–G6 (Pull Request #10 — `WP-FOUNDATION-STATE-BOUNDARIES-01`, `WP-FOUNDATION-PREPUBLICATION-01`, `WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01`, `WP-VALIDATION-GUARDS-01`, 2026-10-16)**:
  * **Pull Request**: [PR #10: fix(foundation): enforce state boundaries and validation guards](https://github.com/tanntran2000/Build-Settlement/pull/10) (nhánh `fix/foundation-state-boundaries-01` hợp nhất vào `main`).
  * **Feature HEAD Commit**: `535128c850c174e90d19d9a269caae40706c1a3f` (commit trên branch tích hợp đầy đủ: patch state boundaries, nâng cấp ESLint 10, định dạng 4 docs lịch sử, validation guards, và xử lý precommit whitespace `PRECOMMIT-WHITESPACE-01`).
  * **Merge Execution**: Merge vào `main` lúc `2026-10-16T13:35:10Z` bởi `tanntran2000`; Merge / `main` SHA: `39be04b55ac237fbfb2dcc457babd1b5b898f481`.
  * **Audited Git Tree**: `0f5fc104ae3082847a69971cc406a57b3dfaab52`.
  * **CI PR (Quality Gate — SUCCESS)**: GitHub Actions Run [`38908679830`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38908679830) (Job `116998679800`, raw log SHA256 `f17175a7f1e3927da11649bb27478566019330fdcd9843960baad59a0c8cf63a`). CI PR thực hiện checkout synthetic merge commit `117b1db98206c3e0487cf485f92cd56b2968ee15`, gắn kết với feature HEAD `535128c850c174e90d19d9a269caae40706c1a3f`.
  * **CI Main (Quality Gate — SUCCESS)**: GitHub Actions Run [`38908987554`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38908987554) (Job `116999720598`, raw log SHA256 `4bedf78d410c3304c43ee3cd5ff8b062fc6b328207e16740a1dbc3c146b7feb3`). CI main chạy trực tiếp trên merge SHA `39be04b55ac237fbfb2dcc457babd1b5b898f481`.
  * **Số lượng ca kiểm thử trên CI GitHub**: Mỗi lượt CI (PR và main) chạy đúng **252 repo unit tests passed** (11 test files) + **1 browser smoke test passed** (Playwright Chromium) = **253 ca kiểm thử**.
  * **Phân biệt rạch ròi với kiểm thử local**: Kiểm thử local riêng biệt đạt **334 ca được chấp nhận** (252 repo unit + 52 kiểm độc lập + 28 boundary + 1 error-contract + 1 smoke); tuyệt đối không gọi các kiểm tra bổ sung local là đã chạy trên GitHub Actions.
  * **Bằng chứng đối chiếu nội bộ**: Lưu tại `C:\Users\Admin\Documents\Codex\2026-10-16\task-4\release-outcome.json` và `delivery-manifest.json` (ghi nhận bằng chứng thực nghiệm cục bộ trên máy Admin, không ghi rằng các file local này đã được upload lên GitHub).
  * **Đóng nhận G6**: Bản cập nhật tracker này đóng phần ghi nhận G6 (Post-Merge Verification) của PR #10 khi được đưa vào `main`. Không yêu cầu một vòng cập nhật tracker nữa chỉ để ghi nhận PR tài liệu này. Vẫn duy trì nghiêm ngặt các giới hạn sản phẩm: L3/module nội bộ, UI chạy trong RAM, persistence L1, POP DESIGN ONLY; chưa phát hành bản demo ra công chúng.
* **Kết Quả Kiểm Thử Lịch Sử Trên Working Tree Nhánh `fix/foundation-state-boundaries-01` Trước PR #10 (`WP-FOUNDATION-STATE-BOUNDARIES-01` & `WP-FOUNDATION-PREPUBLICATION-01`, Base `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` — Trạng Thái Lịch Sử Snapshot Trước Khi Merge, Không Phải Hiện Trạng)**:
  * **Checkpoint Codex trước nâng tooling**: Vitest 2.1.9; snapshot thực chạy `d581c11edd4c18dd1621e3c344e480ed80b31fa1a11f0af3ec0f499127cd45e9`; 220 unit + 1 smoke, exit 0. Log và exit: `C:/Users/Admin/Documents/Codex/2026-10-16/task/foundation-review-evidence/manifest.json`. Không coi đây là test trên lock mới.
  * **Checkpoint Tester prepublication lần trước — FAIL**: snapshot `f1999835b9b558f85660fb93aab693b6af20cd6ff7aaf9b7b488664eb096fe2b`; YAML peer lỗi (npm ls exit 1), hai filter cũ chạy 0 test, clean npm ci chưa chạy. Giữ bằng chứng tại `C:/Users/Admin/Documents/Codex/2026-10-16/task-2/prepublication-tester-evidence/TESTER_REPORT.md`.
  * **Checkpoint Tester correction — PASS local T1–T3, 2026-10-16**: Node 24.19.0, npm 11.17.0, Vitest 4.1.11; HEAD `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`, snapshot `dc9f2a89c0d03ce94b7b5e0d8a6ba00e7b53ecc08b1586cfeaf7d808bd09e3c8`. Reviewer dùng thuật toán aggregate khác (`a29dd247e761e86523ee5a7b7e70d9e3bb9b7a3c81f63ecc626d83f73281209c`); đã đối chiếu đủ 86 file/hash trùng nhau.
    * Bằng chứng: [TESTER_REPORT.md](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/TESTER_REPORT.md), [manifest.json](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/manifest.json); từng LABEL.json ghi argv/cwd/UTC/exit, LABEL.log ghi output. Đây là đường dẫn bằng chứng local Admin-PC, chưa phải CI hay artifact public.
    * Clean npm ci, npm ls --all --json, audit gồm dev, lint, typecheck và build: exit 0; tree không invalid/missing; audit total 0. Xem clean-ci/tree/audit/lint/typecheck/build.json và .log.
    * 250 test case khác nhau đạt: 220 unit + 28 boundary + 1 smoke + 1 error-contract (exit 0); 6 lint fixtures đúng kỳ vọng. Không cộng 2 GREEN chạy lặp vào 250.
    * Hai filter hiện tại: mỗi filter GREEN 1 passed (exit 0) và trên base source cũ RED 1 failed (exit 1 dự kiến). Xem doc-domain/doc-dispatcher/red-domain/red-dispatcher.json và .log, red-provenance.json; không gọi RED dự kiến là lỗi candidate.
    * Bản sao Tester sạch, không sửa shared checkout. PASS chỉ áp dụng snapshot trên; correction tài liệu sau đó tạo snapshot mới và phải đối chiếu code/lock không đổi. (Ghi chú lịch sử: Trạng thái chờ CI trên commit cuối là trước khi tạo và merge PR #10; CI cuối đã đạt 100% SUCCESS theo checkpoint PR #10 ở trên).
  * **Checkpoint Nâng cấp Tooling Lint & Định dạng Markdown (`WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01`, 2026-10-16)**:
    * Nâng cấp `eslint` lên `10.12.0` (thay thế bản EOL `9.39.5`), ghim cố định `@typescript-eslint/parser` `8.71.2`, `eslint-plugin-svelte` `3.23.1`; không đổi `eslint.config.mjs` (giữ nguyên SHA256 `29a843a7`).
    * Kiểm chứng registry chính thức: `version: "10.12.0"`, không deprecated, tương thích Node `>=24`.
    * Clean isolated `npm ci` exit code `0`, `npm ls --all --json` exit code `0`, `npm audit` exit code `0` (0 vulnerabilities).
    * 6 stdin fixtures đạt chuẩn: clean exit 0, `debugger` variants exit 1 với `no-debugger`; `--print-config` xác nhận 6 quy tắc an toàn cốt lõi ở mức error `[2]`.
    * Xóa sạch 372 diagnostics trên 4 tài liệu lịch sử/đóng băng (`ENCYCLOPEDIA_MECHANICS.md`, `POP-01A_Implementation_Plan.md`, `WP-HAVEN-02_Unified_v1.0.md`, `2026-10-02-medal-core-loadout-foundation.md`) mà không thay đổi code/spec/công thức/link; lưu giữ nguồn gốc canonical blob `bbb17416` của Plan Medal.
    * Chi tiết kiểm chứng tại [SUPPORTED-LINT-HISTORICAL-FORMAT-01.md](verification/SUPPORTED-LINT-HISTORICAL-FORMAT-01.md) và kế hoạch [WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01.md](work_packages/WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01.md).
  * **Checkpoint Nghiệm thu Runtime Validation Guards & Đóng Gói R1 (`WP-VALIDATION-GUARDS-01`, `R1-VALIDATION-CORRECTION-01` & `R1-EVIDENCE-DOCS-CORRECTION-02`, 2026-10-16)**:
    * Bổ sung 4 nhóm runtime-validation guard thuần túy trong `validateGameState` (`packages/core/src/domain/gamestate.ts`): `worldMetadata` (`worldSeed` finite, `gameVersion` string), `authority`/`reputation` ($[0, 100]$), `status` (canonical union), `facilities` (array của valid `Facility` objects).
    * Sửa lỗi tạo thông báo nội suy giá trị chưa tin cậy (`{ "toString": null, "valueOf": null }`) tại `worldSeed`, `authority`, `reputation`, `status`, `facility.stage`; validator trả `INVALID_STATE` bình thường không throw TypeError; dispatcher trả `INVALID_STATE` và bảo toàn input reference/data.
    * Bổ sung test kiểm thử: `domain.test.ts` đạt **42 tests** (baseline: 28 $\rightarrow$ candidate: 42, **tăng 14 tests**; riêng correction: 38 $\rightarrow$ 42, **tăng 4 tests**); `dispatcher.test.ts` đạt **43 tests** (baseline: 25 $\rightarrow$ candidate: 43, **tăng 18 tests**; riêng correction: 41 $\rightarrow$ 43, **tăng 2 tests**). Mức tăng repo unit test là 32 tests so với baseline 220 của snapshot trước.
    * Phân loại đầy đủ **334 ca kiểm thử được chấp nhận (accepted main cases)**: 252 repo unit tests + 52 kiểm độc lập + 28 boundary + 1 error-contract + 1 browser smoke test (Playwright headless: 5.1s cho test, 10.7s tổng lượt chạy). Tuyệt đối không gọi tất cả 334 ca là unit tests; không cộng dồn các lượt targeted 85 tests hay đối chứng sensitivity 10 GREEN / 10 expected RED.
    * Bằng chứng biên dịch type equality ngoài repo (LAW-06): fixture thật `tester-law06/positive.ts` exit code 0 (`tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck`); `tester-law06/negative.ts` exit code **2** với compiler error `TS2344: Type 'false' does not satisfy the constraint 'true'` (mã thoát thực tế của compiler tsc; không ép thành exit 1).
    * Candidate snapshot trước chỉnh tài liệu: `0a63c37f177e1efca44a781a02ea7cbbabb489bf1247ec982fedb64752ae2633` (90 files); manifest Tester tại `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\manifest.json` (SHA256: `42e1f8581bd9e5fa27a7643ff18ee8227c21d278a9c1176795de9ad553f3f6d8`); danh mục `artifacts-sha256.json`. (Ghi chú lịch sử: Hash candidate này chứng nhận snapshot trước khi sửa docs; toàn bộ thay đổi sau đó đã được chốt và thay thế bởi feature HEAD `535128c850c174e90d19d9a269caae40706c1a3f` trong PR #10).
    * Đạt toàn bộ kiểm tra chất lượng: `npm run lint` (exit 0), `npm run typecheck` (exit 0), `npm test -- --no-cache` (exit 0, 252 passed), `npm run build` (exit 0), `npm run test:smoke` (exit 0), `npm audit` (exit 0, 0 vulnerabilities), `git diff --check` (exit 0).
    * Chi tiết tại [VALIDATION-GUARDS-01.md](verification/VALIDATION-GUARDS-01.md) và kế hoạch [WP-VALIDATION-GUARDS-01.md](work_packages/WP-VALIDATION-GUARDS-01.md).

* **Phân Biệt Với Số Liệu Kiểm Thử Baseline & Lịch Sử (Historical vs. Baseline Test Counts)**:
  * **Baseline trên `main` sau Merge PR #9 (`0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`, Feature HEAD `2eca6cc25898d5263dc195a319c2bbfc0d079c79`)**:
    * **11 test files / 215 unit tests passed** + **1 browser smoke test passed** (gồm 173 tests trước đó + 42 Medal tests trong 3 files `medal/__tests__/*`; khi đó `domain.test.ts` có 26 tests và `dispatcher.test.ts` có 22 tests).
    * Đối chiếu bằng chứng audit và hướng dẫn tái hiện tại [FOUNDATION-STATE-BOUNDARIES-01.md](verification/FOUNDATION-STATE-BOUNDARIES-01.md) và [DEPENDENCY-TRIAGE-2026-10-16.md](verification/DEPENDENCY-TRIAGE-2026-10-16.md).
  * **Lịch sử PR #7 (`c7beed21a27896d12796d008bfd5248630410a22`, merge vào `main` tại `a5b6baec17e5ab086af39d0f64dd45d795fba0db`)**:
    * **8 test files / 173 unit tests passed** + **1 browser smoke test passed** (trước khi có 3 files / 42 tests của gói Medal).
  * **Lịch sử Gói R1 (`375b60e`)**:
    * **51 unit tests passed** (trước khi triển khai `POP-01A` và `Foundation v2`).

* **Quy Trình CI (GitHub Actions) & Trạng Thái Bảo Mật Cập Nhật (2026-10-16)**:
  * `.github/workflows/ci.yml` chuẩn hóa job `quality-gate`: checkout -> log SHA/PR -> setup Node 24 -> `npm ci` -> `npm audit --audit-level=moderate` -> `npm run lint` -> `npm run typecheck` -> `npm test` -> `npm run build` (Core, Simulation, UI) -> `playwright install chromium` -> `npm run test:smoke`.
  * **Bằng Chứng CI Đã Xác Thực Qua Điều Phối**:
    * **Merge/main `39be04b55ac237fbfb2dcc457babd1b5b898f481` (PR #10)**: GitHub Quality Gate Run [`38908987554`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38908987554) SUCCESS (252 unit tests + 1 browser smoke test).
    * **PR #10 Run [`38908679830`](https://github.com/tanntran2000/Build-Settlement/actions/runs/38908679830)**: SUCCESS trên synthetic merge commit `117b1db98206c3e0487cf485f92cd56b2968ee15` (feature HEAD `535128c850c174e90d19d9a269caae40706c1a3f`).
    * **Merge/main `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (PR #9)**: GitHub Quality Gate Run [`37588093308`](https://github.com/tanntran2000/Build-Settlement/actions/runs/37588093308/job/112682826378) SUCCESS (215 unit tests + 1 browser smoke test).
    * **PR #9 Run [`36988198913`](https://github.com/tanntran2000/Build-Settlement/actions/runs/36988198913/job/110777976731)**: SUCCESS trên synthetic merge commit `085c62f8af88290394b8a46a3918d0538667624b` (PR #9 feature HEAD là `2eca6cc25898d5263dc195a319c2bbfc0d079c79`).
    * **Lịch sử PR #7 HEAD (`c7beed21a27896d12796d008bfd5248630410a22`, merge tại `a5b6baec17e5ab086af39d0f64dd45d795fba0db`)**: GitHub Quality Gate Run [`36965142356`](https://github.com/tanntran2000/Build-Settlement/actions/runs/36965142356) SUCCESS (173 unit tests + 1 smoke test).
  * **Checkpoint Quản Trị & Bảo Mật Thực Tế (2026-10-16)**:
    * **Đã giải quyết 9/9 cảnh báo phụ thuộc & xung đột peer YAML (`WP-FOUNDATION-PREPUBLICATION-01`)**: Chi tiết tại [DEPENDENCY-TRIAGE-2026-10-16.md](verification/DEPENDENCY-TRIAGE-2026-10-16.md). `npm audit` đạt 0 vulnerabilities; `npm ls` đạt 0 errors; `npm ci` độc lập thành công.
    * **Nhánh main đã bật Branch Protection**: PR required, approval count 0 theo Human, required Actions check quality-gate app 15368 cho mọi người, strict up-to-date và admin enforcement, force-push/deletion disabled. Không bật dismiss-stale-approvals. Bằng chứng UI/API đã lưu tại `C:/Users/Admin/Documents/Codex/2026-10-16/task/foundation-review-evidence/github-final-readback.json`; full protection API trả 403 nên không dùng endpoint đó chứng minh mọi field.
    * **Trạng thái sản phẩm**: **Chưa Release Ready** (Vertical Slice mới dừng ở vòng lặp prototype R1 và các module lõi L3 chưa nối vào loop/persistence).

---

## 4. Các Lỗi Đã Tái Hiện & Nợ Kỹ Thuật Đã Xử Lý Trong R1 & WP-FOUNDATION-STATE-BOUNDARIES-01

1. **Lỗi Kho Âm (Negative Inventory)**:
   * *Đã giải quyết*: Tách 3 đại lượng: **Nhu cầu (Demand) - Cấp phát thực tế (Allocated) - Lượng thiếu hụt (Deficit)**. Kho chạm sàn 0 tuyệt đối không âm; lượng thiếu hụt được ghi nhận vào Audit Trail (WHY) và không làm gián đoạn tiến ngày.
2. **Lỗi Ngày Báo Cáo Kinh Tế**:
   * *Đã giải quyết*: Báo cáo ngày $T$ nhận đúng ngày mô phỏng $T$, clock tiến sang $T + 1$.
3. **Kiến Trúc Lệnh Bị Đứt Gãy (Command -> Effect)**:
   * *Đã giải quyết*: Đã xây dựng `executeCommand` trong `simulation`; UI xóa bỏ 100% các phép tính cộng/trừ tài nguyên và biến `day` cục bộ; UI dispatch command và render kết quả.
4. **Invariant 0 hoặc 1 Lãnh Địa Trực Trị (LAW-05)**:
   * *Đã giải quyết*: Cưỡng chế hai chiều: 0 active $\iff$ pointer null; 1 active $\iff$ pointer trỏ đúng ID; cấm lệnh quản trị trực tiếp tới Legacy (`FORBIDDEN`).
5. **Bộ 4 Finding Review R1-F01 → R1-F04**:
   * *R1-F01 (Miền số & Cấu trúc)*: Khắc phục triệt để lỗ hổng cohort âm tạo lương thực; kiểm tra tính nhất quán toán học của clock; kiểm tra container trước khi đọc; bắt buộc đủ 9 tài nguyên kho, đủ 6 needs, 8 emotions, 5 skills, 8 trục quan hệ, chặn object rỗng `{}`.
   * *R1-F02 (Object Isolation)*: Deep clone toàn bộ mảng `memories.tags` và các nhân vật/cohort lồng nhau trong factory.
   * *R1-F03 (Command Syntax Gate)*: `validateCommandSyntax` kiểm tra loại lệnh và trường bắt buộc trước khi thẩm định quyền hạn.
   * *R1-F04 (Transactional Error & Atomicity)*: Bọc try/catch chuẩn hóa runtime exception thành `EXECUTION_ERROR`, hậu kiểm draft vi phạm trả `INVARIANT_VIOLATION`, đảm bảo tính nguyên tử all-or-nothing.
6. **Chặn Đứng Nhân Đôi NPC ID & Đưa `structuredClone` Vào Error Boundary (`WP-FOUNDATION-STATE-BOUNDARIES-01`)**:
   * *Từ chối NPC trùng ID trong `validateGameState`*: Ngăn chặn trạng thái chứa nhiều `NamedCharacter` có cùng `id` (trong cùng một settlement hoặc xuyên qua các settlement trong `GameState`), trả mã `INVALID_CHARACTER` ở validator và `INVALID_STATE` ở `executeCommand` mà không làm thay đổi input state, clock hay kho tài nguyên (không âm thầm bỏ qua NPC trùng trong `economy.ts`).
   * *Đưa `structuredClone` vào trong khối `try/catch` của `executeCommand`*: Khi `GameState` chứa trường không thể clone (như function được gắn thêm mà validator hiện chấp nhận), `executeCommand` bắt gọn `DataCloneError` và trả về `CommandResult` lỗi `EXECUTION_ERROR` kèm nguyên trạng `state` gốc, tuyệt đối không làm văng uncaught exception ra caller.
7. **Bổ Sung 4 Nhóm Runtime Validation Guards & Hoàn Tất Regression Acceptance R1 (`WP-VALIDATION-GUARDS-01`)**:
   * *4 Nhóm Pure Guards trong `validateGameState`*: Khắc phục triệt để các khoảng trống runtime validation với `worldMetadata`, `authority`/`reputation`, `status`, và `facilities`; bảo toàn unknown extension keys cho `structuredClone` error boundary.
   * *Bảo Vệ Đa Tầng Pre-gate & Post-gate trong Dispatcher*: Ngăn chặn state lỗi ngay trước khi phân tích cú pháp command (`INVALID_STATE`), bảo toàn input state reference và snapshot; chặn draft lỗi hậu xử lý (`INVARIANT_VIOLATION`) và rollback trạng thái ban đầu.
   * *Bảo Chứng Replay Determinism & Ranh Giới Năm*: Chứng minh tính tất định qua 3 ngày liên tiếp trên các bản sao trạng thái độc lập; xử lý chính xác rollover từ ngày 365, tuần 53, năm 1 sang ngày 366, tuần 53, năm 2.
   * *Bảo Chứng Ranh Giới Kinh Tế & Cô Lập Lãnh Địa Di Sản (Legacy)*: Kiểm định đầy đủ các trường hợp biên 0 dân số, tồn kho (0,0), (23,23), (8,100), (100,5), bảo toàn sâu 100% dữ liệu của Legacy settlement.
   * *Bổ Sung Assertion Nước Sạch & Ngày 8*: Đồng bộ Playwright smoke test phản ánh tiêu thụ nước sạch và tiến sang ngày 8.

---

## 5. Lộ Trình Tái Cơ Cấu Thực Tế (Hạ Tầng Nền Tảng Cho Vertical Slice)

* [x] **R0: Đối chiếu tiến độ + Sửa CI**:
  * Dọn sạch unused imports (`settlement.ts`, `command.ts`).
  * Thay thế CI bằng Node/npm workflow chuẩn.
  * Cập nhật Tracker trung thực với 4 cấp độ L1-L4.
* [x] **R1: Lõi Thực Thi & Luật Bất Biến (Execution Core & Invariants)**:
  * *(Đã hoàn thành trọn vẹn G0 -> G6; merge commit `375b60e` trên `main`; post-merge CI `36527428842` đạt 100%)*.
  * Đồng hồ thời gian duy nhất trong `GameState`.
  * Khởi tạo Command Dispatcher trung tâm (`executeCommand`).
  * Validation Invariants (chặn số âm, kiểm tra container, kiểm tra đủ khóa bắt buộc, cô lập object graph).
  * Tách biệt kiểm tra kiến trúc và browser smoke test.

---

### FOUNDATION I — POPULATION (Trọng Tâm Kỹ Thuật Hiện Tại)

> **Quy tắc phân tách ranh giới**:
>
> * **Named NPC $\rightarrow$ `NPC-01 Future`**: Decouple hoàn toàn khỏi Population Core. Không mô phỏng tâm lý, quan hệ cá nhân hay kỹ năng Named NPC trong Population Core.
> * **Resource Core $\rightarrow$ Foundation II**: Chỉ triển khai sau khi Population Core cung cấp đủ input Demand và Capacity ổn định.

* [x] **POP-01A: Class Resource Core**: **L3 (ĐÃ KIỂM THỬ — MODULE NỘI BỘ)** *(Merged PR #4 tại commit `b5c72e9`; cập nhật công thức lao động sang Workforce v2 ở PR #5 tại commit `699f32c`)*:
  * Khóa hằng số `SOCIAL_RESOURCE_SCALE = 1000` (integer milli-units, `Math.floor`).
  * Bộ giải mã chuẩn tắc `resolveEconomicProfile` với tiền lệ nô lệ (enslaved precedence) và ánh xạ toàn diện `SocialClass` (exhaustive SocialClass mapping).
  * Pure snapshot calculator `calculateSocialResources` & `calculateSocialResourceBreakdown` (`headcount`, `populationBlocks`, `laborCapacityMilli`, `purchaseDemandCapacityMilli`, `survivalFoodNeedMilli`, `lifestyleFoodDemandMilli`; chưa bao gồm Military/Tax capacity hay Assigned WF).
  * *(Ghi chú thay thế công thức)*: Công thức `laborCapacityMilli` ban đầu của POP-01A (chia `/ 100`, `upper.laborMultiplierMilli = 500`, Fixture A = `202500`, Fixture B = `199500`, edge cases 1/99/101 = `15/1485/1515`) **đã được thay thế bởi Workforce v2 ở PR #5 (`699f32c`)** (`10 cư dân = 1 base WF` chia `/ 10`, `upper.laborMultiplierMilli = 0`, Fixture A = `2000000`, Fixture B = `1955000`, edge cases 1/99/101 = `150/14850/15150`). Đã đánh dấu rõ trong `WP-HAVEN-02_Unified_v1.0.md` và `POP-01A_Implementation_Plan.md`.
  * **Mức tích hợp thực tế**: Dừng ở **L3** (chưa export ở `packages/core/src/index.ts`, chưa tích hợp `simulation`, UI hay lưu trữ; chưa đạt L4).
* [ ] **POP-01B: Needs & Effective Capacity**: **DESIGN ONLY** *(Chưa mở triển khai)*
  * Cơ chế Satisfaction, Tác động thiếu hụt & Mức ủng hộ (Support) sang nhịp $T \rightarrow T+1$.
* [ ] **POP-01C: Labor Allocation**: **DESIGN ONLY** *(Chưa mở triển khai)*
  * Phân bổ năng lực lao động (Effective $\rightarrow$ Allocated Labor), không phân bổ từng đầu người.
* [ ] **POP-02: Population Dynamics**: **DESIGN ONLY** *(Chưa mở triển khai)*
  * Di cư, xuất cư, dịch chuyển giai cấp, ngưỡng sức chứa bền vững, dòng người nộp đơn nhập cư (Immigration, Emigration, Class Mobility, Sustainable Capacity, Outside Applicants, Headcount flows - chưa bao gồm Sinh/Tử, Tháp tuổi hay mô phỏng thế hệ).
* [ ] **POP-03: Law & Social Conflict**: **DESIGN ONLY** *(Chưa mở triển khai)*
  * Chính sách giai cấp, xung đột quyền lợi, biến động trật tự xã hội.

---

### FOUNDATION V2, MEDAL CORE & STATE BOUNDARIES — QUẢN TRỊ & HỢP NHẤT NỀN TẢNG (GOVERNANCE STATUS)

* **PR #5 (Canonical Foundation v2)**: Đã merge vào `main` tại commit `699f32c` (Workforce v2, Resource primitives sàn 0, City Effect lifecycle 3 tuần dùng chung, Effective Workforce arithmetic). Tất cả ở mức **L3 (module nội bộ)**.
* **PR #7 (City Effect Contract Correction)**: Đã merge vào `main` tại commit `a5b6bae` (HEAD PR #7: `c7beed2`, CI Quality Gate run `36965142356` SUCCESS, 173 unit tests). Chốt chặn RangeError cho input không phải object tại duy nhất một ranh giới `assertCandidate`.
* **PR #6 (Independent Comparison)**: Nhánh `feat/foundation-v2-antigravity-01` đã đóng (superseded/closed), không phải bản canonical.
* **PR #9 (`WP-HAVEN-MEDAL-CORE-FOUNDATION-01` — Medal Core Loadout & Modifier Projection)**: Đã merge vào `main` tại commit `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (feature HEAD `2eca6cc25898d5263dc195a319c2bbfc0d079c79`; PR CI run [`36988198913`](https://github.com/tanntran2000/Build-Settlement/actions/runs/36988198913/job/110777976731) trên synthetic merge `085c62f8af88290394b8a46a3918d0538667624b` SUCCESS; post-merge `main` CI run [`37588093308`](https://github.com/tanntran2000/Build-Settlement/actions/runs/37588093308/job/112682826378) SUCCESS với 215 unit tests + 1 smoke test). Cung cấp validation (`validateMedalDefinition`, `validateMedalRegistry`, `validatePlayerMedalState` cho `MedalDefinition` & `PlayerMedalState`), loadout 3-slot nguyên tử (`getMedalSlotOptions`, `assignMedalToSlot`, `unequipMedalFromSlot`) và modifier projection trả `ModifierContribution[]` (`projectEquippedMedalModifiers`) trong `packages/core/src/medal/`. **Mức tích hợp thực tế**: **L3 (module nội bộ)** — chưa export ra `packages/core/src/index.ts`, chưa nối vào `GameState`, `simulation`, `persistence` hay `ui`.
* **Nhánh fix/foundation-state-boundaries-01 (`WP-FOUNDATION-STATE-BOUNDARIES-01`)**: Đã hoàn tất tích hợp vào `main` thông qua [PR #10](https://github.com/tanntran2000/Build-Settlement/pull/10) tại merge commit `39be04b55ac237fbfb2dcc457babd1b5b898f481` (feature HEAD `535128c850c174e90d19d9a269caae40706c1a3f`, audited tree `0f5fc104ae3082847a69971cc406a57b3dfaab52`). Toàn bộ 4 file source/test về error boundary `structuredClone` và chống nhân đôi NPC ID đã được bảo đảm trên `main`. Bằng chứng đối chiếu tại `C:\Users\Admin\Documents\Codex\2026-10-16\task-4\release-outcome.json` và `delivery-manifest.json` (bằng chứng nội bộ local, không ghi là đã upload lên GitHub). Chi tiết xem checkpoint PR #10 ở mục 3.
* **WP-FOUNDATION-PREPUBLICATION-01**: Đã hoàn tất tích hợp vào `main` thông qua [PR #10](https://github.com/tanntran2000/Build-Settlement/pull/10). Phạm vi tại [WP](work_packages/WP-FOUNDATION-PREPUBLICATION-01.md); Plan Medal lịch sử [đã phục hồi đúng blob canonical](superpowers/plans/2026-10-02-medal-core-loadout-foundation.md). Nâng cấp tooling, xử lý 9/9 phụ thuộc, và toàn bộ kiểm tra prepublication đã được xác nhận độc lập. Bằng chứng đối chiếu tại `C:\Users\Admin\Documents\Codex\2026-10-16\task-4\release-outcome.json` và `delivery-manifest.json` (bằng chứng nội bộ local, không ghi là đã upload lên GitHub). Chi tiết xem checkpoint PR #10 ở mục 3.
* **WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01**: Đã tích hợp vào `main` thông qua PR #10. Nâng cấp ESLint lên 10.12.0 (thay thế bản EOL 9.39.5) với cùng flat config; hoàn tất định dạng trình bày 4 tài liệu lịch sử/đóng băng sạch 372 diagnostics mà không thay đổi logic/code/công thức/spec. Chi tiết tại [WP](work_packages/WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01.md) và [báo cáo kiểm chứng](verification/SUPPORTED-LINT-HISTORICAL-FORMAT-01.md).
* **WP-VALIDATION-GUARDS-01 (kèm correction R1-VALIDATION-CORRECTION-01 & R1-EVIDENCE-DOCS-CORRECTION-02)**: Đã tích hợp vào `main` thông qua PR #10. Bổ sung 4 nhóm runtime-validation guard trong `validateGameState`, sửa lỗi nội suy unconvertible objects không throw TypeError, hoàn tất bộ test hồi quy R1 acceptance closure với 252 repo unit tests (tổng 334 ca kiểm thử được chấp nhận: 252 unit + 52 independent + 28 boundary + 1 error-contract + 1 smoke). Bằng chứng type equality biên dịch ngoài repo (LAW-06) đạt positive exit 0 và negative exit 2 với TS2344. Chi tiết gắn manifest Tester và raw logs tại [WP](work_packages/WP-VALIDATION-GUARDS-01.md) và [báo cáo kiểm chứng](verification/VALIDATION-GUARDS-01.md).

---

### FOUNDATION II — RESOURCE CORE & SURVIVAL LOOP

* **Hiện trạng**: Foundation v2 đã thiết lập các hàm nguyên thủy phân bổ/dòng chảy sàn 0 (`packages/core/src/resource/allocation.ts`) ở mức **L3 (module nội bộ)**, nhưng việc tích hợp toàn diện Resource Core (RES-01..04) vào `simulation` và `GameState` vẫn đang mở.
* [ ] **RES-01: Resource Model, Stock & Invariants**:
  * Mô hình kho và biến thiên vật lý, bảo toàn sàn 0, tách biệt Physical Resources vs Social Capacities.
* [ ] **RES-02: Demand $\rightarrow$ Allocation $\rightarrow$ Deficit / Surplus**:
  * Động cơ cấp phát lương thực và nhu yếu phẩm từ đầu vào của Population Core.
* [ ] **RES-03: Production, Conversion & Inflow-Outflow**:
  * Chuyển hóa nguyên liệu thô, sản lượng, hao hụt tự nhiên.
* [ ] **RES-04: Building & Physical Activity Integration**:
  * Xây dựng công trình (`BUILD_FACILITY`), bố trí địa điểm, tích hợp hạ tầng vật lý sau khi Resource Core đã đứng vững độc lập.

---

### FOUNDATION III — PERSISTENCE & SESSION LIFECYCLE (R3 Cũ)

* [ ] Logic đọc/ghi Save game thực tế (`serialize` / `deserialize`).
* [ ] Xuất/nhập file save (`.json`), xử lý save lỗi trên file tạm.
* [ ] Cơ chế New Game, Continue, và nền móng New Game+.

---

### FOUNDATION IV — ATOMIC HANDOFF (R4 Cũ)

* [ ] Giao dịch bàn giao nguyên tử: Bổ nhiệm Governor, chuyển giao tài sản, tước quyền điều khiển trực tiếp của Player.
* [ ] Lãnh địa cũ trở thành Legacy Settlement tự cập nhật trong nền.

---

### FOUNDATION V — EVENT LOOP & REPLAYABILITY (R5 Cũ)

* [ ] Event scheduler có điều kiện kích hoạt, cooldown, lịch sử lựa chọn.
* [ ] Giới hạn độ dài nhật ký log để chống phình bộ nhớ.
