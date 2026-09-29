# Tầm Nhìn Dự Án & Bản Thiết Kế Ý Tưởng (VISION_AND_CONCEPT.md)

> **Tên dự án**: Haven: Sovereign Frontier (Build-Settlement)  
> **Thể loại**: Quản lý Lãnh địa & Mô phỏng Xã hội Hậu tận thế (Colony Sim / Society Simulator)  
> **Định hướng nội dung**: Chiều sâu quản trị vĩ mô kết hợp hệ sinh thái cơ chế 18+ kế thừa từ *Free Cities* và *Pregmod*.

---

## 1. Bối Cảnh & Cảm Hứng Thế Giới

Thế giới cũ đã hoàn toàn sụp đổ sau thảm họa toàn cầu. Các siêu đô thị hiện đại chỉ còn là đống tro tàn, các định chế pháp lý và đạo đức truyền thống bị xóa sổ. Trên vùng đất hoang vu cằn cỗi (*The Sovereign Frontier*), những tàn dư nhân loại phân tán thành các nhóm nhỏ tìm cách sinh tồn.

Người chơi nhập vai một **Nhà Sáng Lập (Founder)** mang theo tri thức, khát vọng và ý chí sắt đá để kiến thiết lại trật tự mới từ con số 0. Tại đây, bạn có toàn quyền định đoạt thể chế xã hội, thiết lập luật lệ, quy hoạch sản xuất, và quyết định số phận của từng con người dưới trướng: từ tự do dân chủ, độc tài quân phiệt, cho đến chế độ chiếm hữu nô lệ và chọn giống nhân chủng.

---

## 2. Các Trụ Cột Lối Chơi Cốt Lõi (Core Gameplay Pillars)

### 2.1. Vòng Lặp Vĩ Mô Độc Đáo (Macro Handoff Loop)
Khác biệt với các game quản lý thông thường người chơi phải gánh vác một bản đồ phình to mãi mãi:
* **Trực tiếp điều hành duy nhất 1 Active Settlement**: Người chơi dồn toàn bộ tâm trí và quyền quyết định vi mô vào thuộc địa hiện tại.
* **Ngưỡng Phồn Vinh & Bàn Giao (The Handoff)**: Khi thuộc địa đạt mức độ tự cung tự cấp và ổn định vững chắc, người chơi sẽ:
  1. Ban hành **Hiến Chương Sáng Lập (Founder Charter)**: Quy định đường hướng chính trị, pháp luật, và đạo đức lâu dài của vùng đất.
  2. Bổ nhiệm một Named NPC đáng tin cậy làm **Thống Đốc (Governor)**.
  3. Bàn giao thuộc địa trở thành **Legacy Settlement**: Thuộc địa này sẽ tự động vận hành trong nền dưới quyền của Governor AI theo đúng Hiến chương bạn đã lập.
* **Mở rộng Biên Cương**: Người chơi dẫn dắt một nhóm khai hoang tinh nhuệ mới tiếp tục tiến sâu vào biên cương hoang dã, xây dựng thuộc địa tiếp theo. Thuộc địa cũ sẽ trở thành đối tác thương mại, đồng minh bảo vệ, hoặc thậm chí là đối thủ cạnh tranh tùy thuộc vào mối quan hệ và chính sách bạn đã để lại.

### 2.2. Hệ Thống Dân Số 2 Tầng (Two-Tier Population)
* **Named NPC (Nhân vật cốt cán)**:
  * Được cá nhân hóa sâu sắc với tên riêng, tuổi tác, ngoại hình, số đo cơ thể, tính cách, chỉ số thể chất, và lịch sử ký ức.
  * Đóng vai trò là các chỉ huy, kỹ thuật viên trưởng, bác sĩ, quản lý nhà thổ, hoặc thiếp thất thân cận.
  * Tương tác qua **Hệ thống Quan hệ 8 Chiều** (*Trust, Respect, Affection, Fear, Debt, Lust, Obedience, Resentment*).
* **Population Cohort (Quần thể dân cư số đông)**:
  * Mô phỏng theo khối nhóm chức nghiệp: Công nhân thô sơ, Nông dân, Kỹ thuật viên, Lính bảo an, Thương nhân, Nô lệ lao dịch.
  * Quản lý qua các chỉ số bình quân: Sĩ khí (*Morale*), Năng suất (*Productivity*), Mức độ Bất mãn (*Resentment*), Tỷ lệ tiêu hao dinh dưỡng.

### 2.3. Ba Trục Thân Phận Độc Lập (3 Independent Axes)
Phá vỡ sự đơn giản hóa thường thấy ở game thông thường, xã hội của Haven tách biệt 3 khái niệm:
$$\text{Nghề nghiệp (Occupation)} \neq \text{Tầng lớp (Social Class)} \neq \text{Địa vị pháp lý (Legal Status)}$$

* **Nghề nghiệp (*Occupation*)**: Công việc cụ thể họ đang làm (Nông dân, Bác sĩ, Vũ nữ, Đấu sĩ, Giám thị, Thợ mỏ...).
* **Tầng lớp (*Social Class*)**: Vị thế xã hội và uy tín trong cộng đồng (Dưới đáy, Bình dân, Tay nghề cao, Quản lý hành chính, Tinh hoa quyền quý).
* **Địa vị pháp lý (*Legal Status*)**: Thân phận trước pháp luật (Công dân tự do, Cư dân tạm trú, Hợp đồng lao dịch, Tù nhân cải tạo, Nô lệ sở hữu).
* *Ý nghĩa thiết kế*: Một bác sĩ phẫu thuật tài năng có thể là một **Nô lệ** chịu quản chế gắt gao; ngược lại, một gã thợ mỏ thô lỗ có thể là một **Công dân tự do** có quyền biểu quyết trong hội đồng.

### 2.4. Hệ Thống Nhân Quả Minh Bạch (Explanation Layer - "WHY")
* Không có con số nào tăng giảm ngẫu nhiên mà không rõ nguyên cớ.
* Bất cứ biến động nào về tài nguyên, lòng trung thành hay nổi loạn đều được ghi lại trong nhật ký phân tích nhân quả:
  > *"Bất mãn của Khối Nông dân tăng +8% vì: Khẩu phần ăn bị cắt giảm 30% do thiếu Nước sạch, đồng thời tận mắt chứng kiến 2 lao dịch bị hành hình công khai."*

### 2.5. Chiều Sâu Cơ Chế 18+ (Kế thừa từ Free Cities & Pregmod)
Toàn bộ hệ thống 18+ từ *Free Cities* được tái cấu trúc thành một phần hữu cơ của mô phỏng kinh tế và quản trị nhân khẩu:
* **Thể chất chi tiết**: Ngoại hình, số đo 3 vòng, đặc điểm sinh lý, tình trạng trinh tiết, biến đổi cơ thể (xăm dấu, khuyên, phẫu thuật thẩm mỹ, cấy ghép).
* **Chu kỳ Sinh sản & Di truyền (Pregmod Core)**: Thụ thai, dưỡng thai, biến đổi hình thể theo tuần thai, sinh nở, di truyền phẩm chất cho thế hệ con cháu nối dõi thuộc địa.
* **Tâm lý thuần hóa & Tẩy não**: Quá trình chuyển hóa tâm lý giữa Phục tùng (*Obedience*), Tôn sùng (*Devotion*), Khiếp sợ (*Fear*) đối đầu với Vết thương tâm lý (*Trauma*).
* **Cơ sở hạ tầng 18+**: Nhà thổ sinh lời, Dinh thự lãnh chúa, Trại huấn luyện nô lệ, Viện nghiên cứu gen và dưỡng thai.

---

## 3. Định Hướng Nghệ Thuật & Thị Giác (Art Direction)

Sự kết hợp hài hòa giữa **Pixel Art cổ điển** và **AI Generated Art hiện đại**:

| Thành phần | Phong cách Đồ họa | Vai trò & Trải nghiệm |
| :--- | :--- | :--- |
| **Bản đồ Lãnh địa & Ô đất** | **Pixel Art (Top-down / Isometric)** | Thể hiện bố cục quy hoạch, nhà cửa, đường xá, kho tàng, cư dân di chuyển tí hon. Tạo cảm giác trực quan, nhẹ nhàng, hoài niệm. |
| **Biểu tượng & Giao diện** | **Pixel Art / Retro UI** | Icon tài nguyên (thức ăn, nước, tiền tệ, công cụ), các nút bấm điều khiển, huy hiệu lãnh địa. |
| **Chân dung Nhân vật (Portraits)** | **AI Generated Art (WebP)** | Chân dung bán thân (Bust portrait) chất lượng cao cho Named NPC. Hỗ trợ hệ thống ghép lớp (*Layered Avatar*): thay đổi trang phục, biểu cảm khuôn mặt, và bụng bầu. |
| **Minh họa Sự kiện (Event CG)** | **AI Generated Art (Illustrations)** | Các bức tranh minh họa toàn màn hình khi diễn ra các sự kiện 18+ hoặc cột mốc cốt truyện lớn (Đấu giá nô lệ, buổi tuyển thiếp, lễ tế thần, sinh con). |

---

## 4. Mô Hình Phân Phối Kép: Web Song Song Desktop (Dual Distribution)

Được xây dựng trên nền tảng **TypeScript + Svelte 5 + Vite**, trò chơi hướng tới phục vụ 2 nhóm người chơi cùng lúc:

1. **Bản Trình Duyệt Web (Web Browser Playable)**:
   - Chơi trực tiếp trên các nền tảng như itch.io hoặc máy chủ web tĩnh (Zero-install).
   - Tự động lưu tiến trình vào `IndexedDB` của trình duyệt.
   - Thích hợp cho người chơi trải nghiệm nhanh, chơi trên điện thoại/máy tính bảng hoặc máy tính cơ quan.
2. **Bản Tải Về Máy Tính (PC Offline Downloadable - giống Free Cities)**:
   - Cung cấp file `.zip` (mở `index.html` chạy offline hoàn toàn) hoặc đóng gói thành phần mềm `.exe` qua **Tauri**.
   - Lưu trữ trực tiếp file save vào ổ cứng máy tính cá nhân.
   - Hỗ trợ gói hình ảnh độ phân giải cao (Full HD / Uncensored Pack) và thư mục `custom_portraits/` để người chơi tự mod ảnh AI của riêng mình.
3. **Cơ chế Chuyển Đổi Save Chéo (Cross-save Interchangeability)**:
   - Hỗ trợ nút **"Xuất file lưu" (Export Save)** và **"Nhập file lưu" (Import Save)**.
   - Người chơi có thể xuất save từ bản Web mang về nạp vào bản PC để chơi tiếp, và ngược lại.

---

## 5. Triết Lý Thiết Kế: Siêu Nhẹ & Mở Hoàn Toàn Cho Modding (Lightweight & Modding-First)

Sức sống bất diệt của các tựa game như *Free Cities* hay *RimWorld* đến từ hai yếu tố sống còn:

### 5.1. Tối Ưu Siêu Nhẹ (Zero-Bloat)
* **Khởi động tức thì**: Dung lượng UI và mã nguồn nén chỉ vài chục KB. Game có thể mở lên trong chớp mắt ngay cả trên mạng 3G hoặc máy tính cấu hình văn phòng.
* **Bộ nhớ RAM cực thấp**: Chạy trên Desktop qua Tauri chỉ tiêu tốn 15–30MB RAM (so với 200MB+ của các ứng dụng Electron cồng kềnh).
* **Tối ưu hóa hình ảnh**: Toàn bộ đồ họa sử dụng Pixel Art nén và định dạng ảnh WebP thế hệ mới, tích hợp cơ chế nạp lười (*lazy-loading*) để đảm bảo không bao giờ giật lag.

### 5.2. Mở Toàn Diện Cho Cộng Đồng Modding (Modding-First)
Toàn bộ trò chơi được xây dựng theo kiến trúc **Data-Driven (Điều khiển bằng Dữ liệu)**:
* **Modding Chân dung AI (Cực dễ)**: Người chơi chỉ cần ném ảnh vào thư mục `mods/portraits/`, game sẽ tự động nhận diện và gán cho NPC mà không cần động vào mã nguồn.
* **Modding Kịch bản & Cơ chế (JSON Content)**: Mọi công trình, tài nguyên, sự kiện 18+, lời thoại và luật lệ đều được lưu dưới dạng file JSON trong sáng, dễ đọc. Bất kỳ ai cũng có thể tự tạo một kịch bản hoặc công trình 18+ mới chỉ bằng một trình soạn thảo văn bản đơn giản.
* **Hệ thống Điểm Móc (Event Hooks)**: Cung cấp các điểm can thiệp vào vòng lặp mô phỏng (`onDayTick`, `onIntimacy`, `onChildbirth`) để các modder nâng cao tự do mở rộng logic theo ý muốn.

