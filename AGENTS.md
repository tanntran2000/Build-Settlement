# Quy Chuẩn & Cẩm Nang Kỹ Thuật Dành Cho AI Agent (AGENTS.md)

> **Dự án**: Haven: Sovereign Frontier (Build-Settlement)  
> **Mục đích**: Tài liệu này là kim chỉ nam bắt buộc cho bất kỳ AI Agent nào (Gemini, Claude, GPT, v.v.) tham gia vào quá trình lập trình, bảo trì, hoặc mở rộng dự án.

---

## 1. Triết Lý & Nguyên Tắc Bất Di Bất Dịch

1. **Kiến Trúc Headless (Tách biệt tuyệt đối Mô phỏng & Giao diện)**:
   - Các gói `packages/core` và `packages/simulation` là **Pure TypeScript (Deterministic)**.
   - **CẤM**: Tuyệt đối không import bất kỳ API nào liên quan đến DOM (`document`, `window`), Canvas, hay thư viện UI (`svelte`, `react`) vào trong `packages/core` hoặc `packages/simulation`.
   - Lõi mô phỏng chỉ nhận vào trạng thái hiện tại (State) + Lệnh (Command) $\rightarrow$ xử lý theo luật $\rightarrow$ trả về Trạng thái mới (New State) + Hiệu ứng phụ (Effects / Audit Log).

2. **Type Safety Khắt Khe (TypeScript Strict Mode)**:
   - Không được phép sử dụng `any`. Mọi dữ liệu phải có kiểu tường minh (Interface, Type, Enum).
   - Không ép kiểu cưỡng bức (`as unknown as ...`) trừ khi có lý do kỹ thuật bất khả kháng và phải có comment giải trình.
   - Ưu tiên sử dụng *Branded Types* hoặc *String Literal Enums* để tránh nhầm lẫn giữa các định danh (ví dụ: `CharacterId`, `SettlementId`, `ResourceId`).

3. **Song Ngữ Song Song Anh - Việt (Bilingual First - EN/VI)**:
   - Toàn bộ nội dung hiển thị cho người chơi (Tên công trình, sự kiện, nhật ký nhân quả, tên tài nguyên, xưng hô, kịch bản 18+) phải hỗ trợ **song ngữ Anh - Việt song song** thông qua hệ thống từ điển i18n (`vi` và `en`).
   - Người chơi có thể tự do chuyển đổi ngôn ngữ hoặc hiển thị song ngữ.
   - Hỗ trợ bộ giải quyết đại từ nhân xưng động (`PronounResolver`) thích ứng với giới tính, địa vị pháp lý, và mối quan hệ giữa người nói và người nghe.
   - Mã nguồn (Tên biến, Tên hàm, Interface, Commit message) sử dụng **Tiếng Anh chuẩn**. Tham chiếu [GLOSSARY.md](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/GLOSSARY.md) để đồng nhất.

4. **Phong Cách Nghệ Thuật: 100% Thuần Pixel Art & Bản Đồ Ô Bàn Cờ (Chessboard Grid)**:
   - **100% Pixel Art**: Toàn bộ hình ảnh trong game (Chân dung nhân vật, biểu cảm, công trình, bản đồ, icon và tranh minh họa sự kiện 18+) ĐỀU PHẢI là Pixel Art. Tuyệt đối không pha tạp phong cách đồ họa khác để giữ tính đồng nhất và siêu nhẹ.
   - **Bản đồ Lãnh địa dạng Ô Bàn Cờ**: Bản đồ chia theo lưới ô vuông/isometric kiểu bàn cờ (Grid/Chessboard). Mỗi ô là một vị trí đặt công trình, địa hình (đất, nước, đá, rừng) có tương tác vị trí kề cận (adjacency bonus).
   - **Giao Diện Tối Ưu, Màu Sắc Thuận Mắt**: Sử dụng bảng màu hài hòa, êm dịu (eye-friendly retro palette), không dùng màu quá chói, bố cục rõ ràng để người chơi theo dõi dữ liệu lâu không bị mỏi mắt.

5. **Kiểm Thử Tự Động Trước Khi Hoàn Tất (Test-Driven Verification)**:
   - Mọi cơ chế mô phỏng mới, thay đổi công thức toán học, hoặc bổ sung domain model bắt buộc phải có Unit Test tương ứng trong thư mục `__tests__/`.
   - Trước khi báo cáo hoàn thành nhiệm vụ, Agent **bắt buộc phải chạy và kiểm tra**:
     ```bash
     npm test
     npm run build
     ```
   - Không được để tồn tại test fail hoặc lỗi biên dịch (build error).

6. **Giải Trình Nhân Quả Minh Bạch (Explanation Layer - "WHY")**:
   - Mọi biến động số học trong game (Tài nguyên tăng/giảm, Chỉ số Sĩ khí, Lòng tin, Thai kỳ, Sức khỏe) đều phải sinh ra bản ghi `AuditEntry` ghi lại:
     - Nguồn gốc phát sinh (Công trình, Sự kiện, NPC tác động).
     - Giá trị thay đổi (+ / -).
     - Diễn giải dễ hiểu cho người chơi.

7. **Siêu Nhẹ & Mở Cho Modding (Lightweight & Modding-First)**:
   - **Tối ưu tài nguyên**: Không cài đặt thư viện thứ ba cồng kềnh. Sử dụng định dạng ảnh WebP nén cao và lazy-loading. Bundle UI khi build phải duy trì ở mức siêu nhẹ (< 200KB gzip).
   - **Tách rời Logic & Dữ liệu (Data-Driven)**: Mọi dữ liệu về công trình, tài nguyên, chỉ số cơ thể, sự kiện 18+ và kịch bản thoại PHẢI được định nghĩa qua file cấu hình JSON/TypeScript schema riêng biệt trong `packages/content/`, tuyệt đối không hard-code vào logic tính toán.
   - Luôn thiết kế các Hook mở rộng để người chơi dễ dàng ghi đè (override) dữ liệu và ném ảnh chân dung tùy biến từ thư mục ngoài `mods/`.

---

## 2. Bản Đồ Mã Nguồn (Codebase Map)

Mã nguồn được tổ chức theo mô hình **Monorepo (npm workspaces)**:

```
Build-Settlement/
├── packages/
│   ├── core/           # Chứa Domain Models, Value Objects, Time Tick, Invariants, Command & Effect
│   │   └── src/
│   │       ├── domain/ # Character, Anatomy, Settlement, Population, Resource, Relationship, Memory
│   │       ├── command/# Command definitions, Command Handlers
│   │       └── time/   # Clock, Day Tick Manager
│   ├── simulation/     # Các subsystem tính toán chu kỳ kinh tế, nhu cầu, sinh học
│   │   └── src/
│   │       ├── economy.ts    # Sản xuất, Tiêu thụ hàng ngày, Cân đối kho bãi
│   │       ├── gestation.ts  # [Pregmod] Tiến trình thai kỳ & Sinh nở theo ngày
│   │       └── conditioning.ts# [FC 18+] Tâm lý thuần hóa, biến động Obedience/Devotion
│   ├── content/        # Dữ liệu tĩnh (Static Data): Bản vẽ công trình, danh mục tài nguyên, cây công nghệ
│   ├── persistence/    # Quản lý Save/Load: Schema phiên bản hóa, nén dữ liệu, xuất/nhập JSON
│   └── ui/             # Giao diện người dùng Svelte 5 + Vite (Dashboard, Chân dung, Nhật ký WHY)
├── docs/               # Hệ thống tài liệu toàn diện (Vision, Roadmap, Encyclopedia, Progress, Glossary)
├── package.json        # Cấu hình workspace gốc
├── tsconfig.base.json  # Cấu hình TypeScript Strict kế thừa cho tất cả packages
└── AGENTS.md           # [File này]
```

---

## 3. Quy Trình Làm Việc Tiêu Chuẩn Cho Agent (Standard Workflow)

Khi nhận một nhiệm vụ mới từ người dùng:
1. **Bước 1: Nghiên Cứu & Đối Chiếu**:
   - Đọc kỹ [MASTER_ROADMAP.md](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/MASTER_ROADMAP.md) để biết nhiệm vụ thuộc Phase nào.
   - Tra cứu [ENCYCLOPEDIA_MECHANICS.md](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/ENCYCLOPEDIA_MECHANICS.md) để nắm rõ logic nghiệp vụ và cơ chế 18+ liên quan.
   - Kiểm tra [INTERNAL_PROGRESS_TRACKER.md](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/INTERNAL_PROGRESS_TRACKER.md) để xem các module liên quan hiện đang ở trạng thái nào.
2. **Bước 2: Lập Kế Hoạch & Thiết Kế Interface**:
   - Định nghĩa trước các kiểu dữ liệu trong `packages/core/src/domain/`.
   - Đảm bảo tính tương thích ngược với các file save cũ trong `packages/persistence/`.
3. **Bước 3: Hiện Thực Hóa Logic (Implementation)**:
   - Viết logic mô phỏng vào `packages/core` hoặc `packages/simulation`.
   - Kết nối với tầng giao diện `packages/ui` nếu yêu cầu có phần hiển thị.
4. **Bước 4: Kiểm Thử & Xác Minh (Verification)**:
   - Viết Unit Test bằng Vitest. Chạy `npm test`.
   - Kiểm tra build UI: `npm run build`.
5. **Bước 5: Cập Nhật Tài Liệu Nội Bộ**:
   - Cập nhật [INTERNAL_PROGRESS_TRACKER.md](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/INTERNAL_PROGRESS_TRACKER.md) (đánh dấu hoàn thành, ghi chú nợ kỹ thuật nếu có).
