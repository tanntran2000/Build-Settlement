# Báo Cáo Nghiệm Thu & Bằng Chứng Kỹ Thuật (VALIDATION-GUARDS-01)

> **Gói công việc**: `WP-VALIDATION-GUARDS-01` (R1 Closure Implementation Plan v1.1 & Correction R1-VALIDATION-CORRECTION-01)\
> **Nhánh thực hiện**: `fix/foundation-state-boundaries-01`\
> **Commit nền**: `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`\
> **Candidate Snapshot (trước chỉnh docs)**: `0a63c37f177e1efca44a781a02ea7cbbabb489bf1247ec982fedb64752ae2633` (90 files)\
> **Manifest kiểm chứng Tester**: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\manifest.json` (SHA256: `42e1f8581bd9e5fa27a7643ff18ee8227c21d278a9c1176795de9ad553f3f6d8`)\
> **Ngày thực hiện**: 2026-10-16\
> **Người thực hiện**: Antigravity (Single-writer)\
> **Trạng thái**: READY FOR CODEX REVIEW & TESTER VERIFICATION (Chưa commit, chưa push, chưa merge)

---

## 1. Tóm Tắt Mục Tiêu & Phạm Vi

1. Bổ sung 4 nhóm runtime-validation guard thuần túy (pure guards) trong `validateGameState` (`packages/core/src/domain/gamestate.ts`):
   - **WorldMetadata**: `worldSeed` là finite number (chấp nhận 0, âm, phân số); `gameVersion` là string.
   - **Authority & Reputation**: finite number trong đoạn $[0, 100]$ đối với các trường của Settlement.
   - **Settlement Status**: bắt buộc thuộc tập canonical union (`unexplored | discovered | active | handoff | legacy`).
   - **Facilities**: bắt buộc là array; mỗi phần tử là object (non-null, non-array) có `id`, `name`, `type` là string; `stage` thuộc `planning | site_prep | construction | operational | damaged`; `level`, `capacity`, `assignedWorkerCount` là finite number; `assignedManagerId` nếu có phải là string.
   - Khử triệt để lỗi nội suy đối tượng unconvertible (`{"toString": null, "valueOf": null}`) tại 5 trường trên bằng thông báo tĩnh, trả về `INVALID_STATE` bình thường không ném `TypeError`.
   - Bảo toàn unknown extension keys để không phá vỡ structuredClone error boundary (`EXECUTION_ERROR`).
2. Bổ sung đầy đủ regression test RED/GREEN trong `packages/core/src/domain/__tests__/domain.test.ts`.
3. Bổ sung pre-gate, post-gate và các test hồi quy R1 còn thiếu trong `packages/simulation/src/__tests__/dispatcher.test.ts`:
   - Pre-gate validation từ chối state lỗi trước khi chạm syntax check / authority / handler; chứng minh thứ tự ưu tiên bằng malformed-command control và legacy target control.
   - Post-gate validation trả về `INVARIANT_VIOLATION` và rollback trạng thái ban đầu khi draft bị handler sửa hỏng (kiểm tra độc lập cho cả authority và reputation, không rò rỉ effects/audit).
   - 3-day replay determinism (chạy 3 ngày liên tiếp trên 2 bản sao độc lập cho kết quả từng bước giống hệt nhau).
   - Rollover ranh giới năm: ngày 365, tuần 53, năm 1 $\rightarrow$ ngày 366, tuần 53, năm 2.
   - Mở rộng test 0 active settlement: chụp và so sánh sâu (deep equality) toàn bộ input và Legacy settlement trước/sau dispatch.
   - Mở rộng kiểm tra ranh giới kinh tế: 0 dân số (0 tiêu thụ, 0 thiếu hụt), tồn kho (0,0), (23,23), (8,100), (100,5), bảo toàn toàn bộ Legacy settlement.
4. Bổ sung assertion kiểm tra nước sạch ($100 \rightarrow 77 \rightarrow 54 \rightarrow 31 \rightarrow 8 \rightarrow 0 \rightarrow 0 \rightarrow 0$) và tiến sang Ngày 8 trong Playwright smoke test `tests/e2e/smoke.spec.ts`.
5. Thực hiện kiểm chứng biên dịch LAW-06 độc lập ngoài repo với TypeScript strict compiler (`positive.ts` exit 0, `negative.ts` exit 2 với lỗi TS2344).

---

## 2. Bằng Chứng Thực Nghiệm Chi Tiết (LAW-07)

### 2.1. Kiểm Tra Biên Dịch Type Equality Ngoài Repo (LAW-06)

Đã kiểm chứng đẳng cấu type giữa `GameState` và `WorldSaveData` bằng fixture thật độc lập:

- Fixture positive: `tester-law06/positive.ts` (SHA256: `6b22cac8bd60d9a1b00dc47369ca2c26597034c491e934d5c212b78ca9630046`)
  - `WorldSaveData["currentDate"]` $\equiv$ `GameState["currentDate"]`
  - `WorldSaveData["settlements"]` $\equiv$ `GameState["settlements"]`
  - `WorldSaveData["activeSettlementId"]` $\equiv$ `GameState["activeSettlementId"]`
  - `WorldSaveData["worldSeed"]` $\equiv$ `GameState["worldMetadata"]["worldSeed"]`
  - `WorldSaveData["gameVersion"]` $\equiv$ `GameState["worldMetadata"]["gameVersion"]`
  - `WorldSaveData["schemaVersion"]` $\equiv$ `number`

Lệnh thực thi positive check:

```bash
node node_modules/typescript/bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck tester-law06/positive.ts
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- **Kết quả**: Exit code `0` (không có lỗi type).
- Raw log: `law06-positive.log` (SHA256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`).

- Fixture negative: `tester-law06/negative.ts` (SHA256: `bd34e11cb3de8bda343116bcbab6c0942c980c75ad7a72a4559cc6c87973bedf`), so sánh `string` với `GameState["currentDate"]`.

Lệnh thực thi negative control:

```bash
node node_modules/typescript/bin/tsc --noEmit --strict --target ES2022 --module ESNext --moduleResolution bundler --skipLibCheck tester-law06/negative.ts
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- **Kết quả**: Exit code `2` (Mã thoát thực tế của compiler `tsc` khi phát hiện lỗi type chẩn đoán; không ép thành exit 1).
- Compiler xuất lỗi chẩn đoán:
  `tester-law06/negative.ts(5,19): error TS2344: Type 'false' does not satisfy the constraint 'true'.`
- Raw log: `law06-negative.log` (SHA256: `ad70f0fd35f5c1785c5e7b79a561ac91b8b146befdb9acb144478c75883421b9`).
- Chứng minh bộ kiểm tra type assertion hoạt động chính xác và nhạy cảm.

### 2.2. Kiểm Thử Đầy Đủ & Phân Bổ 334 Ca Chấp Nhận (Accepted Main Cases)

Lệnh thực thi suite unit repo:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" test -- --no-cache
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- Raw log: `unit.log` (SHA256: `7eca475bde5b5718c84a35adb7c549a8207177c6041530698a70b104ad3acacb`)
- **Kết quả Unit Suite**:
  - 11/11 test files PASS
  - 252/252 repo unit tests PASS (tăng 32 tests so với baseline 220 của snapshot trước)
    - `packages/core/src/domain/__tests__/domain.test.ts`: **42 tests** (baseline: 28 $\rightarrow$ candidate: 42, **tăng 14 tests**; riêng lượt correction vừa rồi từ 38 $\rightarrow$ 42, **tăng 4 tests**).
    - `packages/simulation/src/__tests__/dispatcher.test.ts`: **43 tests** (baseline: 25 $\rightarrow$ candidate: 43, **tăng 18 tests**; riêng lượt correction vừa rồi từ 41 $\rightarrow$ 43, **tăng 2 tests**).
    - Các test file còn lại giữ nguyên 167 tests (42 tests Medal, 53 tests effects, 21 tests resource core, 8 tests foundation social, 24 tests allocation, 16 tests workforce, 3 tests architecture).
  - Exit code: `0`

**Phân bổ toàn bộ 334 ca kiểm thử được chấp nhận (accepted main cases)**:

| Phân Loại Ca Kiểm Thử | Số Lượng | Log File Tương Ứng | Log SHA256 |
| :--- | ---: | :--- | :--- |
| **Repo Unit Tests** (11 files trong repo) | 252 | `unit.log` | `7eca475bde5b5718c84a35adb7c549a8207177c6041530698a70b104ad3acacb` |
| **Independent R1 & Correction Tests** | 52 | `independent-final.log` | `82553b3e96db18e14db50cd65089a60a7aada776c9bdfd57f69eacd17c0ac581` |
| **Boundary Regression Tests** | 28 | `boundary.log` | `6d942eb9d335778c84036f01cd26e1f452d36c24974fd090d4cdde44cf595f5d` |
| **Error Contract Test** | 1 | `error-contract.log` | `de22a223419301e099f8f60346c704079ab4f3ab5024f72581200366015f2309` |
| **Browser Smoke Test** (Playwright) | 1 | `smoke.log` | `001b0931ba4773d44d7834a9ec8cc07b34d6c32388bcb8d4e01385a863adde5b` |
| **Tổng cộng Accepted Cases** | **334** | — | — |

*Lưu ý phân loại*: Tuyệt đối không gọi toàn bộ 334 ca là unit tests. Không cộng dồn các lượt chạy lặp targeted (85 tests) hoặc các ca đối chứng độ nhạy (sensitivity controls: 10 GREEN / 10 expected RED).

### 2.3. Linter (ESLint)

Lệnh thực thi:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run lint
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- Raw log: `lint.log` (SHA256: `0ec7ffb0e847af318f7fc0725431f6366384322bd1048320091ab8e18ac3937a`)
- **Kết quả**: `eslint . --max-warnings=0`
- Exit code: `0` (0 errors, 0 warnings).
- 6 lint safety fixtures (`ts-clean`, `ts-bad`, `js-clean`, `js-bad`, `svelte-clean`, `svelte-bad`) đạt đúng kỳ vọng (clean exit 0, bad exit 1 bắt đúng `no-debugger`).

### 2.4. TypeScript Check (Tsc + Svelte-check)

Lệnh thực thi:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run typecheck
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- Raw log: `typecheck.log` (SHA256: `37d53e867b76d6dd6c239319f0532cb2be58bc0ed3f36bba07444b4e3ae28a1d`)
- **Kết quả**:
  - `tsc -p packages/core/tsconfig.json --noEmit`: PASS
  - `tsc -p packages/simulation/tsconfig.json --noEmit`: PASS
  - `tsc -p packages/persistence/tsconfig.json --noEmit`: PASS
  - `tsc -p packages/content/tsconfig.json --noEmit`: PASS
  - `svelte-check --tsconfig ./tsconfig.json`: `found 0 errors and 0 warnings`
- Exit code: `0`

### 2.5. Production Build (Vite + Tsc)

Lệnh thực thi:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- Raw log: `build.log` (SHA256: `7df1898de75f06bd8fa071c7be39214c4fc6cdcf941366b593033288d3a917b6`)
- **Kết quả**:
  - Core build (`tsc`): PASS
  - Simulation build (`tsc`): PASS
  - UI build (`vite build`): PASS (dist index.html 0.71 kB, css 0.90 kB gzip 0.48 kB, js 69.37 kB gzip 23.57 kB)
- Exit code: `0`

### 2.6. Playwright E2E Smoke Test

Lệnh thực thi:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run test:smoke
```

- Môi trường: `CI=1` (khởi chạy preview server cổng 4173 strict, không tái sử dụng server cũ)
- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- Raw log: `smoke.log` (SHA256: `001b0931ba4773d44d7834a9ec8cc07b34d6c32388bcb8d4e01385a863adde5b`)
- **Kết quả**:
  - 1/1 test PASS (Chromium headless: 5.1s cho test, 10.7s tổng lượt chạy)
  - Xác nhận kho nước sạch ban đầu là 100, tiêu thụ 23 mỗi ngày cùng lương thực: $100 \rightarrow 77 \rightarrow 54 \rightarrow 31 \rightarrow 8 \rightarrow 0 \rightarrow 0 \rightarrow 0$.
  - Xác nhận tiến sang Ngày 8 với audit log của Ngày 7.
- Exit code: `0`

### 2.7. Dependency Security Audit & Tree Cleanliness

Lệnh thực thi audit:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" audit --json --audit-level=moderate --registry=https://registry.npmjs.org
```

- Cwd: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\candidate`
- Raw log: `audit.log` (SHA256: `78d9a3a764a911384d263708d5da4d94d2045d49cde29dd0c7d8ba7788311866`)
- **Kết quả**: `found 0 vulnerabilities` (info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0). Exit code: `0`.

Lệnh thực thi dependency tree:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" ls --all --json
```

- Raw log: `tree.log` (SHA256: `4ac76995b94fb0999f11645463282383ed516591c5f339b52a5a8ac1bdbb7328`)
- **Kết quả**: Exit code `0` (không có error, invalid hay missing package).

Lệnh thực thi clean installation:

```bash
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" ci --registry=https://registry.npmjs.org
```

- Raw log: `clean-ci.log` (SHA256: `52dc6f862986c7e0ef4548203537df4613218f16d27d9565f284fbff4d19fa88`)
- **Kết quả**: Exit code `0` (189 packages added, audited 195 packages, lockfile SHA256: `5736e6c85b8655d810807d3477198689a466d7d2feabfd9012d1f5abcb51ab3d`).

### 2.8. Git Diff & Whitespace Safety

Lệnh thực thi:

```bash
git diff --check
```

- Cwd: `D:\NghienCuuTiemNang\Build-Settlement`
- Raw log: `diff-check-final.log` (SHA256: `f01d48581640fb6d9aa02967a3a15e8b34dee35289672ff40019e23735a76cb4`)
- **Kết quả**: Exit code `0` (không có trailing whitespace hay lỗi định dạng dòng).

---

## 3. Danh Sách Tệp Thay Đổi Thuộc Phạm Vi WP v1.1 & Correction

1. `packages/core/src/domain/gamestate.ts` (Source duy nhất): Thêm pure runtime-validation guards cho metadata, authority, reputation, status, facilities; dùng chuỗi thông báo tĩnh cho các unconvertible objects.
2. `packages/core/src/domain/__tests__/domain.test.ts` (Regression test core): 42 tests (baseline: 28 $\rightarrow$ candidate: 42, tăng 14 tests; riêng lượt correction từ 38 $\rightarrow$ 42, tăng 4 tests).
3. `packages/simulation/src/__tests__/dispatcher.test.ts` (Regression test simulation): 43 tests (baseline: 25 $\rightarrow$ candidate: 43, tăng 18 tests; riêng lượt correction từ 41 $\rightarrow$ 43, tăng 2 tests).
4. `tests/e2e/smoke.spec.ts` (E2E smoke test assertions): Bổ sung assertion tiêu thụ nước sạch và tiến sang Ngày 8.
5. `docs/work_packages/WP-VALIDATION-GUARDS-01.md`: Kế hoạch thực hiện v1.1.
6. `docs/verification/VALIDATION-GUARDS-01.md`: Báo cáo nghiệm thu và bằng chứng kỹ thuật này.
7. `docs/INTERNAL_PROGRESS_TRACKER.md`: Cập nhật trạng thái tiến độ R1.

---

## 4. Nguồn Gốc & Ràng Buộc Bằng Chứng Kiểm Thử (Provenance & Evidence Binding)

- **Candidate Tester Snapshot (trước chỉnh sửa tài liệu)**:
  - Snapshot SHA256: `0a63c37f177e1efca44a781a02ea7cbbabb489bf1247ec982fedb64752ae2633` (tính trên 90 files).
  - Manifest bằng chứng: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\manifest.json` (SHA256: `42e1f8581bd9e5fa27a7643ff18ee8227c21d278a9c1176795de9ad553f3f6d8`).
  - Danh mục SHA256 toàn bộ artifact: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\r1-correction-tester-evidence\artifacts-sha256.json`.
- **Ràng buộc tính toàn vẹn (Integrity Binding)**:
  - Bằng chứng thực nghiệm trên chứng nhận trạng thái candidate trước khi thực hiện chỉnh sửa tài liệu này.
  - Khi sửa đổi các tệp tài liệu (`.md`), hash toàn bộ candidate sẽ thay đổi tương ứng; tuyệt đối không tuyên bố hash snapshot cũ là hash mới sau khi sửa tài liệu.
  - Các tệp mã nguồn (`packages/core/src/domain/gamestate.ts`), bộ kiểm thử (`domain.test.ts`, `dispatcher.test.ts`), lockfile, cấu hình và CI giữ nguyên 100% hash nội dung.
- **Nội dung chưa xác minh (Unverified / Out of Scope)**:
  - Chưa có CI GitHub Actions chạy trên commit SHA cuối cùng tại Quality Gate G4 (trước khi Human merge tại G5 và hậu kiểm tại G6).
  - Chưa kiểm chứng hệ thống persistence lưu trữ bền vững (đọc/ghi file, import/export, New Game+); LAW-06 ở đây hoàn toàn là kiểm tra đẳng cấu kiểu (schema type equality).
  - Chưa mở các tính năng gameplay L4 vượt phạm vi gói R1 đã duyệt.
