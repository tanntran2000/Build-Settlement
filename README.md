# Haven: Sovereign Frontier (Build-Settlement)

> Trò chơi mô phỏng quản lý lãnh địa và xã hội hậu tận thế, kết hợp chiều sâu quản trị vĩ mô với hệ sinh thái cơ chế 18+ kế thừa từ *Free Cities* và *Pregmod*.  
> Xây dựng trên nền tảng **TypeScript Strict, Svelte 5 và Vite**, hỗ trợ song song **Trình duyệt Web** và **Phần mềm Máy tính Offline**.

---

## 1. Điểm Nhấn Trò Chơi (Key Highlights)

* **Vòng Lặp Vĩ Mô Độc Đáo (Macro Handoff Loop)**:
  * Người chơi chỉ trực tiếp điều hành **1 Lãnh Địa Trực Trị (Active Settlement)** tại một thời điểm để giữ trọn vẹn sự tập trung và chiều sâu vi mô.
  * Khi thuộc địa phát triển hưng thịnh, bạn ban hành **Hiến Chương Sáng Lập (Founder Charter)**, bổ nhiệm một Named NPC đáng tin cậy làm **Thống Đốc (Governor)** và thực hiện **Bàn Giao (Handoff)**.
  * Thuộc địa cũ trở thành **Lãnh Địa Di Sản (Legacy Settlement)** tự động vận hành trong nền, trong khi bạn dẫn dắt đoàn người khai hoang tiến sâu vào biên cương mới.

* **Hệ Thống Dân Số 2 Tầng (Two-Tier Population)**:
  * **Nhân Vật Cốt Cán (Named NPC)**: Cá nhân hóa sâu sắc với tên riêng, số đo cơ thể, nhan sắc, tâm lý, ký ức và **Ma trận Quan hệ 8 Chiều** (*Tin cậy, Tôn trọng, Tình cảm, Sợ hãi, Ân nợ, Dục vọng, Phục tùng, Uất hận*).
  * **Quần Thể Dân Cư (Population Cohort)**: Khối đông cư dân (Công nhân, Nông dân, Kỹ thuật viên, Lính bảo an, Nô lệ lao dịch) quản lý theo chỉ số bình quân: Sĩ khí, Năng suất, Bất mãn.

* **Ba Trục Thân Phận Độc Lập**:
  $$\text{Nghề Nghiệp (Occupation)} \neq \text{Tầng Lớp (Social Class)} \neq \text{Địa Vị Pháp Lý (Legal Status)}$$
  *Nô lệ hóa hay Công dân tự do là Địa vị pháp lý trước bộ luật, không phải là một nghề nghiệp đơn thuần.*

* **Hệ Sinh Thái Cơ Chế 18+ Toàn Diện (Free Cities & Pregmod)**:
  * **Giải phẫu học chi tiết**: Vóc dáng, số đo 3 vòng, tình trạng trinh tiết, biến đổi thể chất (vết xăm nô lệ, xỏ khuyên, phẫu thuật).
  * **Chu kỳ Thai sản & Di truyền (Pregmod Core)**: Thụ thai theo chu kỳ rụng trứng, thai kỳ biến đổi thể chất theo ngày tick, sinh nở an toàn/nguy hiểm, và di truyền phẩm chất cho thế hệ F1/F2.
  * **Tâm lý thuần hóa (FC Conditioning)**: Đấu tranh giữa Phục tùng (*Obedience*), Tôn sùng (*Devotion*), Khiếp sợ (*Fear*) đối đầu với Chấn thương tâm lý (*Trauma*) và Hội chứng Stockholm.
  * **Cơ sở hạ tầng chuyên biệt**: Nhà thổ sinh lời (*Arcade/Brothel*), Dinh thự lãnh chúa (*Master Quarters*), Trại huấn luyện nô lệ, Viện nhân giống và dưỡng thai.

* **Nghệ Thuật Kết Hợp (Pixel Art + AI Generated Art)**:
  * Pixel Art cổ điển cho Bản đồ lãnh địa ô đất (Grid), công trình kiến trúc và icon tài nguyên.
  * AI Generated Art chân thực, chất lượng cao cho Chân dung Named NPC (hỗ trợ ghép lớp biểu cảm, bụng bầu) và Tranh minh họa sự kiện CG 18+.

* **Nhật Ký Nhân Quả Minh Bạch (Explanation Layer - "WHY")**:
  Mọi biến động về tài nguyên, lòng trung thành, sĩ khí hay bất mãn đều có audit log chi tiết giải thích rõ nguyên nhân cốt lõi.

* **Thuần Việt & Offline-first**:
  Giao diện và cốt truyện viết bằng tiếng Việt tự nhiên, có bộ phân giải xưng hô động (*PronounResolver*), chơi hoàn toàn offline không phụ thuộc internet hay API bên thứ ba.

---

## 2. Hai Hình Thức Trải Nghiệm (Web & PC Offline)

Nhờ kiến trúc mã nguồn thống nhất, trò chơi hỗ trợ đồng thời cả hai cách chơi:

1. **Chơi Trực Tiếp Trên Web (Zero-Install)**:
   * Mở đường link trên bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Safari) là chơi được ngay, không cần đăng ký tài khoản.
   * Dữ liệu tự động lưu an toàn vào `IndexedDB` của trình duyệt.
2. **Tải Về Máy Tính Chơi Offline (Giống Free Cities)**:
   * Tải file `.zip` về giải nén, click đúp file `index.html` để chơi 100% offline.
   * Hoặc sử dụng bản cài đặt Desktop `.exe` độc lập siêu nhẹ (đóng gói qua **Tauri**), hỗ trợ thư mục `custom_portraits/` để người chơi tự thêm ảnh cá nhân.
3. **Chuyển Đổi Save Game Chéo**:
   * Tính năng **"Xuất file lưu" (Export Save)** và **"Nhập file lưu" (Import Save)** cho phép bạn chơi dở trên Web ở cơ quan rồi mang file về nạp vào máy tính cá nhân ở nhà chơi tiếp.

---

## 3. Hệ Thống Tài Liệu Dự Án (Documentation)

Hệ thống tài liệu đầy đủ được tổ chức trong thư mục `docs/`:

* 📖 **[Tầm Nhìn & Thiết Kế Ý Tưởng (VISION_AND_CONCEPT.md)](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/VISION_AND_CONCEPT.md)**: Triết lý thiết kế, bối cảnh thế giới và hướng tiếp cận thẩm mỹ.
* 🗺️ **[Bản Đồ Lộ Trình Kỹ Thuật (MASTER_ROADMAP.md)](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/MASTER_ROADMAP.md)**: Thước đo tiêu chuẩn, phân kỳ các Phase phát triển và tiêu chí hoàn thành (DoD).
* 📚 **[Bách Khoa Toàn Thư Cơ Chế (ENCYCLOPEDIA_MECHANICS.md)](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/ENCYCLOPEDIA_MECHANICS.md)**: Hướng dẫn tra cứu toàn diện về mọi hệ thống toán học, giải phẫu, thai sản và thuần hóa 18+.
* 📊 **[Bảng Theo Dõi Tiến Độ Nội Bộ (INTERNAL_PROGRESS_TRACKER.md)](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/INTERNAL_PROGRESS_TRACKER.md)**: Bảng theo dõi trạng thái các module mã nguồn trong `packages/*` và backlog kỹ thuật.
* 🔤 **[Từ Điển Thuật Ngữ Chuẩn Hóa (GLOSSARY.md)](file:///d:/NghienCuuTiemNang/Build-Settlement/docs/GLOSSARY.md)**: Đối chiếu chuẩn hóa thuật ngữ chuyên môn giữa Code (Tiếng Anh) và UI (Tiếng Việt).
* 🤖 **[Quy Chuẩn Hoạt Động Cho AI Agent (AGENTS.md)](file:///d:/NghienCuuTiemNang/Build-Settlement/AGENTS.md)**: Cẩm nang kỹ thuật bắt buộc dành cho bất kỳ AI nào tham gia code dự án.

---

## 4. Hướng Dẫn Kỹ Thuật Dành Cho Nhà Phát Triển

### Cấu Trúc Monorepo
```
Build-Settlement/
├── packages/
│   ├── core/           # Domain Model thuần túy: Character, Anatomy, Memory, Relationship, Invariants
│   ├── simulation/     # Lõi tính toán: Kinh tế hàng ngày, Thai sản Pregmod, Thuần hóa FC
│   ├── content/        # Dữ liệu tĩnh: Bản vẽ công trình, Danh mục tài nguyên, Sự kiện 18+
│   ├── persistence/    # Quản lý lưu trữ: Schema Save/Load, Nén dữ liệu, Export/Import
│   └── ui/             # Giao diện người dùng Svelte 5 + Vite: Dashboard, Chân dung, Nhật ký WHY
├── docs/               # Hệ thống tài liệu toàn diện
├── AGENTS.md           # Quy chuẩn dành cho AI Agent
├── package.json        # Quản lý npm workspaces
└── tsconfig.base.json  # TypeScript Strict Mode
```

### Yêu Cầu Môi Trường
* Node.js >= 20.0.0
* npm >= 10.0.0

### Khởi Chạy Giao Diện Phát Triển
```bash
npm run dev
```
Trình duyệt sẽ hiển thị tại `http://localhost:3000`.

### Kiểm Thử Tự Động (Unit Tests)
```bash
npm test
```

### Đóng Gói Ứng Dụng (Production Build)
```bash
npm run build
```
Kết quả biên dịch tĩnh sẽ nằm tại `packages/ui/dist/`.
