# HANDOFF — Build-Settlement / Admin-PC

Cập nhật: 2026-10-16; branch `fix/foundation-state-boundaries-01`, base/HEAD `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`, chưa commit/push/merge. Builder hoàn tất `WP-FOUNDATION-STATE-BOUNDARIES-01`, `WP-FOUNDATION-PREPUBLICATION-01`, `WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01` và `WP-VALIDATION-GUARDS-01` (R1 Closure Implementation Plan v1.1: 4 nhóm pure runtime-validation guards, 246 unit tests + 1 smoke test đạt 100%, LAW-06 external compile evidence đạt chuẩn exit 0). Bàn giao cho Reviewer và Tester kiểm chứng độc lập.

## Cập nhật các gói sửa đổi (2026-10-16)

- **Branch / Base / Working tree**:
  - Branch: `fix/foundation-state-boundaries-01` tạo từ `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (`origin/main`).
  - HEAD: `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (chưa commit/push/merge).
  - Working tree: Hoàn thành đầy đủ 4 nhóm runtime-validation guards, bổ sung 26 regression tests, hoàn thành tooling, lint, lockfile, và tài liệu kiểm chứng theo `WP-FOUNDATION-STATE-BOUNDARIES-01`, `WP-FOUNDATION-PREPUBLICATION-01`, `PREPUBLICATION_CORRECTIONS.md`, `WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01` và `WP-VALIDATION-GUARDS-01`.

- **Chi tiết các gói công việc đã hoàn thành**:
  1. **Bảo tồn ranh giới State & Dispatcher (`WP-FOUNDATION-STATE-BOUNDARIES-01`)**:
     - `packages/core/src/domain/gamestate.ts`: `validateGameState` từ chối `NamedCharacter` trùng ID trên toàn `GameState` (trả `INVALID_CHARACTER`); `executeCommand` trả `INVALID_STATE` không đổi input/clock/kho; các NPC khác ID hoạt động bình thường. Không chạm `economy.ts`.
     - `packages/simulation/src/dispatcher.ts`: Đưa `structuredClone` vào error boundary `try/catch`, bắt lỗi `DataCloneError` trả `EXECUTION_ERROR` và bảo toàn state gốc khi state chứa field function. Giữ nguyên kiểm thử rollback.
  2. **Giải quyết cảnh báo phụ thuộc & Cổng Lint (`WP-FOUNDATION-PREPUBLICATION-01`)**:
     - Bổ sung `"yaml": "^2.4.2"` vào root `devDependencies` trong `package.json`, giải quyết dứt điểm xung đột peer graph.
     - Thiết lập cấu hình phẳng `eslint.config.mjs` với 6 quy tắc an toàn cốt lõi; tạo script `"lint": "eslint . --max-warnings=0"`.
     - Nâng cấp runtime CI lên Node 24 và tường minh hóa lệnh build từng workspace.
     - Sửa hợp đồng lỗi và lệnh hồi quy trong tài liệu kiểm chứng; khôi phục kế hoạch Medal lịch sử.
  3. **Nâng cấp Tooling Lint Được Hỗ Trợ & Định Dạng Tài Liệu Lịch Sử (`WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01`)**:
     - Nâng cấp `eslint` lên `10.12.0` (bản Current được hỗ trợ, giải quyết nợ hỗ trợ ESLint 9 EOL); ghim cố định `@typescript-eslint/parser` `8.71.2`, `eslint-plugin-svelte` `3.23.1`; giữ nguyên `eslint.config.mjs` (SHA256 `29a843a7`).
     - Định dạng trình bày 4 tài liệu lịch sử/đóng băng (`docs/ENCYCLOPEDIA_MECHANICS.md`, `docs/work_packages/POP-01A_Implementation_Plan.md`, `docs/work_packages/WP-HAVEN-02_Unified_v1.0.md`, `docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md`), xóa sạch 372 diagnostics mà không thay đổi logic/code/công thức/spec/link.
     - Ghi nhận 2 thay đổi độ sâu tiêu đề khai báo: `POP-01A` dòng 2 (h1 $\rightarrow$ h2), `WP-HAVEN-02` dòng 2 (h1 $\rightarrow$ h2); 1 thay thế thẻ `<br>` bằng khoảng trắng tại ô D20 của `WP-HAVEN-02`.
     - Lưu giữ dấu vết nguồn gốc canonical blob `bbb17416f92d28d5f49e9d593c9dc425d16e283a` của Plan Medal.
  4. **Runtime Validation Guards & Đóng Gói Nghiệm Thu R1 (`WP-VALIDATION-GUARDS-01`, v1.1)**:
     - `packages/core/src/domain/gamestate.ts`: Bổ sung 4 nhóm pure runtime-validation guards:
       - `worldMetadata`: bắt buộc `worldSeed` là finite number (hỗ trợ seed 0, âm, phân số) và `gameVersion` là string.
       - `authority` & `reputation`: bắt buộc finite number nằm trong đoạn $[0, 100]$ cho các settlement fields.
       - `status`: bắt buộc thuộc canonical union (`unexplored | discovered | active | handoff | legacy`).
       - `facilities`: bắt buộc là array; mỗi phần tử non-null, non-array object chứa `id`, `name`, `type` là string; `stage` thuộc `planning | site_prep | construction | operational | damaged`; `level`, `capacity`, `assignedWorkerCount` là finite number; `assignedManagerId` nếu có phải là string.
       - Giữ nguyên unknown extension keys để `structuredClone` error boundary (`EXECUTION_ERROR`) tiếp tục hoạt động.
     - `packages/core/src/domain/__tests__/domain.test.ts`: Bổ sung 6 tests RED/GREEN bao quát các trường hợp biên và positive controls cho 4 nhóm guards.
     - `packages/simulation/src/__tests__/dispatcher.test.ts`: Bổ sung 20 tests hồi quy:
       - Pre-gate validation từ chối state lỗi trước khi chạm syntax check / authority / handler; chứng minh thứ tự ưu tiên bằng malformed-command control.
       - Post-gate validation trả về `INVARIANT_VIOLATION` và rollback trạng thái ban đầu khi draft bị handler sửa hỏng.
       - Replay determinism 3 ngày liên tiếp trên 2 bản sao độc lập cho kết quả từng bước giống hệt nhau.
       - Rollover ranh giới năm: ngày 365, tuần 53, năm 1 $\rightarrow$ ngày 366, tuần 53, năm 2.
       - Mở rộng test 0 active settlement: so sánh sâu (deep equality) toàn bộ Legacy settlement trước và sau.
       - Mở rộng kiểm tra ranh giới kinh tế: 0 dân số (0 tiêu thụ, 0 thiếu hụt), tồn kho (0,0), (23,23), (8,100), (100,5), bảo toàn toàn bộ Legacy settlement.
     - `tests/e2e/smoke.spec.ts`: Bổ sung assertion kiểm tra tiêu thụ nước sạch ($100 \rightarrow 77 \rightarrow 54 \rightarrow 31 \rightarrow 8 \rightarrow 0 \rightarrow 0 \rightarrow 0$) và tiến sang Ngày 8 với audit log của Ngày 7.
     - Bằng chứng biên dịch ngoài repo LAW-06: `positive_check.ts` exit code 0 (`tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck`); `negative_control.ts` exit code 1 với lỗi TS2344 đúng thiết kế.

- **Danh sách file trong phạm vi (23 files: 13 tracked modified, 10 untracked, 0 staged)**:
  - *Tracked modified (13)*:
    - `.github/workflows/ci.yml`
    - `docs/ENCYCLOPEDIA_MECHANICS.md`
    - `docs/INTERNAL_PROGRESS_TRACKER.md`
    - `docs/work_packages/POP-01A_Implementation_Plan.md`
    - `docs/work_packages/WP-HAVEN-02_Unified_v1.0.md`
    - `package-lock.json`
    - `package.json`
    - `packages/core/src/domain/__tests__/domain.test.ts`
    - `packages/core/src/domain/gamestate.ts`
    - `packages/simulation/src/__tests__/dispatcher.test.ts`
    - `packages/simulation/src/dispatcher.ts`
    - `packages/ui/package.json`
    - `tests/e2e/smoke.spec.ts`
  - *Untracked (10)*:
    - `HANDOFF.md`
    - `eslint.config.mjs`
    - `docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md`
    - `docs/verification/DEPENDENCY-TRIAGE-2026-10-16.md`
    - `docs/verification/FOUNDATION-STATE-BOUNDARIES-01.md`
    - `docs/verification/SUPPORTED-LINT-HISTORICAL-FORMAT-01.md`
    - `docs/verification/VALIDATION-GUARDS-01.md`
    - `docs/work_packages/WP-FOUNDATION-PREPUBLICATION-01.md`
    - `docs/work_packages/WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01.md`
    - `docs/work_packages/WP-VALIDATION-GUARDS-01.md`

- **Checkpoints Tiến Trình & Trạng Thái Xác Minh (Dated Checkpoints - 2026-10-16)**:
  - **Checkpoint 1 (Lúc Reviewer/Tester phát hiện lỗi, 2026-10-16)**:
    - Chức năng, lint, typecheck, build, browser smoke test và audit đạt kết quả cục bộ.
    - Đồ thị phụ thuộc gặp lỗi T1 (xung đột peer YAML), T2 (filter test 0 execution), T3 (mô tả sai error contract), R1 (sai số baseline tinypool/source-map-js), R2 (thiếu allowlist trong WP).
    - Nhánh `main` được Human bật Branch Protection độc lập trên GitHub (PR required, Actions check quality-gate app 15368 cho mọi người, strict up-to-date, admin enforced, cấm force-push/delete, không bật dismiss-stale-approvals).
  - **Checkpoint 2 (Sau khi hoàn tất hiệu chỉnh PREPUBLICATION_CORRECTIONS & áp dụng patch 5 docs, 2026-10-16)**:
    - Reviewer đã xác minh và ban hành kết luận: `REVIEWER PASS — five-document correction` tại `APPLIED_DOC_REVIEW_MANIFEST.json`.
    - Đã tách bạch Tester correction mới PASS local T1–T3 với kết quả lịch sử; 5 link target trong tracker trỏ đúng file tồn tại; 5 deliverable docs đạt 0 markdown diagnostics.
  - **Checkpoint 3 (Hoàn tất WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01, 2026-10-16)**:
    - Nâng cấp `eslint@10.12.0` (xác minh official registry không deprecated, tương thích Node `>=24`).
    - Clean isolated `npm ci` trong thư mục cách ly: **Exit code `0`**, `npm ls --all --json`: **Exit code `0`**, `npm audit --audit-level=moderate`: **Exit code `0`**.
    - 6 fixtures pass; `--print-config` xác nhận 6 quy tắc an toàn ở mức error `[2]`.
    - Định dạng trình bày 4 tài liệu lịch sử/đóng băng: diagnostics giảm từ 372 về **0**; toàn bộ 11 tài liệu markdown trong repo đạt **0 diagnostics**.
    - Các cổng chất lượng: `npm run lint` exit 0, `npm run typecheck` exit 0 (5/5 packages), `npm test -- --no-cache` exit 0 (220 tests), `npm run build` exit 0, `npm run test:smoke` exit 0, `git diff --check` exit 0.
    - Toàn bộ 4 file code và test của `WP-FOUNDATION-STATE-BOUNDARIES-01` được giữ nguyên 100% byte-for-byte.
  - **Checkpoint 4 (Hoàn tất WP-VALIDATION-GUARDS-01 — R1 Closure v1.1, 2026-10-16)**:
    - 4 nhóm pure runtime-validation guards được tích hợp trong `packages/core/src/domain/gamestate.ts`.
    - Unit test suite: **246/246 tests passed** trên 11 test files (tăng 26 tests so với snapshot baseline 220).
    - Playwright smoke test: **1/1 passed** (16.1s), xác nhận tiêu thụ nước sạch và tiến sang ngày 8.
    - Cổng chất lượng toàn diện:
      - `npm run lint`: Exit code `0` (0 errors, 0 warnings).
      - `npm run typecheck`: Exit code `0` (5/5 packages).
      - `npm test -- --no-cache`: Exit code `0` (246 tests passed).
      - `npm run build`: Exit code `0` (Core, Simulation, UI dist bundle 23.59 kB gzip).
      - `npm run test:smoke`: Exit code `0` (1 passed).
      - `npm audit --audit-level=moderate`: Exit code `0` (0 vulnerabilities).
      - `git diff --check`: Exit code `0` (không có trailing whitespace/line error).
    - Bằng chứng LAW-06 compile-only ngoài repo: `positive_check.ts` exit code 0; `negative_control.ts` exit code 1 (TS2344).

- **Vấn đề còn mở (Giữ nguyên)**:
  - **Bảo vệ nhánh `main`**: Đã được kích hoạt thành công trên GitHub (PR required, required check `quality-gate`, strict up-to-date, admin enforced, force-push/deletion disabled).
  - **Mức độ tích hợp & Release Status**: Các module `social`, `resource/allocation`, `status/effects`, `medal` mới ở **L3 (module nội bộ)**; `App.svelte` là **L3 prototype chạy trong RAM, chưa có save/load bền vững (chưa đạt L4)**; `persistence` mới ở **L1**; `POP-01B`/`POP-01C`/`POP-02`/`POP-03` vẫn ở **DESIGN ONLY**. **Không tuyên bố release ready.**
  - **Trạng thái lưu trữ**: Toàn bộ thay đổi đang ở working tree trên nhánh `fix/foundation-state-boundaries-01` (chưa stage, chưa commit, chưa push, chưa merge).

- **Bước tiếp theo cho Reviewer & Tester (Codex / Tester độc lập)**:
  1. Kiểm tra trạng thái Git và diff: `git status --short --branch`, `git diff --check`, `git diff`.
  2. Xác minh đồ thị phụ thuộc và cài đặt sạch: thực hiện clean `npm ci` trong thư mục bản sao tạm, chạy `npm ls --all --json` (yêu cầu exit code 0, không có `ELSPROBLEMS`).
  3. Chạy toàn bộ các cổng kiểm tra bắt buộc: `npm run lint`, `npm run typecheck`, `npm test -- --no-cache`, `npm run build`, `npm run test:smoke`, và `npm audit --audit-level=moderate`.
  4. Quét markdown lint để xác nhận 0 diagnostics trên toàn bộ tài liệu dự án.
  5. Đối chiếu tài liệu kiểm chứng [VALIDATION-GUARDS-01.md](docs/verification/VALIDATION-GUARDS-01.md) và kế hoạch [WP-VALIDATION-GUARDS-01.md](docs/work_packages/WP-VALIDATION-GUARDS-01.md) trước khi báo cáo cho Human/Điều phối phê duyệt commit và mở PR.

---

## Hồ sơ khảo sát trước đó (Giữ nguyên lịch sử)

Cập nhật khảo sát: 2026-10-16; bổ sung bằng chứng điều phối xác minh lúc 04:49 UTC. Trạng thái: merge/main và CI đã xác minh qua điều phối; còn đối chiếu tracker G6, chưa mở WP mới.

## Mục tiêu, phạm vi và nguồn

- Repo: `D:\NghienCuuTiemNang\Build-Settlement`; chỉ Build-Settlement trên Admin-PC.
- WP hiện hành được tìm thấy: `WP-HAVEN-MEDAL-CORE-FOUNDATION-01`: Medal deterministic, validation, 3 slot, equip/replace/unequip nguyên tử, modifier projection.
- Spec: [Medal design](docs/superpowers/specs/2026-10-02-medal-core-equip-modifier-foundation-design.md), commit `56a3ad853f4ce182b1724b6251807adc8298047e`.
- Plan chính xác chỉ có trong Git ref lưu trên máy: `da2b13b7a4d3b9aa38df7fe06c3c6faca195b0bb:docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md`. Đọc bằng `git show <commit>:<path>`; không khôi phục hay sửa Plan.
- Ngoài phạm vi WP: UI, challenge/content/balance, modifier composition và áp dụng gameplay, persistence/migration, City Effect redesign, root core export. Plan cũ chỉ định Antigravity là single-writer Builder; Reviewer độc lập. Giữ Antigravity làm writer hiện tại chỉ là đề xuất, chưa xác nhận quyền viết của agent.
- Quy tắc: [AGENTS.md](AGENTS.md). Trước khảo sát không thấy `.agents/skills`, HANDOFF hay tài liệu bàn giao riêng trong checkout; Plan có mục G3/G4 Handoff Requirements.

## Snapshot Git đã kiểm

- Branch: `feat/medal-core-loadout-foundation-01`.
- HEAD: `2eca6cc25898d5263dc195a319c2bbfc0d079c79`; upstream lưu trên máy cùng SHA.
- Working tree sạch trước khảo sát; thay đổi được phép của lượt này chỉ là file HANDOFF.md mới, chưa stage.
- Ref `origin/main` lưu trên máy: `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`, merge PR #9, parent thứ hai là HEAD trên. `git diff --exit-code HEAD origin/main`: rỗng, exit 0. Local `main` vẫn ở `f1bb096`; không switch/reset/fetch trong lượt này.
- Ref `origin/main` trên là remote-tracking cục bộ. Riêng GitHub đã được điều phối xác minh lúc 04:49 UTC 2026-10-16: `main` đúng SHA `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`; [PR #9](https://github.com/tanntran2000/Build-Settlement/pull/9) `merged=true`, `merged_at=2026-10-07T07:33:48Z`, merge SHA trùng. Đây là bằng chứng điều phối cung cấp qua GitHub connector, không phải truy vấn CLI thành công trong lượt này.

## Đã xác minh / còn dở

- Code và test cho Tasks 1–4 hiện diện trong [medal/](packages/core/src/medal/): validation, eligibility, atomic transitions, projection, barrel nội bộ. Các commit chính: `bfe55e5`, `3a709c6`, `3bfadd0`, `deafb83`; HEAD chỉ chỉnh whitespace test.
- So với spec commit, diff chỉ gồm đúng 8 file trong allowlist Plan (5 module và 3 test). Protected-path diff rỗng: `status/effects.ts`, `packages/persistence`, tracker, root core index (exit 0). `git diff --check 56a3ad8...HEAD`: rỗng, exit 0.
- Kiểm tra local trên là kiểm tra tĩnh; M24 có bằng chứng diff. CI quality-gate SUCCESS được điều phối cung cấp bên dưới; chưa đọc log từng bước để ghi số test/exit code riêng hoặc chứng nhận đầy đủ mapping M01–M25. Không coi việc chưa chạy lại local là CI thất bại.
- [Tracker](docs/INTERNAL_PROGRESS_TRACKER.md) chưa ghi Medal hay liên kết hậu kiểm merge #9. Đây là phần G6 còn thiếu đã thấy trực tiếp. [AGENTS.md dòng 62](AGENTS.md#3-quy-trình-phát-triển-7-cổng-kiểm-soát-lifecycle-gates-g0-rightarrow-g6) định nghĩa G6: kiểm tra commit trên main, cập nhật tracker và liên kết bằng chứng hoàn thành; LAW-07 yêu cầu SHA/log/exit code/đối chiếu nghiệm thu.
- [Roadmap](docs/MASTER_ROADMAP.md) và [WP-HAVEN-02](docs/work_packages/WP-HAVEN-02_Unified_v1.0.md) còn POP-01B/01C ở DESIGN ONLY; không tự coi là WP triển khai tiếp theo đã duyệt.

## Kiểm thử và blocker

- Lượt này không chạy unit test/typecheck/build/smoke. Bằng chứng CI sau do điều phối xác minh qua GitHub connector lúc 04:49 UTC 2026-10-16, không phải test local vừa chạy:
  - HEAD `2eca6cc25898d5263dc195a319c2bbfc0d079c79`: [quality-gate SUCCESS, run 36988198913](https://github.com/tanntran2000/Build-Settlement/actions/runs/36988198913/job/110777976731).
  - Merge/main `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`: [quality-gate SUCCESS, run 37588093308](https://github.com/tanntran2000/Build-Settlement/actions/runs/37588093308/job/112682826378).
  - Workflow [ci.yml](.github/workflows/ci.yml) gồm typecheck toàn workspace, npm test, build UI, browser smoke. Chưa chép số test hay exit code từng bước khi chưa đọc log chi tiết.
- Tracker ghi lịch sử 173 tests và CI [36965142356](https://github.com/tanntran2000/Build-Settlement/actions/runs/36965142356) tại `c7beed21a27896d12796d008bfd5248630410a22` (PR #7); không phải bằng chứng Medal HEAD hay vừa chạy.
- `test-results/.last-run.json` ghi passed, mtime 2026-10-02T04:34:09Z, nhưng thiếu SHA/lệnh/exit code; không dùng làm bằng chứng nghiệm thu.
- Lịch sử khảo sát: CLI `gh pr view 9` và `gh run list --commit <merge/HEAD SHA>` tới `api.github.com:443` từng bị socket access forbidden, exit 1; không thử đường vòng/chạy lại mạng. Kết luận cũ “PR/CI chưa xác minh online” đã được thay thế bằng bằng chứng điều phối ở trên; không còn là blocker PR/CI.
- Chưa xác nhận hai agent đã ngừng viết; working tree sạch không thay thế việc điều phối writer.

## Next action và quyền sửa

1. Điều phối xác nhận một writer. Đề xuất giữ vai trò Plan: Antigravity Builder, Codex đọc/review; không gửi lệnh cho agent khác trong lượt khảo sát.
2. Dùng PR/main/CI đã xác minh ở trên để đối chiếu log từng bước, SHA và M01–M25 theo Plan; không mặc định cần chạy lại toàn bộ test local khi CI đã đủ bằng chứng. Không chạy lại preflight G2 cũ đòi main bằng base `935ffdc`.
3. Giao riêng việc cập nhật tracker G6 cho Medal: ghi merge SHA, liên kết hai CI run, kết quả thực chứng và mức độ tích hợp đúng thực tế. Chưa được sửa tracker trong lượt này; chưa tuyên bố G6 đóng.
4. Sau G6: Plan Medal chỉ có Tasks 1–4 và verification/handoff, không giao thêm tính năng. Spec mục 10 liệt kê các follow-up thiết kế (Challenge Engine, Collection UI, Modifier Composition, integration, persistence, balance); Roadmap đặt POP-01B rồi POP-01C ở DESIGN ONLY. Human chọn/duyệt WP cụ thể theo AGENTS.md G1 trước code; không tự chọn mục mới.

- Allowlist hiện tại: **chỉ HANDOFF.md**. Không sửa code, Plan, tracker, dependency; không commit/push/merge.
- Dừng ghi nếu HANDOFF xuất hiện/thay đổi đồng thời; giữ mọi mục chưa giải quyết và lịch sử. HOLD nếu HEAD/branch hoặc working tree đổi ngoài dự kiến, chưa chốt writer/WP, cần vượt phạm vi, hoặc cùng lỗi vẫn thất bại sau 2 lượt sửa. Báo thao tác/đích/lỗi khi bị chặn; không bypass.
