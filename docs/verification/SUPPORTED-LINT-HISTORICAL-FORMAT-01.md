# Báo Cáo Kiểm Chứng: Supported Lint & Historical Markdown Format (SUPPORTED-LINT-HISTORICAL-FORMAT-01.md)

> **Mục đích**: Ghi nhận bằng chứng thực nghiệm, đối chiếu ngữ nghĩa và dấu vết nguồn gốc cho gói công việc `WP-SUPPORTED-LINT-HISTORICAL-FORMAT-01`.

---

## 1. Môi Trường Thực Thi & Snapshot Nền

- **Base commit**: `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (`origin/main`).
- **Nhánh làm việc**: `fix/foundation-state-boundaries-01`.
- **Hệ điều hành**: Windows 11, Node.js `v24.19.0`, npm `11.17.0`.
- **Snapshot được kiểm chứng của Checkpoint Tooling (ESLint 10 Upgrade)**:
  - Thư mục bằng chứng: `C:\Users\Admin\Documents\Codex\2026-10-16\task-2\supported-lint-tester-evidence\`
  - Manifest SHA256: `1b3602642c418caa6eef7759ed4de7f3fd9cad4b973e77a46eeee2dc841d5a14`
  - Snapshot SHA256: `b83508e82565daab7002288367a2ee6a4c2ed6641d2869748de64c0de11291e8` (tính trên 88 files đầu vào).
  - Lockfile SHA256: `5736e6c85b8655d810807d3477198689a466d7d2feabfd9012d1f5abcb51ab3d`
  - Trạng thái checkpoint lịch sử: Runtime checks PASS (clean-ci, tree, audit, lint, typecheck, unit 220, build, smoke 1, boundary 28, error-contract 1: tổng 250 test cases đạt, 6 lint fixtures đạt, 4 print-config formats đạt) nhưng tại thời điểm đó còn **HOLD** do 2 lỗi Markdown MD012 (dòng 102 của báo cáo kiểm chứng này và dòng 85 của kế hoạch WP tương ứng). Tuyệt đối không nhập nhằng trạng thái HOLD Markdown tại thời điểm checkpoint lịch sử đó với kết quả Markdown 0 hiện tại sau khi đã được khắc phục hoàn toàn.
- **Phiên bản công cụ lint được nâng cấp**:
  - `eslint`: `10.12.0` (thay thế bản EOL `9.39.5`).
  - `@typescript-eslint/parser`: `8.71.2` (ghim cố định theo peer graph).
  - `eslint-plugin-svelte`: `3.23.1` (ghim cố định theo peer graph).
  - `svelte-eslint-parser`: `1.9.0` (tiêu thụ gián tiếp qua plugin).

---

## 2. Kiểm Chứng Task 1: Supported Compatible Lint Tool

### A. Xác minh Registry npm chính thức trước khi cài đặt

- Lệnh kiểm tra: `npm view eslint@10.12.0 version deprecated engines dist.integrity --json --registry=https://registry.npmjs.org`
- Kết quả: **Exit code `0`**.
  - `version`: `"10.12.0"`.
  - `deprecated`: Không có (trường bị lược bỏ, package đang được hỗ trợ tích cực).
  - `engines`: `{"node": "^20.19.0 || ^22.13.0 || >=24"}` (hoàn toàn tương thích với Node.js `24.19.0`).
  - `dist.integrity`: `sha512-npHjrHb2o4ehH3mE+YuxABR+0gyb0aVWCIolgJDArwCiHEIsonBm3ZKjel5b0U5+a+MbEvIyRCGCzD3eKKK2NA==`.

### B. Kiểm chứng cài đặt sạch trong thư mục cách ly (Isolated Clean CI)

- Thực hiện `npm ci` trong thư mục tạm cách ly hoàn toàn (không sao chép `node_modules`):
  - `npm ci`: **Exit code `0`** (189 packages added, audited 195 packages).
  - `npm ls --all --json`: **Exit code `0`** (0 invalid/missing peers).
  - `npm audit --audit-level=moderate`: **Exit code `0`** (0 vulnerabilities).
  - `npm run lint`: **Exit code `0`** (0 errors, 0 warnings).
- Thông báo cài đặt (Notices):
  - Cảnh báo ESLint 9 EOL đã được giải quyết triệt để.
  - Ghi nhận trung thực notice npm policy: `npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts: esbuild@0.25.12`.

### C. Kiểm chứng 6 Fixtures & `--print-config`

- 6 Stdin fixtures chạy qua ESLint 10:
  1. `test.ts` sạch: **Exit code `0`**.
  2. `test.ts` có `debugger`: **Exit code `1`** (bắt đúng lỗi `no-debugger`).
  3. `test.js` sạch: **Exit code `0`**.
  4. `test.js` có `debugger`: **Exit code `1`** (bắt đúng lỗi `no-debugger`).
  5. `test.svelte` sạch: **Exit code `0`**.
  6. `test.svelte` có `debugger`: **Exit code `1`** (bắt đúng lỗi `no-debugger`).
- Kiểm tra `eslint --print-config` trên các định dạng `.ts`, `.js`, `.mjs`, `.svelte`:
  - Cả 6 quy tắc an toàn cốt lõi đều được cấu hình ở mức `error` (`[2]`): `no-debugger`, `no-dupe-args`, `no-unsafe-finally`, `no-unreachable`, `constructor-super`, `valid-typeof`.
  - `eslint.config.mjs` giữ nguyên vẹn SHA256 `29a843a7e0e9f4a7d5006192bff4bfd5963b05d47d795ecbd57dd5e755cf08b0`.

---

## 3. Kiểm Chứng Task 2: Định Dạng 4 Tài Liệu Lịch Sử / Đóng Băng

### A. Số lượng Markdown Diagnostics trước và sau

| Tài liệu | Diagnostics trước | Diagnostics sau | Quy tắc đã xử lý |
| :--- | ---: | ---: | :--- |
| `docs/ENCYCLOPEDIA_MECHANICS.md` | 132 | **0** | MD004 (86), MD022 (22), MD031 (2), MD032 (22) |
| `docs/work_packages/POP-01A_Implementation_Plan.md` | 67 | **0** | MD004 (10), MD022 (13), MD025 (1), MD031 (39), MD032 (4) |
| `docs/work_packages/WP-HAVEN-02_Unified_v1.0.md` | 160 | **0** | MD004 (125), MD022 (11), MD025 (1), MD031 (8), MD032 (13), MD033 (1), MD060 (1) |
| `docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md` | 13 | **0** | MD032 (8), MD047 (1), MD060 (4) |
| **Tổng cộng** | **372** | **0** | Đạt chuẩn markdownlint 0.41.1 |

### B. Đối chiếu tính tương đương ngữ nghĩa (Semantic Equivalence Whitelist)

- **Fenced code blocks**: 100% khớp byte-for-byte nội dung và ngôn ngữ chỉ định.
- **Formulas (KaTeX)**: 100% bảo tồn nguyên vẹn tất cả công thức toán.
- **Links & Images**: 100% bảo tồn nhãn và đích liên kết.
- **Table Cells**: Bảo tồn toàn bộ nội dung bảng; ngoại lệ duy nhất là thay thế `<br>` bằng khoảng trắng tại dòng 422 của WP-HAVEN-02 (mục D20).
- **Headings**: Bảo tồn toàn bộ văn bản và thứ tự tiêu đề; chỉ có 2 thay đổi độ sâu tiêu đề được khai báo trước theo chuẩn MD025:
  1. `POP-01A_Implementation_Plan.md` dòng 2: `# Gói: Class Resource Core...` $\rightarrow$ `## Gói: Class Resource Core...` (Level 1 $\rightarrow$ 2).
  2. `WP-HAVEN-02_Unified_v1.0.md` dòng 2: `# Mã Gói: WP-HAVEN-02...` $\rightarrow$ `## Mã Gói: WP-HAVEN-02...` (Level 1 $\rightarrow$ 2).

### C. Dấu vết nguồn gốc của Kế hoạch Medal lịch sử (Provenance Trace)

- Git ref gốc: `da2b13b7a4d3b9aa38df7fe06c3c6faca195b0bb:docs/superpowers/plans/2026-10-02-medal-core-loadout-foundation.md`.
- Canonical Git blob gốc: `bbb17416f92d28d5f49e9d593c9dc425d16e283a`.
- SHA256 file trước khi định dạng: `e9ed0fb9da7ae0c7cc1aad88174dc0dc8bcb4978cffe79875bbb78b94b8acca5`.
- SHA256 file sau khi định dạng: `60aa6ca55d1edc6f487ad8bd8a401dfb0fe8c35ec682c22be95d725b525282a7`.
- **Ghi chú**: Bản lưu trong working tree hiện là dẫn xuất định dạng trình bày (formatting derivative); bản gốc canonical blob vẫn được lưu trữ và truy nguyên qua Git ref lịch sử.

---

## 4. Kiểm Chứng Task 3: Toàn Bộ Cổng Chất Lượng (Quality Gates)

| Cổng kiểm tra | Lệnh thực thi | Kết quả | Ghi chú |
| :--- | :--- | :---: | :--- |
| **Lint** | `npm run lint` | **PASS (Exit 0)** | ESLint 10.12.0, 0 errors, 0 warnings |
| **Typecheck** | `npm run typecheck` | **PASS (Exit 0)** | 5/5 packages (`core`, `simulation`, `persistence`, `content`, `ui`) |
| **Unit Tests** | `npm test -- --no-cache` | **PASS (Exit 0)** | 11 test files, 220 unit tests passed (Vitest 4.1.11). Kết quả ghi nhận tại checkpoint tooling lịch sử (tổng 250 test cases: 220 unit + 28 boundary + 1 error-contract + 1 smoke); tách biệt rõ ràng với validation candidate hiện tại (252 repo unit tests, tổng 334 test cases). |
| **Build** | `npm run build` | **PASS (Exit 0)** | Core tsc, Simulation tsc, UI vite v6.4.4 |
| **Browser Smoke** | `npm run test:smoke` | **PASS (Exit 0)** | 1 passed trên Chromium headless |
| **Security Audit** | `npm audit --audit-level=moderate` | **PASS (Exit 0)** | 0 vulnerabilities |
| **Diff Check** | `git diff --check` | **PASS (Exit 0)** | 0 whitespace defects |
| **Markdown Lint** | Quét toàn bộ tài liệu | **PASS (0)** | 0 diagnostics trên toàn bộ 11 tài liệu |
