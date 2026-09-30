# Kế Hoạch Triển Khai Kỹ Thuật (Implementation Plan): POP-01A
# Gói: Class Resource Core (Foundation I — Population)

> **Mã gói**: `POP-01A`  
> **Tài liệu đặc tả nguồn**: [WP-HAVEN-02_Unified_v1.0.md](./WP-HAVEN-02_Unified_v1.0.md) (v1.5)  
> **Commit nền**: Nhánh `main` sau khi merge PR #3 (exact commit SHA sẽ được khóa tại biên bản bàn giao G2)  
> **Trạng thái**: G1 Approved / Closed $\rightarrow$ Chờ duyệt Plan để mở nhánh `feat/pop-01a-social-resource-core` thi công  
> **Mục tiêu**: Xây dựng module tính toán năng lực kinh tế - xã hội thuần túy (Pure Snapshot Calculator) cấp Population Cohort với chuẩn Fixed-Point `milli-units`, triệt tiêu hoàn toàn hiện tượng vách đá số học (cliff) và tách bạch sinh học vs lối sống.

---

## 1. Ranh Giới Phạm Vi & Điều Kiện Tiền Đề (Scope & Preconditions)

### A. Phạm Vi Files Cho Phép (Strict Allowlist — Đúng 4 Files)
Chỉ được phép tạo mới và chỉnh sửa đúng 4 files trong `packages/core/src/social/`:
1. `packages/core/src/social/types.ts`
2. `packages/core/src/social/profile.ts`
3. `packages/core/src/social/calculator.ts`
4. `packages/core/src/social/__tests__/pop01a_resource_core.test.ts`

### B. Danh Sách Cấm Tuyệt Đối (Strict Denylist)
* ❌ **Không export** module `social` từ `packages/core/src/index.ts` (slice chỉ tập trung chứng minh pure calculation qua unit test trực tiếp, tránh mở rộng public API surface khi chưa tích hợp Command/State).
* ❌ **Không sửa UI** (`packages/ui`).
* ❌ **Không sửa Command Dispatcher** (`packages/simulation/src/dispatcher.ts`).
* ❌ **Không can thiệp Simulation Tick** hay `ADVANCE_DAY`.
* ❌ **Không can thiệp Resource Inventory / Kho** (`packages/core/src/domain/resource.ts`, `economy.ts`).
* ❌ **Không can thiệp hay mô phỏng Named NPC** (đã tách sang `NPC-01 Future`).
* ❌ **Không can thiệp Building / Xây dựng**.

### C. Khóa Điều Kiện Tiền Đề (Preconditions & Anti-YAGNI)
* `calculateSocialResources` và `resolveEconomicProfile` giả định mảng `cohorts` đầu vào đã tuân thủ đầy đủ các domain invariants của R1 (được khởi tạo/kiểm định thông qua `createPopulationCohort` tại `packages/core/src/domain/population.ts`).
* **POP-01A TUYỆT ĐỐI KHÔNG thêm duplicate validation** cho count âm, NaN, chuỗi rỗng hay malformed state. Không tự tạo custom exception/error subsystem.

---

## 2. Đặc Tả Hợp Đồng Kỹ Thuật (Exact Technical Contracts)

### A. Canonical Imports & Macro Types (`types.ts`)
```ts
import type { PopulationCohort } from "../domain/population.js";
import type { SocialClass, LegalStatus } from "../domain/character.js";

export type EconomicProfileKey = "servile" | "lower" | "middle" | "upper";

export interface ClassResourceProfile {
  laborMultiplierMilli: number;
  purchaseDemandMultiplierMilli: number;
  lifestyleFoodMultiplierMilli: number;
}

export interface SocialResourceSnapshot {
  headcount: number;
  populationBlocks: number; // derived display: headcount / 100
  laborCapacityMilli: number; // integer milli-units
  purchaseDemandCapacityMilli: number; // integer milli-units
  survivalFoodNeedMilli: number; // integer milli-units (headcount * 1.0)
  lifestyleFoodDemandMilli: number; // integer milli-units (theo giai cấp)
}
```

### B. Hằng Số & Bảng Tham Số Khởi Đầu (`profile.ts`)
```ts
import type { EconomicProfileKey, ClassResourceProfile } from "./types.js";

export const SOCIAL_RESOURCE_SCALE = 1000;

export const INITIAL_BALANCE_PROFILE: Record<EconomicProfileKey, ClassResourceProfile> = {
  servile: {
    laborMultiplierMilli: 2000,
    purchaseDemandMultiplierMilli: 1000,
    lifestyleFoodMultiplierMilli: 500,
  },
  lower: {
    laborMultiplierMilli: 1500,
    purchaseDemandMultiplierMilli: 1000,
    lifestyleFoodMultiplierMilli: 1000,
  },
  middle: {
    laborMultiplierMilli: 1000,
    purchaseDemandMultiplierMilli: 1500,
    lifestyleFoodMultiplierMilli: 1000,
  },
  upper: {
    laborMultiplierMilli: 500,
    purchaseDemandMultiplierMilli: 2000,
    lifestyleFoodMultiplierMilli: 2000,
  },
};
```

### C. Logic Thuật Toán Thuần Túy (`calculator.ts`)
```ts
import type { PopulationCohort } from "../domain/population.js";
import type { EconomicProfileKey, ClassResourceProfile, SocialResourceSnapshot } from "./types.js";
import { SOCIAL_RESOURCE_SCALE } from "./profile.js";

export function calculatePopulationBlocks(headcount: number): number;

/**
 * Ánh xạ giai cấp và thân phận sang hồ sơ kinh tế vĩ mô.
 * Sử dụng exhaustive switch trên toàn bộ các giá trị của canonical SocialClass
 * kết hợp exhaustiveness guard với TypeScript `never`.
 * Tuyệt đối không dùng fallback ngầm và không thêm exception subsystem.
 */
export function resolveEconomicProfile(cohort: PopulationCohort): EconomicProfileKey {
  if (cohort.legalStatus === "enslaved") {
    return "servile";
  }

  switch (cohort.socialClass) {
    case "lower":
      return "lower";
    case "common":
    case "skilled":
      return "middle";
    case "administrative":
    case "elite":
      return "upper";
    default: {
      const _exhaustive: never = cohort.socialClass;
      return _exhaustive;
    }
  }
}

export function calculateSocialResources(
  cohorts: PopulationCohort[],
  profileMap: Record<EconomicProfileKey, ClassResourceProfile>
): SocialResourceSnapshot;
```

* **Khóa Contract**: Tuyệt đối **không có default argument** trong `calculateSocialResources`. Test và caller bắt buộc phải truyền đủ 2 đối số `(cohorts, profileMap)`.

---

## 3. Quy Trình Thi Công Chi Tiết (TDD-Executable Task Breakdown)

```mermaid
flowchart TD
    T1["Task 1: Canonical Types & 10 Resolver Cases"] --> T2["Task 2: Balance Profile & Scale Constants"]
    T2 --> T3["Task 3: Full Calculator Test Suite (RED) & Implementation (GREEN)"]
    T3 --> T4["Task 4: Contract & Boundary Verification"]
    T4 --> T5["Task 5: Full Workspace Regression Verification (Typecheck, Test, Build, Smoke, Diff)"]
```

---

### Task 1: Canonical Types & 10 Resolver Test Cases
*Mục tiêu*: Thiết lập định nghĩa kiểu macro và kiểm chứng bộ giải mã kinh tế với 10 ca kiểm thử bảo đảm quyền ưu tiên tuyệt đối của `enslaved`, sử dụng exhaustive switch mapping với TypeScript `never` guard (không fallback ngầm, không exception subsystem).

- [ ] **Step 1.1**: Tạo file `packages/core/src/social/types.ts` với đầy đủ các types macro (`EconomicProfileKey`, `ClassResourceProfile`, `SocialResourceSnapshot`) và import canonical `PopulationCohort`, `SocialClass`, `LegalStatus`.
- [ ] **Step 1.2**: Tạo file test `packages/core/src/social/__tests__/pop01a_resource_core.test.ts`. Viết test suite `describe("resolveEconomicProfile")` gồm đúng **10 test cases**:
  1. `legalStatus: "enslaved"` + `socialClass: "lower"` $\rightarrow$ `"servile"`
  2. `legalStatus: "enslaved"` + `socialClass: "common"` $\rightarrow$ `"servile"`
  3. `legalStatus: "enslaved"` + `socialClass: "skilled"` $\rightarrow$ `"servile"`
  4. `legalStatus: "enslaved"` + `socialClass: "administrative"` $\rightarrow$ `"servile"`
  5. `legalStatus: "enslaved"` + `socialClass: "elite"` $\rightarrow$ `"servile"`
  6. `legalStatus: "citizen"` + `socialClass: "lower"` $\rightarrow$ `"lower"`
  7. `legalStatus: "citizen"` + `socialClass: "common"` $\rightarrow$ `"middle"`
  8. `legalStatus: "citizen"` + `socialClass: "skilled"` $\rightarrow$ `"middle"`
  9. `legalStatus: "citizen"` + `socialClass: "administrative"` $\rightarrow$ `"upper"`
  10. `legalStatus: "citizen"` + `socialClass: "elite"` $\rightarrow$ `"upper"`
- [ ] **Step 1.3 (RED)**: Chạy lệnh test:
  ```bash
  npx vitest run packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  ```
  *Kỳ vọng RED*: Lỗi thực thi do hàm `resolveEconomicProfile` chưa tồn tại trong `calculator.ts`.
- [ ] **Step 1.4**: Tạo file `packages/core/src/social/calculator.ts`. Triển khai hàm `resolveEconomicProfile` với exhaustive switch và `never` guard:
  ```ts
  export function resolveEconomicProfile(cohort: PopulationCohort): EconomicProfileKey {
    if (cohort.legalStatus === "enslaved") {
      return "servile";
    }

    switch (cohort.socialClass) {
      case "lower":
        return "lower";
      case "common":
      case "skilled":
        return "middle";
      case "administrative":
      case "elite":
        return "upper";
      default: {
        const _exhaustive: never = cohort.socialClass;
        return _exhaustive;
      }
    }
  }
  ```
- [ ] **Step 1.5 (GREEN)**: Chạy lại lệnh test:
  ```bash
  npx vitest run packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  ```
  *Kỳ vọng GREEN*: Toàn bộ 10 resolver test cases đều PASS.
- [ ] **Step 1.6**: Chạy typecheck kiểm chứng:
  ```bash
  npm run typecheck:core
  ```
  *Kỳ vọng*: 0 errors.
- [ ] **Step 1.7 (Commit Checkpoint)**: Stage đúng các file thuộc Task 1 và commit checkpoint:
  ```bash
  git add packages/core/src/social/types.ts \
          packages/core/src/social/calculator.ts \
          packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  git commit -m "feat(social): define macro types and implement exhaustive 10-case resolveEconomicProfile"
  ```
- [ ] **Step 1.8 (Reviewer Gate)**: Reviewer xác nhận: Đúng 10 cases, exhaustive switch có `never` guard, không fallback ngầm, không tái định nghĩa canonical types, không export ra `core/src/index.ts`.

---

### Task 2: Balance Profile & Fixed-Point Constants
*Mục tiêu*: Khởi tạo hằng số tỷ lệ `SOCIAL_RESOURCE_SCALE = 1000` và cấu hình hệ số v0.1 cho 4 hồ sơ kinh tế.

- [ ] **Step 2.1**: Viết test suite `describe("INITIAL_BALANCE_PROFILE & Scale")` trong `pop01a_resource_core.test.ts`:
  - Khẳng định `SOCIAL_RESOURCE_SCALE === 1000`.
  - Khẳng định `INITIAL_BALANCE_PROFILE` có đủ 4 key: `servile`, `lower`, `middle`, `upper`.
  - Khẳng định chính xác từng hệ số:
    - `servile`: labor = 2000, purchaseDemand = 1000, lifestyleFood = 500
    - `lower`: labor = 1500, purchaseDemand = 1000, lifestyleFood = 1000
    - `middle`: labor = 1000, purchaseDemand = 1500, lifestyleFood = 1000
    - `upper`: labor = 500, purchaseDemand = 2000, lifestyleFood = 2000
- [ ] **Step 2.2 (RED)**: Chạy test:
  ```bash
  npx vitest run packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  ```
  *Kỳ vọng RED*: Lỗi do `packages/core/src/social/profile.ts` chưa tồn tại.
- [ ] **Step 2.3**: Tạo file `packages/core/src/social/profile.ts`, khai báo `SOCIAL_RESOURCE_SCALE` và `INITIAL_BALANCE_PROFILE`.
- [ ] **Step 2.4 (GREEN)**: Chạy lại test:
  ```bash
  npx vitest run packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  ```
  *Kỳ vọng GREEN*: Tests profile và scale đều PASS.
- [ ] **Step 2.5 (Commit Checkpoint)**: Stage đúng các file thuộc Task 2 và commit checkpoint:
  ```bash
  git add packages/core/src/social/profile.ts \
          packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  git commit -m "feat(social): add SOCIAL_RESOURCE_SCALE and INITIAL_BALANCE_PROFILE config"
  ```
- [ ] **Step 2.6 (Reviewer Gate)**: Reviewer xác nhận: Config độc lập, pure constants, đúng giá trị v0.1.

---

### Task 3: Full Calculator Test Suite (RED) & Implementation (GREEN)
*Mục tiêu*: Áp dụng TDD trung thực: Viết toàn bộ các test cases cho Calculator (bao gồm Benchmark A/B, Custom Profile, Edge Cases 1/99/101, Input Rỗng, và Tính Bất Biến Immutability) **TRƯỚC KHI** triển khai hàm `calculateSocialResources`. Chứng minh trạng thái RED thực sự trước khi GREEN.

- [ ] **Step 3.1**: Viết toàn bộ test suites cho Calculator trong `pop01a_resource_core.test.ts`:
  - **Suite 1 — Benchmark Fixtures**:
    - **Fixture A (Canonical Scale)**:
      - Đầu vào: 10.000 lower (`citizen`), 1.000 enslaved (`lower`), 3.000 middle (`citizen`, `common`), 500 upper (`citizen`, `elite`).
      - Gọi: `calculateSocialResources(cohortsA, INITIAL_BALANCE_PROFILE)`.
      - Khẳng định: `headcount === 14500`, `populationBlocks === 145.0`, `laborCapacityMilli === 202500`, `purchaseDemandCapacityMilli === 165000`, `survivalFoodNeedMilli === 145000`, `lifestyleFoodDemandMilli === 145000`.
    - **Fixture B (Formula Discrimination)**:
      - Đầu vào: 9.700 lower (`citizen`), 1.000 enslaved (`lower`), 3.000 middle (`citizen`, `skilled`), 800 upper (`citizen`, `administrative`).
      - Gọi: `calculateSocialResources(cohortsB, INITIAL_BALANCE_PROFILE)`.
      - Khẳng định: `headcount === 14500`, `populationBlocks === 145.0`, `laborCapacityMilli === 199500`, `purchaseDemandCapacityMilli === 168000`, `survivalFoodNeedMilli === 145000`, `lifestyleFoodDemandMilli === 148000`.
      - Khẳng định phân biệt công thức bắt buộc:
        ```ts
        expect(resultB.survivalFoodNeedMilli).not.toBe(resultB.lifestyleFoodDemandMilli);
        ```
  - **Suite 2 — Parameter Usage & Robustness**:
    - **Custom Profile Test**: Truyền một `customProfileMap` có hệ số khác (ví dụ: `lower.laborMultiplierMilli = 3000`). Khẳng định `laborCapacityMilli` thay đổi tương ứng theo multiplier mới (chứng minh tham số `profileMap` thực sự được sử dụng và không bị hardcode).
    - **Edge Cases Blocks & Labor**:
      - 1 dân Lower: `populationBlocks === 0.01`, `laborCapacityMilli === 15`
      - 99 dân Lower: `populationBlocks === 0.99`, `laborCapacityMilli === 1485` (chứng minh loại bỏ vách đá cliff về 0)
      - 101 dân Lower: `populationBlocks === 1.01`, `laborCapacityMilli === 1515`
      - 0 dân (hoặc danh sách rỗng `[]`): mọi giá trị snapshot đều là `0`.
  - **Suite 3 — Purity & Immutability**:
    - Chuẩn bị mảng `cohorts` và `profileMap`. Tạo deep clone snapshot của cả hai trước khi gọi.
    - Gọi: `calculateSocialResources(cohorts, profileMap)`.
    - Khẳng định: `cohorts` đầu vào giữ nguyên 100% (không bị thêm/bớt/sửa property).
    - Khẳng định: `profileMap` đầu vào giữ nguyên 100% (không bị mutate).
- [ ] **Step 3.2 (RED)**: Chạy lệnh test:
  ```bash
  npx vitest run packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  ```
  *Kỳ vọng RED*: Lỗi thực thi do `calculateSocialResources` và `calculatePopulationBlocks` chưa được triển khai/export trong `calculator.ts`.
- [ ] **Step 3.3**: Triển khai trong `packages/core/src/social/calculator.ts`:
  ```ts
  export function calculatePopulationBlocks(headcount: number): number {
    return headcount / 100;
  }

  export function calculateSocialResources(
    cohorts: PopulationCohort[],
    profileMap: Record<EconomicProfileKey, ClassResourceProfile>
  ): SocialResourceSnapshot {
    let totalHeadcount = 0;
    let totalLaborMilli = 0;
    let totalPurchaseMilli = 0;
    let totalSurvivalFoodMilli = 0;
    let totalLifestyleFoodMilli = 0;

    for (const cohort of cohorts) {
      const count = cohort.count;
      totalHeadcount += count;
      const profile = profileMap[resolveEconomicProfile(cohort)];

      totalLaborMilli += Math.floor((count * profile.laborMultiplierMilli) / 100);
      totalPurchaseMilli += Math.floor((count * profile.purchaseDemandMultiplierMilli) / 100);
      totalSurvivalFoodMilli += Math.floor((count * SOCIAL_RESOURCE_SCALE) / 100);
      totalLifestyleFoodMilli += Math.floor((count * profile.lifestyleFoodMultiplierMilli) / 100);
    }

    return {
      headcount: totalHeadcount,
      populationBlocks: calculatePopulationBlocks(totalHeadcount),
      laborCapacityMilli: totalLaborMilli,
      purchaseDemandCapacityMilli: totalPurchaseMilli,
      survivalFoodNeedMilli: totalSurvivalFoodMilli,
      lifestyleFoodDemandMilli: totalLifestyleFoodMilli,
    };
  }
  ```
- [ ] **Step 3.4 (GREEN)**: Chạy lại test:
  ```bash
  npx vitest run packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  ```
  *Kỳ vọng GREEN*: Toàn bộ tests (Benchmarks A/B, Custom Profile, Edge Cases 1/99/101, Input rỗng, và Immutability) đều PASS 100%.
- [ ] **Step 3.5 (Commit Checkpoint)**: Stage đúng các file thuộc Task 3 và commit checkpoint:
  ```bash
  git add packages/core/src/social/calculator.ts \
          packages/core/src/social/__tests__/pop01a_resource_core.test.ts
  git commit -m "feat(social): implement calculateSocialResources and pass complete benchmark & robustness suite"
  ```
- [ ] **Step 3.6 (Reviewer Gate)**: Reviewer xác nhận: TDD trung thực, hàm thuần túy không mutate, không dùng default argument, parameter `profileMap` có hiệu lực thực thi, phân biệt công thức thành công.

---

### Task 4: Contract & Boundary Verification
*Mục tiêu*: Thẩm định tĩnh và động các ràng buộc hợp đồng kỹ thuật, exhaustiveness check và ranh giới module.

- [ ] **Step 4.1 (Contract Signature Audit)**: Kiểm tra chữ ký hàm trong `calculator.ts`, xác nhận `calculateSocialResources(cohorts: PopulationCohort[], profileMap: Record<EconomicProfileKey, ClassResourceProfile>): SocialResourceSnapshot` không có default argument.
- [ ] **Step 4.2 (Exhaustive Switch Audit)**: Kiểm tra `resolveEconomicProfile` trong `calculator.ts`, xác nhận switch bao phủ đủ các case của canonical `SocialClass` và có nhánh `default: { const _exhaustive: never = cohort.socialClass; return _exhaustive; }`. Không tồn tại fallback ngầm `return "upper"`.
- [ ] **Step 4.3 (Precondition & Anti-YAGNI Audit)**: Rà soát toàn bộ file `calculator.ts`, xác nhận KHÔNG thêm duplicate validation cho count âm, NaN, chuỗi rỗng hay malformed state. Tuân thủ domain preconditions của R1.
- [ ] **Step 4.4 (Module Boundary Audit)**: Kiểm tra `packages/core/src/index.ts`, xác nhận **KHÔNG** export module `social`.
- [ ] **Step 4.5 (Audit Checkpoint Rule)**:
  - Nếu toàn bộ các khâu thẩm định tĩnh và động (Step 4.1 – 4.4) đều đạt và không phát sinh thay đổi file: **NO COMMIT REQUIRED** (không thực hiện commit rỗng).
  - Nếu phát hiện vi phạm hợp đồng hoặc ranh giới: chuyển ngay sang trạng thái **HOLD for Reviewer** để đánh giá lại nguyên nhân gốc rễ (Anti-Loop Rule); tuyệt đối không tự ý sửa đổi kiến trúc hay scope trong bước thẩm định.
- [ ] **Step 4.6 (Reviewer Gate)**: Reviewer xác nhận toàn bộ ràng buộc hợp đồng và ranh giới kiến trúc đã được bảo toàn nguyên vẹn.

---

### Task 5: Full Workspace Regression Verification
*Mục tiêu*: Bảo đảm toàn bộ kiểm tra chất lượng của repo đều xanh tuyệt đối và diff nằm trọn vẹn trong allowlist.

- [ ] **Step 5.1 (Typecheck)**: Chạy kiểm tra kiểu toàn diện trên 5 packages:
  ```bash
  npm run typecheck
  ```
  *Kỳ vọng*: 0 errors, 0 warnings.
- [ ] **Step 5.2 (Unit Tests)**: Chạy toàn bộ test suite Vitest:
  ```bash
  npm test
  ```
  *Kỳ vọng*: 51 tests cũ + test suite mới của `pop01a_resource_core.test.ts` đều PASS.
- [ ] **Step 5.3 (Production Build)**: Chạy build toàn diện ứng dụng:
  ```bash
  npm run build
  ```
  *Kỳ vọng*: Build Vite thành công, bundle không lỗi.
- [ ] **Step 5.4 (Browser Smoke Test)**: Chạy Playwright smoke test trên headless browser:
  ```bash
  npm run test:smoke
  ```
  *Kỳ vọng*: 1/1 passed trên Chromium headless.
- [ ] **Step 5.5 (Allowlist/Denylist Diff Inspection với BASE_SHA)**: Kiểm tra git diff so với exact G2 `BASE_SHA` bất biến và kiểm tra trạng thái working tree:
  ```bash
  git diff --stat "$BASE_SHA"...HEAD
  git diff --name-only "$BASE_SHA"...HEAD
  git status --short
  ```
  *Kỳ vọng*:
  - Tập hợp file thay đổi bắt buộc phải khớp chính xác 100% với 4 files trong allowlist:
    - `packages/core/src/social/types.ts`
    - `packages/core/src/social/profile.ts`
    - `packages/core/src/social/calculator.ts`
    - `packages/core/src/social/__tests__/pop01a_resource_core.test.ts`
  - Tuyệt đối không có file thứ năm nào bị thêm mới hoặc chỉnh sửa (UI, simulation, persistence, content, `core/src/index.ts` giữ nguyên 100%).
  - Kiến trúc deterministic: `packages/core/src/__tests__/architecture.test.ts` PASS (không import simulation, không chứa DOM/UI).
- [ ] **Step 5.6 (Final Verification Gate & Hand-off)**:
  - Khi toàn bộ 5 bước kiểm chứng (Step 5.1 – 5.5) đều xanh và working tree sạch: **NO FINAL COMMIT REQUIRED** (không tạo commit rỗng).
  - Thu thập đầy đủ bằng chứng nghiệm thu thực nghiệm (test logs, typecheck, exit code, diff set), mở PR và dừng lại để **Human Review & Merge Decision**.

---

## 4. Ma Trận Nghiệm Thu Cuối Cùng (Acceptance Checklist)

| Tiêu Chí | Nội Dung Kiểm Chứng | Phương Thức Đánh Giá | Trạng Thái |
| :--- | :--- | :---: | :---: |
| **AC-POP01A-01** | Hằng số `SOCIAL_RESOURCE_SCALE = 1000`. Integer milli-units với `Math.floor`. | Unit Test | [ ] |
| **AC-POP01A-02** | Fixture A khớp chính xác 100% với bảng đặc tả. | Unit Test | [ ] |
| **AC-POP01A-03** | Fixture B chứng minh $\text{Survival Food} (145.000) \ne \text{Lifestyle Food} (148.000)$. | Unit Test | [ ] |
| **AC-POP01A-04** | Edge cases 1, 99, 101 cư dân xác nhận lũy tiến liên tục, blocks = 0.01/0.99/1.01, không cliff; input rỗng `[]` = 0. | Unit Test | [ ] |
| **AC-POP01A-05** | `calculateSocialResources` là pure function, zero mutation trên cả `cohorts` và `profileMap`. | Unit Test | [ ] |
| **AC-POP01A-06** | `resolveEconomicProfile` kiểm chứng đủ 10 cases (5 enslaved across classes + 5 non-enslaved) bằng exhaustive switch có `never` guard, không fallback ngầm. | Unit Test & Code Inspection | [ ] |
| **AC-POP01A-07** | `types.ts` import canonical từ `domain/population.js` & `domain/character.js`; không tái định nghĩa. | Architecture / Typecheck | [ ] |
| **AC-POP01A-08** | Không có default parameter trong signature của `calculateSocialResources(cohorts, profileMap)`. | Code Inspection | [ ] |
| **AC-POP01A-09** | Tham số tùy biến `profileMap` được chứng minh có hiệu lực thông qua Unit Test. | Unit Test | [ ] |
| **AC-POP01A-10** | Không export module `social` ra ngoài `packages/core/src/index.ts`. | Code Inspection | [ ] |
| **AC-POP01A-11** | Full Quality Gate: `typecheck`, `test`, `build`, `test:smoke`, và allowlist diff inspection đều đạt 100%. | CI / Automation | [ ] |
