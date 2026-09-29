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
| **core** | `src/domain/relationship.ts`| Ma trận quan hệ 8 chiều | **L2 (Đã triển khai)** | Đã có interface và default factory. Tính toán biến thiên quan hệ chuyên sâu chờ R4/R5. |
| **core** | `src/domain/memory.ts` | Hệ thống Ký ức động | **L1 (Đã định nghĩa)** | Mới chỉ có Interface `Memory`. Chưa có hàm decay hay scheduler. |
| **core** | `src/domain/settlement.ts` | Vòng đời lãnh địa & Handoff | **L3 (Đã kiểm thử)** | Đã có factory `createSettlement` chặn kho âm ban đầu, cô lập object; logic chuyển giao Handoff chờ R4. |
| **core** | `src/domain/population.ts` | Quần thể dân cư Cohort | **L3 (Đã kiểm thử)** | Đã bổ sung trường bắt buộc `socialClass: SocialClass` và factory `createPopulationCohort` có kiểm định biên. |
| **core** | `src/domain/resource.ts` | Kho tài nguyên lãnh địa | **L3 (Đã kiểm thử)** | Đã kiểm thử default inventory. Logic sàn 0 và Cấp phát - Thiếu hụt đã được bảo vệ tại simulation. |
| **core** | `src/domain/gamestate.ts` | Chân lý dữ liệu toàn thể & Invariant | **L3 (Đã kiểm thử)** | Đã có `validateGameState` kiểm tra Invariant 0/1 Active hai chiều, Key-ID matching, và kho tài nguyên không âm. |
| **core** | `src/time/clock.ts` | Đồng hồ thời gian mô phỏng | **L3 (Đã kiểm thử)** | Đã kiểm thử tiến ngày, tuần, năm deterministic. Tích hợp làm clock duy nhất trong `GameState`. |
| **core** | `src/command/command.ts` | Hệ thống Lệnh (Commands) | **L3 (Đã kiểm thử)** | Đã có `Command`, `CommandResult`, `AdvanceDayResultData`, `AuditEntry`. Dispatcher điều phối tại simulation. |
| **core** | `src/command/effect.ts` | Hệ thống Effect & Audit Log | **L3 (Đã kiểm thử)** | Bổ sung `CLOCK_ADVANCE` và trường `allocated`/`deficit` vào `RESOURCE_DELTA`. |
| **simulation**| `src/dispatcher.ts` | Command Dispatcher & Authority Gate | **L3 (Đã kiểm thử)** | Pipeline 4 bước (state -> command -> authority -> handler); phân biệt rõ lỗi `FORBIDDEN` (Legacy) và `COMMAND_NOT_YET_IMPLEMENTED` (Active); atomicity rollback. |
| **simulation**| `src/economy.ts` | Tính toán sản xuất & Tiêu thụ | **L3 (Đã kiểm thử)** | Đã sửa lỗi ngày báo cáo (truyền ngày hiện tại); thực thi cơ chế Nhu cầu -> Cấp phát -> Thiếu hụt (Sàn 0). |
| **content** | `src/buildings.json` | Danh mục bản vẽ công trình | **L2 (Đã triển khai)** | Có 3 bản vẽ mẫu. Nối vào vòng xây dựng và sản xuất ở R2. |
| **persistence**| `src/schema.ts` | Lược đồ lưu trữ Save Game | **L1 (Đã định nghĩa)** | Đã cấu trúc `WorldSaveData` đồng bộ 100% với `GameState`. **Chưa có logic đọc/ghi save.** |
| **ui** | `src/App.svelte` | Giao diện Dashboard Svelte 5 | **L4 (Đã tích hợp)** | Đã xóa bỏ toàn bộ state mutation trực tiếp. UI dispatch command tới simulation và render state mới; đã pass Playwright smoke test. |

---

## 3. Trạng Thái Kiểm Thử Thật Sự (Audit Verification)

* **Bộ Test Tự Động (`npm test` - Vitest)**:
  - `packages/core/src/__tests__/architecture.test.ts` (3 tests): Xác minh `core` không import `simulation`, không chứa DOM; `simulation` không chứa UI/DOM; phát hiện thành công fixture vi phạm mẫu.
  - `packages/core/src/domain/__tests__/domain.test.ts` (17 tests): Kiểm định toàn diện factory, validation biên, cô lập object, invariant 0/1 active hai chiều, key-ID matching, và bước nhảy đồng hồ qua năm.
  - `packages/simulation/src/__tests__/dispatcher.test.ts` (9 tests): Kiểm định phân biệt mã lỗi `INVALID_STATE`, `INVALID_COMMAND`, `FORBIDDEN` (Legacy) vs `COMMAND_NOT_YET_IMPLEMENTED` (Active); kiểm định lệnh `ADVANCE_DAY` tiến ngày, báo cáo ngày $T$, kinh tế sàn 0, thiếu hụt không chặn tiến ngày, world 0 active, bảo vệ legacy nguyên vẹn, và tính nguyên tử (immutability).
  *(Tổng cộng: 29 tests passed, 0 failed).*

* **Bộ Test Giao Diện Trình Duyệt (`npm run test:smoke` - Playwright)**:
  - `tests/e2e/smoke.spec.ts` (1 test): Khởi động preview server port 4173; mở prototype; bấm nút "Tiến Sang Ngày Mới"; xác nhận Ngày 1 -> 2; xác nhận kho giảm; xác nhận audit log hiển thị `[Ngày 1]`; bấm liên tục đến cạn kiệt; xác nhận kho lương thực chạm sàn 0 nhưng tuyệt đối không âm; xác nhận ngày vẫn tiến khi thiếu hụt và log ghi nhận rõ lượng thiếu hụt.
  *(1 passed trên Chromium headless).*

* **Kiểm Tra Kiểu Toàn Diện (`npm run typecheck`)**:
  - `typecheck:core`, `typecheck:simulation`, `typecheck:persistence`, `typecheck:content` (TypeScript strict).
  - `typecheck:ui` (`svelte-check` trên toàn bộ component Svelte).
  *(0 errors, 0 warnings).*

* **Quy Trình CI (GitHub Actions)**:
  - `.github/workflows/ci.yml` chuẩn hóa job `quality-gate`: checkout -> setup Node 20 -> `npm ci` -> `npm run typecheck` -> `npm test` -> `npm run build` -> `playwright install chromium` -> `npm run test:smoke`. Concurrency hủy run cũ khi có commit mới.

---

## 4. Các Lỗi Đã Tái Hiện & Nợ Kỹ Thuật Đã Xử Lý Trong R1

1. **Lỗi Kho Âm (Negative Inventory)**:
   - *Đã giải quyết*: Tách 3 đại lượng: **Nhu cầu (Demand) - Cấp phát thực tế (Allocated) - Lượng thiếu hụt (Deficit)**. Kho chạm sàn 0 tuyệt đối không âm; lượng thiếu hụt được ghi nhận vào Audit Trail (WHY) và không làm gián đoạn tiến ngày.
2. **Lỗi Ngày Báo Cáo Kinh Tế**:
   - *Đã giải quyết*: Báo cáo ngày $T$ nhận đúng ngày mô phỏng $T$, clock tiến sang $T + 1$.
3. **Kiến Trúc Lệnh Bị Đứt Gãy (Command -> Effect)**:
   - *Đã giải quyết*: Đã xây dựng `executeCommand` trong `simulation`; UI xóa bỏ 100% các phép tính cộng/trừ tài nguyên và biến `day` cục bộ; UI dispatch command và render kết quả.
4. **Invariant 0 hoặc 1 Lãnh Địa Trực Trị (LAW-05)**:
   - *Đã giải quyết*: Cưỡng chế hai chiều: 0 active $\iff$ pointer null; 1 active $\iff$ pointer trỏ đúng ID; cấm lệnh quản trị trực tiếp tới Legacy (`FORBIDDEN`).

---

## 5. Lộ Trình Tái Cơ Cấu Thực Tế (Phân Kỳ R0 - R5 Cho Vertical Slice)

* [x] **R0: Đối chiếu tiến độ + Sửa CI**:
  - Dọn sạch unused imports (`settlement.ts`, `command.ts`).
  - Thay thế CI bằng Node/npm workflow chuẩn.
  - Cập nhật Tracker trung thực với 4 cấp độ L1-L4.
* [x] **R1: Lõi Thực Thi & Luật Bất Biến (Execution Core & Invariants)**:
  - *(Đã hoàn thành và kiểm thử toàn diện trên nhánh `feat/r1-execution-core`; Save/Load chưa triển khai; chờ Human merge và hậu kiểm G6)*.
  - Đồng hồ thời gian duy nhất trong `GameState`.
  - Khởi tạo Command Dispatcher trung tâm (`executeCommand`).
  - Validation Invariants (chặn số âm, chặn dữ liệu rác, bọc deep copy cho factory).
  - Tách biệt kiểm tra kiến trúc và browser smoke test.
* [ ] **R2: Vòng Sinh Tồn - Xây Dựng (Survival & Building Loop)**:
  - Hiện thực hóa lệnh Xây dựng (`BUILD_FACILITY`) cho 3 bản vẽ hiện có.
  - Phân công công nhân $\rightarrow$ Sinh sản lượng $\rightarrow$ Cân đối tiêu thụ.
  - Tác động của thiếu hụt tài nguyên (Deficit) lên Sĩ khí và Sức khỏe cư dân.
* [ ] **R3: Lưu Trữ & Vòng Đời Ván Chơi (Persistence & Session Lifecycle)**:
  - Logic đọc/ghi Save game thực tế (`serialize` / `deserialize`).
  - Xuất/nhập file save (`.json`), xử lý save lỗi trên file tạm.
  - Cơ chế New Game, Continue, và nền móng New Game+.
* [ ] **R4: Cơ Chế Bàn Giao Thật (Atomic Handoff)**:
  - Giao dịch bàn giao nguyên tử: Bổ nhiệm Governor, chuyển giao tài sản, tước quyền điều khiển trực tiếp của Player.
  - Lãnh địa cũ trở thành Legacy Settlement tự cập nhật trong nền.
* [ ] **R5: Hệ Thống Sự Kiện & Tính Chơi Lại (Event Loop & Replayability)**:
  - Event scheduler có điều kiện kích hoạt, cooldown, lịch sử lựa chọn.
  - Giới hạn độ dài nhật ký log để chống phình bộ nhớ.
