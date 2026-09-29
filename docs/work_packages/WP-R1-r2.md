# Kế Hoạch Gói Việc: WP-R1-r2 (Lõi Thực Thi & Luật Bất Biến)

> **Mã công việc**: `WP-R1-r2`  
> **Commit nền (Baseline)**: `5c764fc1e99cc3a3e3230d42ac277096ec3da4dd` (nhánh `main`)  
> **Nhánh thực hiện**: `feat/r1-execution-core`  
> **Trạng thái**: Đã phê duyệt tại G1 (Approved by Human) - Đang triển khai tại G2  

---

## 1. Mục Tiêu & Ranh Giới Phạm Vi

### 1.1. Mục Tiêu Cốt Lõi
1. Thiết lập **`GameState`** hợp nhất làm chân lý duy nhất (Single Source of Truth) chứa Clock, World Seed, Danh sách Lãnh địa, và tham chiếu Lãnh địa Trực trị (`0` hoặc `1`).
2. Thiết lập đường thực thi tập trung qua **Command Dispatcher** trong `packages/simulation` theo chiều phụ thuộc đơn hướng:  
   $$\text{UI} \longrightarrow \text{packages/simulation} \longrightarrow \text{packages/core}$$
   *(Triệt tiêu hoàn toàn nguy cơ phụ thuộc vòng `core ↔ simulation`)*.
3. Hỗ trợ đầy đủ lệnh đầu tiên: **`ADVANCE_DAY`**:
   - Tiến nhịp đồng hồ `Clock` chuẩn xác: $T \rightarrow T + 1$.
   - Sửa lỗi kinh tế: đọc state đầu ngày $T$, sinh báo cáo cho ngày $T$, công bố state mới là ngày $T + 1$.
   - Thực thi cơ chế bảo toàn tài nguyên: **Nhu cầu $\rightarrow$ Cấp phát $\rightarrow$ Thiếu hụt (Sàn 0)**. Kho không bao giờ âm; thiếu hụt được ghi rõ vào Audit Trail (WHY), không làm dừng tiến ngày.
4. Tái cấu trúc `App.svelte`: Loại bỏ 100% các phép tính cộng/trừ tài nguyên và biến `day` cục bộ; UI chỉ dispatch Command và hiển thị State/Audit Trail do Dispatcher trả về; **UI tuyệt đối không áp dụng Effect lần thứ hai**.
5. Bổ sung `svelte-check` cho `packages/ui` và Playwright Chromium smoke test, gộp vào quy trình CI `quality-gate`.

---

### 1.2. Danh Sách File Được Phép Thay Đổi (In-Scope)

| Package / Vị trí | Đường dẫn File | Mục đích thay đổi |
| :--- | :--- | :--- |
| **`packages/core`** | `src/domain/gamestate.ts` *(Tạo mới)* | Định nghĩa kiểu `GameState`, `WorldMetadata`, invariant 0/1 active settlement hai chiều |
| | `src/domain/character.ts` | Validate đầu vào (reject invalid data); Deep clone cô lập object |
| | `src/domain/population.ts` | Bổ sung bắt buộc `socialClass: SocialClass` vào `PopulationCohort` |
| | `src/domain/settlement.ts` | Cập nhật kiểu `Settlement` tương thích với `GameState` |
| | `src/domain/economy.ts` *(Tạo mới)* | Chuyển định nghĩa `ProductionReport` vào `core` để tránh phụ thuộc vòng |
| | `src/command/command.ts` | Bổ sung `ADVANCE_DAY` vào union `Command`; định nghĩa `CommandResult` và `AdvanceDayResultData` |
| | `src/command/effect.ts` | Bổ sung kiểu Effect cập nhật ngày và hao hụt tài nguyên có chẩn đoán |
| | `src/command/invariants.ts` *(Tạo mới)* | Hàm thuần kiểm tra luật bất biến (bảo toàn tài nguyên $\ge 0$, giới hạn chỉ số) |
| | `src/time/clock.ts` | Đảm bảo tính toán chu kỳ tuần/năm deterministic |
| | `src/index.ts` | Re-export các kiểu và hàm thuần kiểm tra |
| | `src/__tests__/*` | Test unit, test invariant, và test ranh giới kiến trúc (`architecture.test.ts`) |
| **`packages/simulation`** | `src/dispatcher.ts` *(Tạo mới)* | Entry point `executeCommand(state, command): CommandResult` |
| | `src/handlers/advanceDay.ts` *(Tạo mới)* | Xử lý lệnh `ADVANCE_DAY`, điều phối tiêu thụ kinh tế và tăng đồng hồ |
| | `src/economy.ts` | Sửa ngày truyền vào; áp dụng công thức Cấp phát & Thiếu hụt sàn 0 |
| | `src/index.ts` | Export `executeCommand` và các hàm mô phỏng |
| | `src/__tests__/*` | Test dispatcher, test thứ tự bắt lỗi, test atomicity |
| **`packages/ui`** | `src/App.svelte` | Thay mutation nghiệp vụ bằng Command Dispatch; render state + nhật ký nhân quả |
| | `tsconfig.json` *(Tạo mới)* | Cấu hình TypeScript cho UI |
| | `package.json` | Bổ sung devDependency `svelte-check` và script `check` |
| **`packages/persistence`**| `src/schema.ts` | Đồng bộ kiểu `WorldSaveData` tương thích 100% với cấu trúc `GameState` |
| **Root & Configs** | `package.json` | Bổ sung `typecheck` cho UI, cấu hình test tách biệt Vitest và Playwright |
| | `package-lock.json` | Cập nhật lockfile cho `npm ci` khi cài devDependencies mới |
| | `playwright.config.ts` *(Tạo mới)* | Cấu hình Playwright preview server trên port 4173 và test headless Chromium |
| | `tests/e2e/smoke.spec.ts` *(Tạo mới)* | Browser Smoke Test tự động |
| | `.github/workflows/ci.yml` | Nối các bước kiểm tra: typecheck (có UI), vitest, build UI, playwright smoke test |
| | `docs/INTERNAL_PROGRESS_TRACKER.md` | Cập nhật trạng thái tiến độ R1 trên nhánh |
| | `docs/work_packages/WP-R1-r2.md` | Bản lưu kế hoạch được Human duyệt |

---

### 1.3. Ngoài Phạm Vi (Out-of-Scope)
- Không triển khai hệ thống xây dựng, phân công lao động hay công thức sản xuất phức tạp (dành cho **R2**).
- Không triển khai cơ chế suy giảm sức khỏe, bạo loạn hay chết đói do thiếu hụt tài nguyên (dành cho **R2**).
- Không triển khai cơ chế Lưu/Nạp (Save/Load/Migration/IndexedDB) (dành cho **R3**).
- Không triển khai logic chuyển giao quyền lực Handoff hay Governor AI cho Legacy (dành cho **R4**).
- Không đụng chạm tới bất kỳ nội dung 18+, di truyền, hay pixel art canvas nào.

---

## 2. Quy Tắc Kỹ Thuật Chi Tiết (Technical Addendum)

### 2.1. Invariant Hai Chiều 0/1 Active Settlement (LAW-05)
`validateGameState(state: GameState)` phải thỏa mãn:
1. Số lượng settlement có `status === "active"` trong world là 0 $\iff$ `activeSettlementId === null`.
2. Số lượng settlement có `status === "active"` trong world là 1 $\iff$ `activeSettlementId === activeSettlement.id`.
3. Mọi trường hợp khác (1 active nhưng id null, 0 active nhưng id mang giá trị, pointer trỏ vào settlement không active, hoặc $\ge 2$ active) $\rightarrow$ **TỪ CHỐI** (`INVALID_STATE`).
4. Khóa từ điển: Với mọi cặp `[key, settlement]` trong `settlements: Record<string, Settlement>`, bắt buộc $key \equiv settlement.id$.

### 2.2. Quy Ước Lượt `ADVANCE_DAY` và Ngày Báo Cáo
1. Lệnh `ADVANCE_DAY` kết thúc ngày $T$ và mở ra ngày $T + 1$:
   - Đọc trạng thái tài nguyên, dân số đầu ngày $T$.
   - Tính toán tiêu thụ kinh tế của ngày $T$ $\rightarrow$ Báo cáo mang `day = T`.
   - Tiến Clock $T \rightarrow T + 1$.
   - Trả về `fromDay: T`, `toDay: T + 1`, `report.day: T`.
   - UI hiển thị ngày hiện tại là **$T + 1$**, trong khi Audit Log giải thích kết quả ngày $T$.
2. World có 0 active: Clock vẫn tiến $T \rightarrow T + 1$; không phát sinh tiêu thụ trực trị; log ghi nhận không có lãnh địa trực trị.
3. World có Legacy settlement: Dữ liệu kho/dân của Legacy được giữ nguyên 100% trong R1.

### 2.3. Thứ Tự Bắt Lỗi, Phân Biệt Quyền Hạn & Atomicity
1. **Pipeline thẩm định lệnh**:
   - Bước 1: `validateGameState(state)` $\rightarrow$ Lỗi trả `INVALID_STATE`.
   - Bước 2: Thẩm định cú pháp `Command` $\rightarrow$ Lỗi trả `INVALID_COMMAND`.
   - Bước 3: Thẩm định quyền hạn (Authority Gate) $\rightarrow$ Nếu lệnh quản trị gửi tới Legacy settlement $\rightarrow$ Lỗi trả `FORBIDDEN`.
   - Bước 4: Điều phối Handler $\rightarrow$ Nếu lệnh quản trị hợp lệ, target active, nhưng chưa có handler $\rightarrow$ Lỗi trả `COMMAND_NOT_YET_IMPLEMENTED`. Nếu lệnh là `ADVANCE_DAY` $\rightarrow$ Thực thi trên draft state.
2. **Cấu trúc `CommandResult`**:
   - `success: true`: `{ success: true, nextState: GameState, effects: Effect[], auditEntries: AuditEntry[], data?: AdvanceDayResultData }`.
   - `success: false`: `{ success: false, error: CommandError, state: GameState }` *(Giữ nguyên tham chiếu state gốc)*.
3. **Quy tắc Atomicity**:
   - Không mutate trực tiếp input state.
   - Tính toán trên `draftState`, validate toàn vẹn trước khi trả về `nextState`.
   - Nếu có lỗi phát sinh giữa giao dịch, hủy bỏ toàn bộ thay đổi và không công bố Effect/Audit log thành công nào.
   - **`nextState` đã bao gồm toàn bộ thay đổi; UI tuyệt đối không áp dụng lại `effects` lần thứ hai**.

### 2.4. Kinh Tế Sàn 0 (Demand $\rightarrow$ Allocated $\rightarrow$ Deficit)
$$\text{Allocated} = \min(\text{CurrentStock}, \text{Demand})$$
$$\text{Deficit} = \text{Demand} - \text{Allocated}$$
$$\text{NextStock} = \text{CurrentStock} - \text{Allocated} \ge 0$$
- Tồn kho không bao giờ âm.
- Thiếu hụt được ghi rõ vào Audit Trail để giải thích nguyên nhân.
- Thiếu hụt không làm dừng tiến ngày.
- Đơn vị số học là số nguyên không âm ($\mathbb{N}_0$).

### 2.5. Tách Biệt Vitest & Playwright Preview Lifecycle
- `npm test`: Chỉ chạy Vitest quét các file `*.test.ts` trong `packages/` (unit, integration, architecture).
- `npm run test:smoke`: Chạy Playwright Chromium trên thư mục `tests/e2e`.
- `playwright.config.ts`: Khởi động `npm run preview --workspace=@haven/ui` trên port 4173, chờ URL sẵn sàng, thực thi smoke test trên bản build mới nhất, không reuse server trong CI.

---

## 3. Bảng Ma Trận Nghiệm Thu Luật Bắt Buộc

| Mã Luật | Tên Luật | Bằng chứng nghiệm thu trong R1 |
| :---: | :--- | :--- |
| **LAW-02** | Ranh Giới Kiến Trúc | `architecture.test.ts` xác minh `core` không import `simulation`, không chứa DOM; `simulation` không chứa DOM/UI; UI không có mutation nghiệp vụ. |
| **LAW-03** | Tính Nhất Quán & Clock | Test tiến ngày deterministic; chu kỳ tuần/năm nhất quán; báo cáo ngày $T$ trên clock $T \rightarrow T+1$. |
| **LAW-04** | Toàn Vẹn State & Sàn 0 | Reject input sai (NaN, tuổi âm, ID rỗng); deep clone cô lập object; kho không âm; atomicity rollback khi lỗi. |
| **LAW-05** | Vòng Đời & Quyền Hạn | Invariant 0/1 active hai chiều; từ chối lệnh quản trị tới Legacy với mã `FORBIDDEN`. |
| **LAW-06** | Bảo Vệ Tiến Trình | Schema `WorldSaveData` đồng bộ 100% với `GameState` (chỉ kiểu dữ liệu, không code save/load). |
| **LAW-07** | Bằng Chứng Thực Nghiệm | Log Vitest, Playwright smoke test, exit code 0, CI run `quality-gate` trên GitHub. |
| **LAW-08** | Công Bố & An Toàn | Thực hiện trên nhánh `feat/r1-execution-core`, mở PR, Human merge, không push thẳng main. |
