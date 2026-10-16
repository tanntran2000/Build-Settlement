# Báo Cáo Phân Tích & Xử Lý Phụ Thuộc (DEPENDENCY-TRIAGE-2026-10-16.md)

> **Gói công việc**: `WP-FOUNDATION-PREPUBLICATION-01`\
> **Thời điểm thẩm định**: 2026-10-16\
> **Môi trường thực thi**: Windows 11, Node.js `v24.19.0`, npm `11.17.0`\
> **Ràng buộc**: Thẩm định thực tế trên `npm audit --json`, không suy đoán hoặc chế tạo dữ liệu; đối chiếu các dải phiên bản bị ảnh hưởng và phương án xử lý tương thích.

---

## 1. Kết Quả Audit Ban Đầu (Baseline Trên Base `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`)

Ghi nhận baseline lịch sử: npm audit từng được báo exit 1 với 9 node (5 moderate, 2 high, 2 critical). Bundle này chưa có raw baseline JSON để độc lập xác nhận toàn bộ bảng; các installed version đã đối chiếu trực tiếp lock tại base. Không coi bảng tóm tắt này là raw audit hoặc audit vừa chạy. Kết quả audit mới có artifact độc lập ở mục 2.

### Bảng Chi Tiết 9 Node Tổn Thương Gốc

| STT | Package | Severity | Advisory / CVE / Range | Bản Chất Rủi Ro Trong Project | Fix Khả Dụng / Giải Pháp Tương Thích |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | `esbuild` (`0.21.5`) | `moderate` | GHSA-67mh-4wv8-2f99 (`<=0.24.2`) | Dev server CORS trong `esbuild serve`. Trong repo dùng qua Vite, không gọi `esbuild serve` trực tiếp. | Nâng `vite` lên `6.4.4` kéo `esbuild` `^0.25.0` (đạt `>=0.25.0`). |
| 2 | `vite` (`5.4.21`) | `high` | GHSA-4w7w-66w2-5vf9 (`<=6.4.1`, moderate); GHSA-v6wh-96g9-6wx3 (`<=6.4.2`, moderate); GHSA-fx2h-pf6j-xcff (`<=6.4.2`, high) | Bỏ qua `server.fs.deny` trên đường dẫn Windows alternate; lộ NTLMv2 hash qua UNC path; đọc `.map` tối ưu hóa. | Cập nhật `vite` lên `6.4.4` trong `packages/ui/package.json`. |
| 3 | `@sveltejs/vite-plugin-svelte` (`4.0.4`) | `moderate` | Kế thừa gián tiếp từ `vite` (`<=6.4.2`) | Xung đột peer dependency khi nâng `vite` lên 6.x (plugin 4.x yêu cầu `vite ^5`). | Nâng `@sveltejs/vite-plugin-svelte` lên `5.1.1` (hỗ trợ `vite ^6` và `svelte ^5`). |
| 4 | `@sveltejs/vite-plugin-svelte-inspector` (`3.0.1`) | `moderate` | Kế thừa gián tiếp từ `vite` (`<=6.4.2`) | Đi kèm `@sveltejs/vite-plugin-svelte`. | Tự động giải quyết khi nâng plugin lên `5.1.1`. |
| 5 | `vite-node` (`2.1.9`) | `moderate` | Kế thừa gián tiếp từ `vite` (`<=6.4.2`) | Dependency nội bộ của Vitest 2.x. | Nâng `vitest` lên `4.1.11`. |
| 6 | `@vitest/mocker` (`2.1.9`) | `moderate` | GHSA-82fw-gwwq-j7x9 (`>=2.1.0 <4.1.11`) + gián tiếp từ `vite` | Path traversal / đọc file tùy ý qua Redirect Mock. | Nâng `vitest` lên `4.1.11` kéo `@vitest/mocker` `4.1.11`. |
| 7 | `tinypool` (`1.1.1`) | `critical` | GHSA-5gmw-xhrv-c9v3 (`<=2.1.0`); GHSA-85c8-ppgw-ccpr (`<2.1.2`) | Prototype pollution dẫn đến RCE qua worker options / run() options trong runner đa luồng của Vitest 2.x. (Bản cài đặt gốc trong lock `1.1.1`, dải ảnh hưởng `<2.1.2`). | `vitest@4.1.11` loại bỏ hoàn toàn `tinypool`, thay thế bằng `tinyexec` và worker pool mới. |
| 8 | `vitest` (`2.1.9`) | `critical` | GHSA-5xrq-8626-4rwp (`<3.2.6`, critical); Kế thừa từ `tinypool`, `vite`, `vite-node`, `@vitest/mocker` | Đọc và thực thi file tùy ý khi Vitest UI server lắng nghe. CI và local chỉ dùng `vitest run`, tuy nhiên thư viện bị ảnh hưởng phiên bản. | Nâng `vitest` lên `4.1.11` trong root `package.json`. |
| 9 | `source-map-js` (`1.2.1`) | `high` | GHSA-68fv-2mgg-jv7q (`1.0.0 - 1.2.1`) | DoS event-loop qua indexed source-map section offsets. (Bản cài đặt gốc trong lock `1.2.1`, dải ảnh hưởng `1.0.0 - 1.2.1`). | Nâng cấp sạch lên `1.2.2` trong cây phụ thuộc tái tạo. |

---

## 2. Kế Hoạch & Kết Quả Nâng Cấp Tương Thích Thực Tế

1. **`packages/ui/package.json`**:
   - `vite`: `^5.4.11` $\rightarrow$ `6.4.4`
   - `@sveltejs/vite-plugin-svelte`: `^4.0.0` $\rightarrow$ `5.1.1`
2. **`package.json` (Root)**:
   - `vitest`: `^2.1.8` $\rightarrow$ `4.1.11`
   - `yaml`: bổ sung `^2.4.2` (giải quyết xung đột peer dependency giữa `vite` ^6 và `postcss-load-config` của `eslint-plugin-svelte`)
   - Bổ sung tooling Lint: `eslint` `^9.20.0`, `@typescript-eslint/parser` `^8.24.0`, `eslint-plugin-svelte` `^3.0.3`
3. **Cập nhật & Kiểm Chứng `package-lock.json`**:
   - Chạy `npm install` thông thường (không `--force`, không `--legacy-peer-deps`).
   - Kiểm chứng `npm audit --json`:

     ```json
     {
       "auditReportVersion": 2,
       "vulnerabilities": {},
       "metadata": {
         "vulnerabilities": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 },
         "dependencies": { "prod": 11, "dev": 275, "optional": 79, "peer": 0, "peerOptional": 0, "total": 285 }
       }
     }
     ```

      - Các JSON minh họa phía trên phải được đối chiếu với artifact thực đo, không dùng một JSON chép tay làm bằng chứng.
      - Bằng chứng độc lập mới: [audit-report.json](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/audit-report.json), [audit.json](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/audit.json), [tree.json](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/tree.json), [clean-ci.json](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/clean-ci.json), [manifest.json](C:/Users/Admin/Documents/Codex/2026-10-16/task-2/correction-tester-evidence/manifest.json). Snapshot dc9f2a89c0d03ce94b7b5e0d8a6ba00e7b53ecc08b1586cfeaf7d808bd09e3c8; HEAD 0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675; Node 24.19.0/npm 11.17.0; từng lệnh exit 0, audit total 0, npm tree không problems.
      - Đường dẫn trên là bằng chứng local Admin-PC; chưa phải artifact public hoặc CI mới. Baseline version/advisory table dùng để đối chiếu lịch sử; nếu không giữ raw baseline audit thì không khẳng định bảng là bản sao đầy đủ JSON baseline. Không chạy audit hôm nay rồi gán ngược thời điểm.
