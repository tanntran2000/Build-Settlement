# Bản Đồ Lộ Trình Kỹ Thuật Tổng Thể (MASTER_ROADMAP.md)

> **Mục đích**: Bản đồ lộ trình thống nhất và duy nhất của dự án. Khóa chặt mục tiêu xây dựng **Bản Cắt Dọc Tối Thiểu (Vertical Slice R0 $\rightarrow$ R5)** trước khi mở rộng sang bất kỳ nội dung chuyên sâu nào.

---

## 1. Mục Tiêu Tối Thượng: Bản Cắt Dọc Tối Thiểu (Vertical Slice)

Mục tiêu giai đoạn hiện tại không phải là hoàn thiện toàn bộ các hệ thống 18+ hay đồ họa phức tạp, mà là chứng minh **vòng chơi quản lý sinh tồn cốt lõi hoạt động ổn định và có thể kiểm chứng được**:

> **Kịch bản nghiệm thu Vertical Slice**:  
> *Tạo world mới $\rightarrow$ Xây dựng nông trại & giếng nước $\rightarrow$ Phân công nhân lực $\rightarrow$ Tiến nhịp ngày (Day Tick) $\rightarrow$ Thấy sản xuất & tiêu thụ rõ ràng (tài nguyên không âm, thiếu hụt có giải trình nhân quả) $\rightarrow$ Lưu và tải lại game an toàn $\rightarrow$ Thực hiện Bàn giao (Handoff nguyên tử) $\rightarrow$ Lập thuộc địa mới (thuộc địa cũ trở thành Legacy tự vận hành) $\rightarrow$ Bắt đầu New Game+ mà world nguồn không bị phá hủy.*

---

## 2. Lộ Trình Triển Khai: Chặng 1 - Vertical Slice (R0 $\rightarrow$ R5)

```mermaid
flowchart TD
    R0["R0: Sửa CI & Đối Chiếu Tiến Độ (XONG)"] --> R1["R1: Lõi Thực Thi & Luật Bất Biến (XONG)"]
    R1 --> F1["Foundation I: Dân Cư & Năng Lực Xã Hội (POP)"]
    F1 --> F2["Foundation II: Tài Nguyên & Sinh Tồn (RES)"]
    F2 --> F3["Foundation III: Lưu Trữ & Vòng Đời Ván Chơi"]
    F3 --> F4["Foundation IV: Bàn Giao Thật (Atomic Handoff)"]
    F4 --> F5["Foundation V: Hệ Thống Sự Kiện & Tính Chơi Lại"]
    F5 --> MILESTONE["🏆 MỐC NGHIỆM THU VERTICAL SLICE"]
```

### Gói R0: Đối Chiếu Tiến Độ & Chuẩn Hóa CI (ĐÃ HOÀN THÀNH)
* [x] Xóa bỏ workflow Deno không tương thích, thiết lập `.github/workflows/ci.yml` chuẩn Node.js 20.
* [x] Dọn sạch 2 unused imports gây lỗi lint trong `settlement.ts` và `command.ts`.
* [x] Chuẩn hóa [INTERNAL_PROGRESS_TRACKER.md](INTERNAL_PROGRESS_TRACKER.md) theo 4 cấp độ (L1: Đã định nghĩa $\rightarrow$ L4: Đã tích hợp).
* [x] Đồng bộ hóa Schema Quan hệ 8D giữa code và [GLOSSARY.md](GLOSSARY.md).

---

### Gói R1: Lõi Thực Thi & Luật Bất Biến (ĐÃ HOÀN THÀNH)
* [x] Đồng bộ một Clock duy nhất trong `GameState` (loại bỏ biến `day` cục bộ trong UI).
* [x] Xây dựng Command Dispatcher trung tâm (`executeCommand(state, command) -> { nextState, effects, auditLog }`).
* [x] Hoàn thiện Invariant Validator:
  * `createNamedCharacter`: Deep clone object mặc định, chặn tuổi âm, clamp chỉ số [0, 100].
  * `PopulationCohort`: Bổ sung trường `socialClass` bắt buộc theo đúng thiết kế 3 trục thân phận.
  * Validation Invariants hai chiều (0 hoặc 1 Active Settlement, Key-ID matching, tài nguyên không âm).
* [x] Viết 51 Unit Tests tự động và 1 Playwright smoke test chứng minh: Lệnh sai bị từ chối; State không bị mutate dở dang; Invariant được bảo toàn.
* [x] Merge PR #1 (`375b60e`) vào `main`, hậu kiểm CI `36527428842` pass 100%.

---

### Foundation I: Dân Cư & Năng Lực Xã Hội (WP-HAVEN-02) (ƯU TIÊN HIỆN TẠI)
* **Triết lý**: Dân số thật tạo ra các năng lực xã hội. Nhu cầu và mức ủng hộ quyết định bao nhiêu năng lực đó thực sự sử dụng được. Player phân bổ năng lực, không phân bổ từng đầu người.
* **Ranh giới phạm vi**:
  * **Named NPC $\rightarrow$ `NPC-01 Future`**: Decouple hoàn toàn khỏi Population Core.
  * **Resource Core $\rightarrow$ Foundation II**: Chỉ triển khai sau khi Population Core cung cấp đủ input Demand và Capacity ổn định.
* **Các đầu việc cụ thể**:
  * [ ] **POP-01A: Class Resource Core**: **READY FOR IMPLEMENTATION** *(G1 Approved / Closed tại commit `913d981`)*
    * Khóa chuẩn Fixed-Point `SOCIAL_RESOURCE_SCALE = 1000` (integer milli-units, `Math.floor`).
    * 6-way resolver `resolveEconomicProfile` từ canonical `SocialClass` & `LegalStatus`.
    * Pure snapshot calculator `calculateSocialResources` (không mutate state, không side effects).
    * Nghiệm thu tuyệt đối 2 Benchmark Fixtures A/B và Edge cases 1/99/101 dân.
  * [ ] **POP-01B: Needs & Effective Capacity**: **DESIGN ONLY**
    * Cơ chế Satisfaction, Tác động thiếu hụt & Mức ủng hộ (Support) sang nhịp $T \rightarrow T+1$.
  * [ ] **POP-01C: Labor Allocation**: **DESIGN ONLY**
    * Phân bổ năng lực lao động (Effective $\rightarrow$ Allocated Labor), không phân bổ từng đầu người.
  * [ ] **POP-02: Population Dynamics**: **DESIGN ONLY**
    * Sinh tử, di cư, tháp tuổi, biến động nhân khẩu học vĩ mô.
  * [ ] **POP-03: Law & Social Conflict**: **DESIGN ONLY**
    * Chính sách giai cấp, xung đột quyền lợi, trật tự xã hội.

---

### Foundation II: Tài Nguyên & Vòng Sinh Tồn (Resource Core & Survival Loop)
* **Mục tiêu**: Kết nối Capacity & Demand từ Population Core vào vòng lặp Xây dựng $\rightarrow$ Sản xuất $\rightarrow$ Tiêu thụ vật lý.
* **Các đầu việc cụ thể**:
  * [ ] Tích hợp đầu vào Labor Capacity & Survival Food Need từ Population Core vào `simulateDailyEconomy`.
  * [ ] Hiện thực hóa lệnh `BUILD_FACILITY` với 3 bản vẽ hiện có:
    * Kiểm tra điều kiện & trừ chi phí kho $\rightarrow$ Tạo công trình.
    * Gán công nhân lao động (Labor Units) $\rightarrow$ Tính toán sản lượng hàng ngày (`production`) bù đắp tiêu thụ.
  * [ ] Viết Unit Test và Browser smoke test kiểm chứng kho không âm và sản xuất hoạt động.

---

### Gói R3: Lưu Trữ & Vòng Đời Ván Chơi (Persistence & Session Lifecycle)
* **Mục tiêu**: Đảm bảo tiến trình chơi được lưu và khôi phục an toàn, chuẩn bị nền tảng New Game+.
* **Các đầu việc cụ thể**:
  * [ ] Hiện thực hóa logic tuần tự hóa (`serializeWorld` / `deserializeWorld`).
  * [ ] Xử lý Save an toàn trên bản sao tạm (ngăn chặn hỏng save cũ khi ghi/đọc thất bại).
  * [ ] Hỗ trợ Xuất/Nhập file Save (`.json`) chéo giữa Web và máy tính.
  * [ ] Quy tắc vòng đời: New Game cô lập; Continue khôi phục chính xác toàn bộ Clock, NPC, Kho; New Game+ không làm hỏng World nguồn.

---

### Gói R4: Bàn Giao Thật (Atomic Handoff)
* **Mục tiêu**: Hiện thực hóa cơ chế đặc trưng nhất của game với sự bảo vệ tuyệt đối về luật chơi.
* **Các đầu việc cụ thể**:
  * [ ] Giao dịch Handoff nguyên tử: Bổ nhiệm Governor, phân chia tài sản, thu hồi quyền điều khiển trực tiếp của Player.
  * [ ] Cho phép Player có $0$ hoặc $1$ Active Settlement.
  * [ ] Thuộc địa cũ chuyển thành `legacy` và tự động cập nhật nền theo 4 quỹ đạo.
  * [ ] Viết Test chứng minh: Không nhân đôi NPC/tài sản; cấm Player gửi lệnh điều hành vào Legacy Settlement.

---

### Gói R5: Hệ Thống Sự Kiện & Tính Chơi Lại (Event Loop & Replayability)
* **Mục tiêu**: Đưa yếu tố ngẫu nhiên có kiểm soát và sự kiện có hệ quả vào game.
* **Các đầu việc cụ thể**:
  * [ ] Event Scheduler với RNG có seed (`worldSeed`).
  * [ ] Vài nhóm sự kiện sinh tồn mẫu (nguồn nước, bất mãn lao động, thương nhân vãng lai) có điều kiện kích hoạt, lịch sử lựa chọn và cooldown.
  * [ ] Giới hạn độ dài nhật ký lưu trữ (bounded log buffer) chống tràn bộ nhớ trong các ván chơi dài ngày.

---

## 3. Lộ Trình Mở Rộng: Chặng 2 - Nội Dung Chuyên Sâu (Post-Vertical Slice)

*Chỉ được phép kích hoạt sau khi Chặng 1 đã vượt qua toàn bộ tiêu chuẩn nghiệm thu và được Human phê duyệt:*

* **Phase C1**: Hệ thống Thể chất, Giải phẫu & Chỉ số 18+ (Anatomy, Beauty, Virginity).
* **Phase C2**: Động cơ Sinh sản & Di truyền học nhiều thế hệ (Pregmod Core).
* **Phase C3**: Tâm lý Thuần hóa, Kỷ cương & Sở thích tình dục (FC Conditioning).
* **Phase C4**: Cơ sở hạ tầng 18+ & Kinh tế chuyên biệt (Nhà thổ, Dinh thự, Viện nhân giống).
* **Phase C5**: Tích hợp Đồ họa 100% Thuần Pixel Art (Bản đồ Lưới ô bàn cờ, Chân dung Pixel Dolls, Ambient VFX).
* **Phase C6**: Đóng gói Đa nền tảng (Tauri Desktop) & Trình Nạp Mod Ngoại Vi (External Mod Loader).
