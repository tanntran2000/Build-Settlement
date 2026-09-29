# Bảng Theo Dõi Tiến Độ Kỹ Thuật Nội Bộ (INTERNAL_PROGRESS_TRACKER.md)

> **Mục đích**: Tài liệu nội bộ bí mật dành cho Bạn và các AI Agent để theo dõi chính xác từng file mã nguồn, trạng thái các module trong `packages/*`, độ bao phủ kiểm thử, các nợ kỹ thuật và backlog cần triển khai tiếp theo.

---

## 1. Ma Trận Trạng Thái Module Mã Nguồn (Codebase Matrix)

| Package | Đường dẫn File | Chức Năng Cốt Lõi | Trạng Thái | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- | :---: | :--- |
| **core** | `src/domain/character.ts` | 3 trục thân phận, Chỉ số cơ bản, Nhu cầu, Cảm xúc | **Hoàn thành** | Cần mở rộng thêm `Anatomy` và `Conditioning` ở Phase 2 |
| **core** | `src/domain/relationship.ts`| Ma trận quan hệ 8 chiều | **Hoàn thành** | Đủ 8 chỉ số: trust, respect, affection, fear, debt, lust, obedience, resentment |
| **core** | `src/domain/memory.ts` | Hệ thống Ký ức động có tỷ lệ phai mờ (decay) | **Hoàn thành** | Hỗ trợ lưu trữ sự kiện chấn thương, ân sủng, phản bội |
| **core** | `src/domain/settlement.ts` | Vòng đời lãnh địa & Bàn giao (Handoff) | **Hoàn thành** | 4 quỹ đạo: loyal, free, rival, hostile |
| **core** | `src/domain/population.ts` | Quần thể dân cư theo nhóm Cohort | **Hoàn thành** | Theo dõi Morale, Productivity, Resentment |
| **core** | `src/domain/resource.ts` | Định nghĩa kho tài nguyên lãnh địa | **Hoàn thành** | Thực phẩm, Nước sạch, Vật liệu, Ngân khố |
| **core** | `src/time/clock.ts` | Đồng hồ thời gian mô phỏng theo ngày | **Hoàn thành** | Quản lý tick ngày, tháng, năm |
| **core** | `src/command/command.ts` | Kiến trúc Command - Handlers | **Hoàn thành** | Tiếp nhận lệnh người chơi không phụ thuộc UI |
| **core** | `src/command/effect.ts` | Hệ thống Effect & Audit Log ("WHY") | **Hoàn thành** | Ghi lại nguyên nhân biến động chỉ số |
| **core** | `src/domain/anatomy.ts` | Mô hình thể chất, số đo, trinh tiết 18+ | *Đang chờ* | **Ưu tiên số 1 của Phase 2** |
| **core** | `src/domain/gestation.ts` | Mô hình thai sản, di truyền gen (Pregmod) | *Đang chờ* | Dự kiến Phase 3 |
| **core** | `src/domain/conditioning.ts`| Tâm lý thuần hóa, Kinks, Trauma (FC) | *Đang chờ* | Dự kiến Phase 4 |
| **simulation**| `src/economy.ts` | Tính toán sản xuất, tiêu thụ hàng ngày | **Hoàn thành** | Tự động cân đối kho lương thực và nước |
| **simulation**| `src/gestation.ts` | Bộ đếm thai kỳ theo ngày, sinh nở | *Đang chờ* | Dự kiến Phase 3 |
| **content** | `src/buildings.json` | Bản vẽ công trình sơ khởi | **Hoàn thành** | Nhà ở, Giếng nước, Nông trại sơ cấp |
| **content** | `src/buildings_adult.json` | Công trình 18+ (Nhà thổ, Dinh thự, Trại giam) | *Đang chờ* | Dự kiến Phase 5 |
| **persistence**| `src/schema.ts` | Lược đồ lưu trữ Save Game có phiên bản | **Hoàn thành** | Đảm bảo tương thích ngược khi nâng cấp schema |
| **ui** | `src/App.svelte` | Dashboard giao diện Svelte 5 | **Hoàn thành** | Hiển thị Kho tài nguyên, Hồ sơ NPC Lan, Audit Log |
| **ui** | `src/components/Map.svelte`| Khung bản đồ Pixel Art (Canvas/Grid) | *Đang chờ* | Dự kiến Phase 6 |
| **ui** | `src/components/Portrait.svelte`| Khung hiển thị chân dung AI (Layered Avatar)| *Đang chờ* | Dự kiến Phase 6 |

---

## 2. Nhật Ký Quyết Định Kiến Trúc (Architecture Decision Records - ADR)

* **ADR-001: Sử dụng TypeScript Strict & Monorepo**:
  * *Bối cảnh*: Cần duy trì dự án lâu dài trong nhiều năm, tránh tình trạng "vỡ code" như mã nguồn Twine cũ của Free Cities.
  * *Quyết định*: Sử dụng npm workspaces chia nhỏ thành 5 packages độc lập. TypeScript Strict mode 100%.
* **ADR-002: Tách biệt Hoàn toàn Simulation Core (Headless Architecture)**:
  * *Bối cảnh*: Hỗ trợ song song cả bản Web và bản Desktop mà không phải code lại logic.
  * *Quyết định*: `packages/core` và `packages/simulation` không chứa mã HTML/CSS/DOM.
* **ADR-003: Phân Phối Kép Web + Desktop (Tauri)**:
  * *Bối cảnh*: Người chơi cần bản chơi trực tiếp trên web và bản tải về máy offline giống Free Cities.
  * *Quyết định*: Sử dụng Vite build ra web tĩnh (chơi trên itch.io/github pages), kết hợp với Tauri đóng gói ra file `.exe` độc lập siêu nhẹ cho PC.

---

## 3. Trạng Thái Kiểm Thử & Biên Dịch (Test & Build Status)

* **Unit Tests (Vitest)**:
  * Suite: `packages/core/src/domain/__tests__/domain.test.ts`
  * Số lượng test: 3 tests (Invariants 3 trục thân phận, Tính toán quan hệ 8 chiều, Bàn giao thuộc địa).
  * Trạng thái: **100% Passed**.
* **Production Build**:
  * Lệnh: `npm run build`
  * Thời gian biên dịch UI: ~2.5s.
  * Kích thước gói nén UI: ~18.16 kB (gzip).

---

## 4. Nợ Kỹ Thuật (Technical Debt) & Cảnh Báo An Toàn

1. **Exports giữa các packages**:
   - Đã xử lý `exports: { ".": "./src/index.ts" }` trong `package.json` của từng sub-package để Vite và Rollup liên kết trực tiếp mã TypeScript mà không cần build trung gian qua `dist/`.
2. **Quản lý Dung Lượng Ảnh**:
   - Khi đưa hệ thống ảnh AI Generated vào game ở Phase 6, cần sử dụng định dạng nén WebP và cơ chế lazy-loading để bản Web không vượt quá 50MB.

---

## 5. Danh Sách Việc Cần Làm Tiếp Theo (Next Backlog - Phase 2)

1. [ ] **Khởi tạo `packages/core/src/domain/anatomy.ts`**:
   - Định nghĩa `BodyMeasurements` (Chiều cao, ngực, eo, mông, cúp ngực).
   - Định nghĩa `VirginityStatus` (oral, vaginal, anal) và lịch sử quan hệ.
   - Định nghĩa `PhysicalModifications` (Hình xăm, xỏ khuyên, vòng cổ, vết tích).
2. [ ] **Tích hợp `Anatomy` vào `Character`**:
   - Cập nhật interface `Character` trong `character.ts` để sở hữu thuộc tính `anatomy: Anatomy`.
3. [ ] **Viết Unit Test cho Anatomy**:
   - Kiểm tra tính toán điểm quyến rũ tự nhiên và hiệu ứng biến đổi thể chất.
