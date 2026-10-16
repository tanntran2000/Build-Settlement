# Tài Liệu Kiểm Chứng & Hướng Dẫn Tái Hiện (FOUNDATION-STATE-BOUNDARIES-01.md)

> **Mục đích**: Hướng dẫn tái hiện độc lập, bảng đối chiếu tiêu chí nghiệm thu và liên kết CI công khai cho gói sửa đổi `WP-FOUNDATION-STATE-BOUNDARIES-01` và `WP-FOUNDATION-PREPUBLICATION-01`.

---

## 1. Môi Trường & Snapshot Kiểm Thử

- **Base commit**: `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (`origin/main`).
- **Nhánh làm việc**: `fix/foundation-state-boundaries-01`.
- **Hệ điều hành kiểm chứng**: Windows 11 / Linux CI (`ubuntu-latest`).
- **Node runtime**: Node.js `v24.19.0` (local) / Node.js 24 (CI target).
- **Package manager**: npm `11.17.0`.

---

## 2. Các Lỗi Ranh Giới State & Bằng Chứng Tái Hiện (Regression)

### A. Duplicate Named NPC ID Guard (`packages/core/src/domain/gamestate.ts`)

- **Vấn đề**: `validateGameState` trước khi sửa không kiểm tra tính duy nhất của `NamedCharacter.id` trên toàn bộ `GameState`. Khi một state chứa 2 NPC cùng ID (trong cùng một settlement hoặc giữa các settlement), hệ thống chấp nhận state không hợp lệ.
- **Tái hiện RED trong lịch sử**:
  - Được thực hiện độc lập trên bản sao tạm của base code cũ `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` kèm regression test, tuyệt đối không reset/chuyển đổi checkout làm việc hiện tại:
  - Validator cũ trả `{ valid: true }` khi gặp NPC trùng ID, dẫn đến test thất bại (`Exit code 1`).
- **Kiểm chứng GREEN trên working tree hiện tại**:
  - Lệnh chạy test mục tiêu (executed count = 1 > 0):

    ```powershell
    npx vitest run packages/core/src/domain/__tests__/domain.test.ts -t "duplicate NamedCharacter IDs"
    ```

    *(Khai báo thực tế tại `packages/core/src/domain/__tests__/domain.test.ts:527`: `it("rejects state containing duplicate NamedCharacter IDs within a settlement or across settlements (LAW-04)")`).*
  - Hợp đồng lỗi thực tế:
    - `validateGameState` theo dõi `seenCharacterIds` và trả `{ valid: false, code: "INVALID_CHARACTER" }`.
    - `executeCommand` trong `dispatcher.ts` thẩm định trước thực thi và trả về cấu trúc lỗi chuẩn:

      ```typescript
      {
        success: false,
        error: { code: "INVALID_STATE", message: "..." }, // Chuỗi minh họa; thực tế lấy từ stateVal.message
        state // Giữ nguyên vẹn input state, clock và inventory
      }
      ```

    - Các NPC khác ID vẫn hoạt động bình thường (test tại dòng 558: `accepts state when multiple NamedCharacters have distinct IDs`).

### B. Dispatcher `structuredClone` Error Boundary (`packages/simulation/src/dispatcher.ts`)

- **Vấn đề**: Trước khi sửa, `const draftState = structuredClone(state)` nằm bên ngoài khối `try/catch` của `executeCommand`. Khi caller truyền `GameState` chứa trường không clone được (như field function mà validator hiện chấp nhận), `structuredClone` ném `DataCloneError` văng ra caller, phá vỡ hợp đồng all-or-nothing của Dispatcher.
- **Tái hiện RED trong lịch sử**:
  - Được thực hiện độc lập trên bản sao tạm của base code cũ `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675`: `structuredClone` ném `DataCloneError` ra ngoài caller thay vì trả về `CommandResult` thất bại (`Exit code 1`).
- **Kiểm chứng GREEN trên working tree hiện tại**:
  - Lệnh chạy test mục tiêu (executed count = 1 > 0):

    ```powershell
    npx vitest run packages/simulation/src/__tests__/dispatcher.test.ts -t "catches structuredClone failure"
    ```

    *(Khai báo thực tế tại `packages/simulation/src/__tests__/dispatcher.test.ts:538`: `it("catches structuredClone failure when state contains a function field and returns EXECUTION_ERROR without throwing or mutating state")`).*
  - Hoặc chạy toàn bộ 53 tests của cả 2 file hồi quy:

    ```powershell
    npx vitest run packages/core/src/domain/__tests__/domain.test.ts packages/simulation/src/__tests__/dispatcher.test.ts --no-cache
    ```

  - Hợp đồng lỗi thực tế (khớp `packages/core/src/command/command.ts:46` và `dispatcher.ts:92`):
    - `executeCommand` bắt gọn ngoại lệ clone bên trong `try/catch`, trả về đúng kiểu discriminated union thất bại:

      ```typescript
      {
        success: false,
        error: { code: "EXECUTION_ERROR", message: "..." },
        state // Giữ nguyên vẹn input state gốc
      }
      ```

    - Không chứa các trường giả định `effects: []` hay `auditEntries: []` trên kết quả lỗi.

---

## 3. Quy Trình Chạy Kiểm Thử Độc Lập

```powershell
# 1. Typecheck toàn bộ workspace
npm run typecheck

# 2. Kiểm tra lint
npm run lint

# 3. Chạy toàn bộ 220 unit tests (Vitest)
npm test -- --no-cache

# 4. Build sản phẩm (Core, Simulation, UI)
npm run build

# 5. Kiểm thử giao diện trình duyệt (Playwright)
npm run test:smoke
```

---

## 4. Liên Kết Bằng Chứng CI Công Khai (GitHub Actions)

- **Post-merge main run tại `0d1fa4eb1cbfb81fa66bae7482918bf9d0d09675` (PR #9)**:\
  [Quality Gate Run 37588093308](https://github.com/tanntran2000/Build-Settlement/actions/runs/37588093308/job/112682826378) — SUCCESS (215 unit tests + 1 browser smoke test).
- **PR #9 Synthetic Merge run (`085c62f8af88290394b8a46a3918d0538667624b`)**:\
  [Quality Gate Run 36988198913](https://github.com/tanntran2000/Build-Settlement/actions/runs/36988198913/job/110777976731) — SUCCESS.
- **PR #7 HEAD run (`c7beed21a27896d12796d008bfd5248630410a22`)**:\
  [Quality Gate Run 36965142356](https://github.com/tanntran2000/Build-Settlement/actions/runs/36965142356) — SUCCESS (173 unit tests + 1 browser smoke test).
- **Lưu ý định danh bằng chứng**: Kết quả kiểm thử local trên working tree hiện tại (`220 unit tests + 1 smoke`) là bằng chứng thực thi local trên snapshot chưa commit, phân biệt rạch ròi với các run CI trên GitHub.
