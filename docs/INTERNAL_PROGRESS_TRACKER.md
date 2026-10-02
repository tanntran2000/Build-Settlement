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
| **core** | `src/social/calculator.ts` | Tính toán năng lực xã hội vĩ mô (POP-01A) | **L3 (Đã kiểm thử)** | Pure snapshot calculator: tính headcount, populationBlocks, laborCapacityMilli, purchaseDemandCapacityMilli, survivalFoodNeedMilli, lifestyleFoodDemandMilli; chưa cung cấp Military/Tax capacity hay Assigned WF. |
| **core** | `src/social/workforce.ts` | Mô hình nhân lực Foundation v2 | **L3 (Đã kiểm thử)** | Quy đổi 10 dân = 1 Base WF (1 WF = 1000 milli-WF), hệ số giai cấp (Servile 2.0x, Lower 1.5x, Middle 1.0x, High 0x); tính toán số học Effective WF từ City Effects; chưa bao gồm phân bổ công việc (job assignment). |
| **core** | `src/resource/allocation.ts` | Nguyên tắc phân bổ tài nguyên sàn 0 | **L3 (Đã kiểm thử)** | Các hàm nguyên thủy phân bổ tài nguyên vật lý (Demand -> Allocated -> Deficit), bảo toàn tài nguyên sàn 0 và bảo toàn số lượng, kiểm định RangeError. |
| **core** | `src/status/effects.ts` | Vòng đời hiệu ứng đô thị (City Effects) | **L3 (Đã kiểm thử)** | Kiểm định candidate (single non-object boundary `assertCandidate`), vòng đời timed City Effect 3 tuần dùng chung, thay thế bậc và chống làm mới chu kỳ (anti-refresh). Chưa chứa bộ giải mã Status -> City Effect. |
| **simulation**| `src/dispatcher.ts` | Command Dispatcher & Authority Gate | **L3 (Đã kiểm thử)** | Pipeline 4 bước (state -> command -> authority -> handler); phân biệt rõ lỗi `FORBIDDEN` (Legacy) và `COMMAND_NOT_YET_IMPLEMENTED` (Active); atomicity rollback. |
| **simulation**| `src/economy.ts` | Tính toán sản xuất & Tiêu thụ | **L3 (Đã kiểm thử)** | Đã sửa lỗi ngày báo cáo (truyền ngày hiện tại); thực thi cơ chế Nhu cầu -> Cấp phát -> Thiếu hụt (Sàn 0). |
| **content** | `src/buildings.json` | Danh mục bản vẽ công trình | **L2 (Đã triển khai)** | Có 3 bản vẽ mẫu. Sẽ kết nối vào Foundation II / future production integration. |
| **persistence**| `src/schema.ts` | Lược đồ lưu trữ Save Game | **L1 (Đã định nghĩa)** | Đã cấu trúc `WorldSaveData` đồng bộ 100% với `GameState`. **Chưa có logic đọc/ghi save.** |
| **ui** | `src/App.svelte` | Giao diện Dashboard Svelte 5 | **L4 (Đã tích hợp)** | Đã xóa bỏ toàn bộ state mutation trực tiếp. UI dispatch command tới simulation và render state mới; đã pass Playwright smoke test. |

---

## 3. Trạng Thái Kiểm Thử Thật Sự (Audit Verification)

* **Bộ Test Tự Động Toàn Dự Án Hiện Tại (`npm test` - Vitest)**:
  - **8 test files / 173 tests passed** (0 failed, exit code 0):
    * `packages/core/src/__tests__/architecture.test.ts` (3 tests): Bảo vệ ranh giới kiến trúc, không import chéo, không DOM.
    * `packages/core/src/domain/__tests__/domain.test.ts` (26 tests): Invariants, factory, validation biên, cô lập object graph.
    * `packages/core/src/social/__tests__/pop01a_resource_core.test.ts` (21 tests): POP-01A benchmark fixtures A/B, rounding, zero cliff.
    * `packages/core/src/social/__tests__/foundation_v2_social.test.ts` (8 tests): Quy đổi headcount -> base WF, hệ số giai cấp.
    * `packages/core/src/social/__tests__/effective_workforce.test.ts` (16 tests): Tác động của City Effects lên Effective Workforce.
    * `packages/core/src/resource/__tests__/allocation.test.ts` (24 tests): Các hàm nguyên thủy phân bổ tài nguyên vật lý sàn 0 và bảo toàn.
    * `packages/core/src/status/__tests__/effects.test.ts` (53 tests): Vòng đời City Effect, timed countdown, chống lạm dụng refresh, RangeError contract.
    * `packages/simulation/src/__tests__/dispatcher.test.ts` (22 tests): Pipeline điều phối lệnh, rollback atomicity, authority gate.
  *(Ghi chú lịch sử: 51 tests là số liệu nghiệm thu cũ của riêng gói R1 trước khi triển khai Foundation v2).*

* **Kiểm Tra Kiểu Toàn Diện (`npm run typecheck`)**:
  - `typecheck:core`, `typecheck:simulation`, `typecheck:persistence`, `typecheck:content` (TypeScript strict).
  - `typecheck:ui` (`svelte-check` trên toàn bộ component Svelte).
  *(0 errors, 0 warnings trên toàn bộ 5 packages).*

* **Kiểm Tra Build UI (`npm run build --workspace=@haven/ui`)**:
  - Vite production build hoàn thành thành công (exit code 0).

* **Bộ Test Giao Diện Trình Duyệt (`npm run test:smoke` - Playwright)**:
  - `tests/e2e/smoke.spec.ts` (1 test): Khởi động preview server port 4173; mở prototype; bấm nút "Tiến Sang Ngày Mới"; xác nhận Ngày 1 -> 2; xác nhận kho giảm; xác nhận audit log hiển thị `[Ngày 1]`; bấm liên tục đến cạn kiệt; xác nhận kho lương thực chạm sàn 0 nhưng tuyệt đối không âm; xác nhận ngày vẫn tiến khi thiếu hụt và log ghi nhận rõ lượng thiếu hụt.
  *(1 passed trên Chromium headless, exit code 0).*

* **Quy Trình CI (GitHub Actions)**:
  - `.github/workflows/ci.yml` chuẩn hóa job `quality-gate`: checkout -> setup Node 20 -> `npm ci` -> `npm run typecheck` -> `npm test` -> `npm run build` -> `playwright install chromium` -> `npm run test:smoke`.
  - **Bằng Chứng CI Gần Nhất (PR #7 HEAD)**: GitHub Quality Gate Run `36965142356` SUCCESS (HEAD `c7beed21a27896d12796d008bfd5248630410a22` trước khi merge vào `main` tại `a5b6baec17e5ab086af39d0f64dd45d795fba0db`).
  - *(Lưu ý chuẩn xác: Đây là bằng chứng CI đã xác thực cho HEAD của PR #7 được merge vào `main`; không ghi nhận CI run riêng biệt sau merge trên commit `a5b6baec17e5ab086af39d0f64dd45d795fba0db`).*

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
5. **Bộ 4 Finding Review R1-F01 → R1-F04**:
   - *R1-F01 (Miền số & Cấu trúc)*: Khắc phục triệt để lỗ hổng cohort âm tạo lương thực; kiểm tra tính nhất quán toán học của clock; kiểm tra container trước khi đọc; bắt buộc đủ 9 tài nguyên kho, đủ 6 needs, 8 emotions, 5 skills, 8 trục quan hệ, chặn object rỗng `{}`.
   - *R1-F02 (Object Isolation)*: Deep clone toàn bộ mảng `memories.tags` và các nhân vật/cohort lồng nhau trong factory.
   - *R1-F03 (Command Syntax Gate)*: `validateCommandSyntax` kiểm tra loại lệnh và trường bắt buộc trước khi thẩm định quyền hạn.
   - *R1-F04 (Transactional Error & Atomicity)*: Bọc try/catch chuẩn hóa runtime exception thành `EXECUTION_ERROR`, hậu kiểm draft vi phạm trả `INVARIANT_VIOLATION`, đảm bảo tính nguyên tử all-or-nothing.

---

## 5. Lộ Trình Tái Cơ Cấu Thực Tế (Hạ Tầng Nền Tảng Cho Vertical Slice)

* [x] **R0: Đối chiếu tiến độ + Sửa CI**:
  - Dọn sạch unused imports (`settlement.ts`, `command.ts`).
  - Thay thế CI bằng Node/npm workflow chuẩn.
  - Cập nhật Tracker trung thực với 4 cấp độ L1-L4.
* [x] **R1: Lõi Thực Thi & Luật Bất Biến (Execution Core & Invariants)**:
  - *(Đã hoàn thành trọn vẹn G0 -> G6; merge commit `375b60e` trên `main`; post-merge CI `36527428842` đạt 100%)*.
  - Đồng hồ thời gian duy nhất trong `GameState`.
  - Khởi tạo Command Dispatcher trung tâm (`executeCommand`).
  - Validation Invariants (chặn số âm, kiểm tra container, kiểm tra đủ khóa bắt buộc, cô lập object graph).
  - Tách biệt kiểm tra kiến trúc và browser smoke test.

---

### FOUNDATION I — POPULATION (Trọng Tâm Kỹ Thuật Hiện Tại)

> **Quy tắc phân tách ranh giới**:
> - **Named NPC $\rightarrow$ `NPC-01 Future`**: Decouple hoàn toàn khỏi Population Core. Không mô phỏng tâm lý, quan hệ cá nhân hay kỹ năng Named NPC trong Population Core.
> - **Resource Core $\rightarrow$ Foundation II**: Chỉ triển khai sau khi Population Core cung cấp đủ input Demand và Capacity ổn định.

* [x] **POP-01A: Class Resource Core**: **L3 (ĐÃ KIỂM THỬ)** *(Merged PR #4 tại commit `b5c72e9`)*:
  - Khóa hằng số `SOCIAL_RESOURCE_SCALE = 1000` (integer milli-units, `Math.floor`).
  - 10-way resolver `resolveEconomicProfile` từ canonical `SocialClass` & `LegalStatus`.
  - Pure snapshot calculator `calculateSocialResources` (headcount, populationBlocks, laborCapacityMilli, purchaseDemandCapacityMilli, survivalFoodNeedMilli, lifestyleFoodDemandMilli; chưa bao gồm Military/Tax capacity hay Assigned WF).
  - 2 Benchmark Fixtures A/B nghiệm thu tuyệt đối + Edge cases 1/99/101 chống block cliff. Chưa tích hợp UI/lưu trữ (chưa đạt L4).
* [ ] **POP-01B: Needs & Effective Capacity**: **DESIGN ONLY**
  - Cơ chế Satisfaction, Tác động thiếu hụt & Mức ủng hộ (Support) sang nhịp $T \rightarrow T+1$.
* [ ] **POP-01C: Labor Allocation**: **DESIGN ONLY**
  - Phân bổ năng lực lao động (Effective $\rightarrow$ Allocated Labor), không phân bổ từng đầu người.
* [ ] **POP-02: Population Dynamics**: **DESIGN ONLY**
  - Di cư, xuất cư, dịch chuyển giai cấp, ngưỡng sức chứa bền vững, dòng người nộp đơn nhập cư (Immigration, Emigration, Class Mobility, Sustainable Capacity, Outside Applicants, Headcount flows - chưa bao gồm Sinh/Tử, Tháp tuổi hay mô phỏng thế hệ).
* [ ] **POP-03: Law & Social Conflict**: **DESIGN ONLY**
  - Chính sách giai cấp, xung đột quyền lợi, biến động trật tự xã hội.

---

### FOUNDATION V2 — QUẢN TRỊ & HỢP NHẤT NỀN TẢNG (GOVERNANCE STATUS)
* **PR #5 (Canonical Foundation v2)**: Đã merge vào `main` tại commit `699f32c` (Workforce v2, Resource primitives sàn 0, City Effect lifecycle 3 tuần dùng chung, Effective Workforce arithmetic).
* **PR #7 (City Effect Contract Correction)**: Đã merge vào `main` tại commit `a5b6bae` (HEAD PR #7: `c7beed2`, CI Quality Gate run `36965142356` SUCCESS). Chốt chặn RangeError cho input không phải object tại duy nhất một ranh giới `assertCandidate`.
* **PR #6 (Independent Comparison)**: Nhánh `feat/foundation-v2-antigravity-01` đã đóng (superseded/closed), không phải bản canonical.

---

### FOUNDATION II — RESOURCE CORE & SURVIVAL LOOP
* **Hiện trạng**: Foundation v2 đã thiết lập các hàm nguyên thủy phân bổ/dòng chảy sàn 0 (`packages/core/src/resource/allocation.ts`), nhưng việc tích hợp toàn diện Resource Core (RES-01..04) vẫn đang mở.
* [ ] **RES-01: Resource Model, Stock & Invariants**:
  - Mô hình kho và biến thiên vật lý, bảo toàn sàn 0, tách biệt Physical Resources vs Social Capacities.
* [ ] **RES-02: Demand $\rightarrow$ Allocation $\rightarrow$ Deficit / Surplus**:
  - Động cơ cấp phát lương thực và nhu yếu phẩm từ đầu vào của Population Core.
* [ ] **RES-03: Production, Conversion & Inflow-Outflow**:
  - Chuyển hóa nguyên liệu thô, sản lượng, hao hụt tự nhiên.
* [ ] **RES-04: Building & Physical Activity Integration**:
  - Xây dựng công trình (`BUILD_FACILITY`), bố trí địa điểm, tích hợp hạ tầng vật lý sau khi Resource Core đã đứng vững độc lập.

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

