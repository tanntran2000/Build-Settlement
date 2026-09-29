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
| **core** | `src/domain/character.ts` | 3 trục thân phận, Nhu cầu, Cảm xúc | **L3 (Đã kiểm thử)** | Đã có factory `createNamedCharacter`. Cần bổ sung Invariant (chặn tuổi âm, clamp 0-100, chống chia sẻ tham chiếu object). |
| **core** | `src/domain/relationship.ts`| Ma trận quan hệ 8 chiều | **L2 (Đã triển khai)** | Đã có interface và default factory. **Chưa có Unit Test tính toán thay đổi quan hệ.** |
| **core** | `src/domain/memory.ts` | Hệ thống Ký ức động | **L1 (Đã định nghĩa)** | Mới chỉ có Interface `Memory`. Chưa có hàm decay, scheduler hay hàm truy vấn ký ức. |
| **core** | `src/domain/settlement.ts` | Vòng đời lãnh địa & Handoff | **L1 (Đã định nghĩa)** | Mới chỉ có kiểu `SettlementStatus` và `Facility`. Chưa có logic chuyển giao nguyên tử. |
| **core** | `src/domain/population.ts` | Quần thể dân cư Cohort | **L1 (Đã định nghĩa)** | Mới chỉ có Interface. **Còn thiếu trường `socialClass`**; chưa có hàm tăng/giảm dân số. |
| **core** | `src/domain/resource.ts` | Kho tài nguyên lãnh địa | **L3 (Đã kiểm thử)** | Đã kiểm thử default inventory. Cần logic sàn (không âm) và phân biệt Nhu cầu - Cấp phát - Thiếu hụt. |
| **core** | `src/time/clock.ts` | Đồng hồ thời gian mô phỏng | **L3 (Đã kiểm thử)** | Đã kiểm thử tiến 7 ngày. Cần đồng bộ làm đồng hồ duy nhất cho toàn bộ GameState. |
| **core** | `src/command/command.ts` | Hệ thống Lệnh (Commands) | **L1 (Đã định nghĩa)** | Mới là Union type. **Chưa có Dispatcher, chưa có Command Handler trung tâm.** |
| **core** | `src/command/effect.ts` | Hệ thống Effect & Audit Log | **L1 (Đã định nghĩa)** | Mới là Union type. Chưa có Effect Applier ngoài UI. |
| **simulation**| `src/economy.ts` | Tính toán sản xuất & Tiêu thụ | **L2 (Đã triển khai)** | Đã tính được tiêu thụ; nhưng production luôn rỗng. **Lỗi: trả `dayCreated` thay vì ngày hiện tại.** |
| **content** | `src/buildings.json` | Danh mục bản vẽ công trình | **L2 (Đã triển khai)** | Có 3 bản vẽ mẫu. Chưa nối vào vòng xây dựng và tính sản lượng. |
| **persistence**| `src/schema.ts` | Lược đồ lưu trữ Save Game | **L1 (Đã định nghĩa)** | Mới chỉ có 2 interface `WorldSaveData`, `PlayerProfileData`. **Chưa có logic đọc/ghi save.** |
| **ui** | `src/App.svelte` | Giao diện Dashboard Svelte 5 | **L2 (Đã triển khai)** | Hiển thị prototype. **Đang tự sửa inventory trực tiếp, tự unshift log, chưa có reactivity an toàn.** |

---

## 3. Trạng Thái Kiểm Thử Thật Sự (Audit Verification)

* **Bộ Test Hiện Tại (`packages/core/src/domain/__tests__/domain.test.ts`)**:
  1. `creates a valid NamedCharacter with 3 axes and 8D relationship`: Kiểm tra tạo NPC Lan với các giá trị mặc định.
  2. `handles resource inventory defaults`: Kiểm tra kho mặc định (food: 100, currency: 500).
  3. `advances simulation time properly`: Kiểm tra hàm `advanceTime` tiến 7 ngày.
  *(Tổng cộng: 3 tests. Chưa có test Handoff, chưa có test bất biến tài nguyên, chưa có test quan hệ 8D).*

* **Quy Trình CI (GitHub Actions)**:
  * Đã loại bỏ workflow Deno không tương thích (`.github/workflows/deno.yml`).
  * Đã thiết lập `.github/workflows/ci.yml` chuẩn Node 20 + `npm ci` + typecheck + `npm test` (Vitest) + `npm run build` (Vite).

---

## 4. Các Lỗi Đã Tái Hiện & Nợ Kỹ Thuật Cần Sửa Ngay

1. **Lỗi Kho Âm (Negative Inventory)**:
   - Dân số tiêu thụ 23 lương thực/nước mỗi ngày. Sau ngày thứ 5 kho giảm còn -15.
   - *Khắc phục*: Tách 3 đại lượng: **Nhu cầu (Demand) - Cấp phát thực tế (Allocated) - Lượng thiếu hụt (Deficit)**. Kho không bao giờ âm; lượng thiếu hụt sinh ra Effect trừ Sĩ khí / Sức khỏe.
2. **Lỗi Ngày Báo Cáo Kinh Tế**:
   - `simulateDailyEconomy` trả về `settlement.dayCreated` cố định thay vì ngày đang mô phỏng.
   - *Khắc phục*: Truyền ngữ cảnh lượt mô phỏng hiện tại vào hàm kinh tế.
3. **Kiến Trúc Lệnh Bị Đứt Gãy (Command -> Effect)**:
   - UI đang trực tiếp sửa `currentSettlement.inventory` và tự ghi log.
   - *Khắc phục*: Xây dựng Command Dispatcher trong `core/simulation`.
4. **Vòng Xây Dựng - Sản Xuất Chưa Hoạt Động**:
   - Công trình trong `buildings.json` chưa xây được, không có phân công lao động, không tạo ra sản lượng.
5. **Schema Quan Hệ 8D Bị Lệch Giữa Code và Tài Liệu**:
   - Code: `trust, affection, attraction, respect, fear, resentment, dependency, familiarity`.
   - Docs cũ ghi: `debt, lust, obedience`. Cần chuẩn hóa đồng nhất theo code.

---

## 5. Lộ Trình Tái Cơ Cấu Thực Tế (Phân Kỳ R0 - R5 Cho Vertical Slice)

Thay vì vội vã chuyển sang nội dung 18+ hay đồ họa nâng cao, dự án tập trung hoàn thiện vòng chơi sinh tồn - quản lý cốt lõi:

* [x] **R0: Đối chiếu tiến độ + Sửa CI**:
  - Dọn sạch unused imports (`settlement.ts`, `command.ts`).
  - Thay thế CI bằng Node/npm workflow chuẩn.
  - Cập nhật Tracker trung thực với 4 cấp độ L1-L4.
* [ ] **R1: Lõi Thực Thi & Luật Bất Biến (Execution Core & Invariants)**:
  - Đồng hồ thời gian duy nhất trong `GameState`.
  - Khởi tạo Command Dispatcher trung tâm (`executeCommand`).
  - Validation Invariants (chặn số âm, chặn dữ liệu rác, bọc deep copy cho factory).
* [ ] **R2: Vòng Sinh Tồn - Xây Dựng (Survival & Building Loop)**:
  - Sửa triệt để lỗi kho âm: Logic Cấp phát & Thiếu hụt tài nguyên.
  - Sửa lỗi ngày báo cáo.
  - Hiện thực hóa lệnh Xây dựng (`BUILD_FACILITY`) cho 3 bản vẽ hiện có.
  - Phân công công nhân $\rightarrow$ Sinh sản lượng $\rightarrow$ Cân đối tiêu thụ.
* [ ] **R3: Lưu Trữ & Vòng Đời Ván Chơi (Persistence & Session Lifecycle)**:
  - Logic đọc/ghi Save game thực tế (`serialize` / `deserialize`).
  - Xuất/nhập file save (`.json`), xử lý save lỗi trên file tạm.
  - Cơ chế New Game, Continue, và nền móng New Game+.
* [ ] **R4: Cơ Chế Bàn Giao Thật (Atomic Handoff)**:
  - Giao dịch bàn giao nguyên tử: Bổ nhiệm Governor, chuyển giao tài sản, tước quyền điều khiển trực tiếp của Player.
  - Player có thể có 0 hoặc 1 Active Settlement.
  - Lãnh địa cũ trở thành Legacy Settlement tự cập nhật trong nền.
* [ ] **R5: Hệ Thống Sự Kiện & Tính Chơi Lại (Event Loop & Replayability)**:
  - Event scheduler có điều kiện kích hoạt, cooldown, lịch sử lựa chọn.
  - Giới hạn độ dài nhật ký log để chống phình bộ nhớ.
