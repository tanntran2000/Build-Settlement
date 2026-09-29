# Bách Khoa Toàn Thư Cơ Chế Trò Chơi (ENCYCLOPEDIA_MECHANICS.md)

> **Mục đích**: Tài liệu này là bách khoa toàn thư chi tiết, giải thích toàn bộ nguyên lý vận hành, thông số toán học và cơ chế gameplay của **Haven: Sovereign Frontier**, kế thừa và chuẩn hóa toàn bộ hệ sinh thái cơ chế 18+ từ *Free Cities* và *Pregmod*.

---

## Mục Lục
1. [Chương 1: Ba Trục Thân Phận & Trật Tự Xã Hội](#chương-1-ba-trục-thân-phận--trật-tự-xã-hội)
2. [Chương 2: Tâm Lý Nhân Vật, Quan Hệ 8 Chiều & Ký Ức](#chương-2-tâm-lý-nhân-vật-quan-hệ-8-chiều--ký-ức)
3. [Chương 3: Giải Phẫu Cơ Thể & Thể Chất 18+ (Anatomy System)](#chương-3-giải-phẫu-cơ-thể--thể-chất-18-anatomy-system)
4. [Chương 4: Sinh Học & Chu Kỳ Thai Sản (Pregmod Core)](#chương-4-sinh-học--chu-kỳ-thai-sản-pregmod-core)
5. [Chương 5: Tâm Lý Thuần Hóa & Kỷ Cương (FC Conditioning)](#chương-5-tâm-lý-thuần-hóa--kỷ-cương-fc-conditioning)
6. [Chương 6: Cơ Sở Hạ Tầng 18+ & Kinh Tế Lãnh Địa](#chương-6-cơ-sở-hạ-tầng-18--kinh-tế-lãnh-địa)
7. [Chương 7: Hiến Chương, Thể Chế & Bàn Giao Thuộc Địa (Handoff Loop)](#chương-7-hiến-chương-thể-chế--bàn-giao-thuộc-địa-handoff-loop)

---

## Chương 1: Ba Trục Thân Phận & Trật Tự Xã Hội

Mọi cá nhân trong xã hội của Haven được định danh bởi 3 trục độc lập:

### 1.1. Trục 1: Nghề Nghiệp (Occupation)
Xác định chức năng lao động cụ thể của cá nhân trong bộ máy lãnh địa:
* **Sản xuất & Kỹ thuật**: `worker` (Công nhân), `farmer` (Nông dân), `technician` (Kỹ thuật viên), `engineer` (Kỹ sư).
* **Quản trị & An ninh**: `manager` (Quản lý), `doctor` (Bác sĩ), `security` (Lính bảo an), `warden` (Giám thị trại giam).
* **Phục vụ & Giải trí (18+)**: `entertainer` (Vũ nữ/Nghệ sĩ), `courtesan` (Kỹ nữ/Kỹ nam), `concubine` (Ái thiếp), `breeder` (Cá nhân chuyên trách sinh sản).

### 1.2. Trục 2: Tầng Lớp Xã Hội (Social Class)
Phản ánh uy thế, đặc quyền xã hội và mức độ tôn trọng mà cộng đồng dành cho họ:
* `lower` (Tầng lớp dưới đáy): Lao động thô sơ, thường bị xem nhẹ, tiêu chuẩn sống tối thiểu.
* `common` (Bình dân): Cư dân phổ thông, có tiếng nói nhất định trong các cuộc họp lãnh địa.
* `skilled` (Thợ lành nghề & Chuyên gia): Kỹ thuật viên, thầy thuốc, đóng vai trò sống còn cho sự phát triển.
* `administrative` (Quản lý hành chính): Các thủ lĩnh nhóm, giám thị, trợ lý thân cận của Lãnh chúa.
* `elite` (Giới tinh hoa quyền quý): Thống đốc, cố vấn tối cao, thành viên hoàng gia/gia tộc sáng lập.

### 1.3. Trục 3: Địa Vị Pháp Lý (Legal Status)
Xác định quyền con người trước bộ luật của lãnh địa:
* `citizen` (Công dân chính thức): Hưởng đầy đủ quyền tự do, bảo hộ tư pháp, có quyền kết hôn và sở hữu tài sản.
* `free_resident` (Cư dân tự do tạm trú): Người nhập cư hoặc thương nhân vãng lai, được tự do đi lại nhưng không có quyền chính trị.
* `contract_bound` (Lao động hợp đồng): Bị ràng buộc thời hạn phục vụ để trả nợ hoặc đổi lấy điều kiện định cư.
* `enslaved` (Nô lệ sở hữu): Bị coi là tài sản của Lãnh chúa hoặc lãnh địa, không có quyền cá nhân, phải phục tùng mọi mệnh lệnh.
* `prisoner` (Tù nhân cải tạo): Phạm nhân chiến tranh hoặc tội phạm đang chịu thi hành án phạt.

---

## Chương 2: Tâm Lý Nhân Vật, Quan Hệ 8 Chiều & Ký Ức

### 2.1. Ma Trận Quan Hệ 8 Chiều (8-Dimensional Relationship)
Mối quan hệ giữa hai nhân vật (hoặc giữa NPC với Lãnh chúa) được đo lường độc lập trên thang điểm $(-100 \rightarrow +100)$ hoặc $(0 \rightarrow 100)$:

1. **Trust (Tin cậy)**: Mức độ tin tưởng đối phương sẽ không phản bội hoặc hãm hại mình.
2. **Respect (Tôn trọng)**: Đánh giá cao năng lực, tài năng và phẩm chất lãnh đạo của đối phương.
3. **Affection (Yêu mến / Tình cảm)**: Mức độ gắn bó cảm xúc cá nhân, từ thù ghét đến tình yêu sâu đậm.
4. **Fear (Sợ hãi)**: Khiếp sợ trước quyền lực, bạo lực hoặc hình phạt tàn khốc của đối phương.
5. **Debt (Ân nợ)**: Cảm giác mang ơn vì đã được cứu mạng, cưu mang hoặc ban tặng đặc ân.
6. **Lust (Dục vọng)**: Sự hấp dẫn mãnh liệt về mặt thể xác và ham muốn tình dục.
7. **Obedience (Phục tùng)**: Mức độ sẵn sàng làm theo mệnh lệnh mà không cần chất vấn.
8. **Resentment (Bất mãn / Uất hận)**: Sự căm phẫn tích tụ do bị áp bức, bóc lột hoặc ngược đãi.

### 2.2. Hệ Thống Ký Ức Động (Dynamic Memory System)
* Nhân vật không chỉ lưu trữ chỉ số vô hồn mà ghi nhớ các sự kiện quan trọng trong đời.
* Mỗi `MemoryEntry` gồm: Thời điểm diễn ra, loại sự kiện (`trauma`, `favor`, `betrayal`, `intimacy`, `achievement`), mức độ tác động cảm xúc, và thời gian phai mờ (*decay rate*).
* Ký ức sâu đậm (như *Bị cưỡng bức*, *Được cứu sống lúc thập tử nhất sinh*, *Sinh đứa con đầu lòng*) sẽ trở thành **Ký Ức Cốt Lõi (Core Memory)** vĩnh viễn không phai mờ, định hình tính cách nhân vật đến suốt đời.

---

## Chương 3: Giải Phẫu Cơ Thể & Thể Chất 18+ (Anatomy System)

Kế thừa mô hình giải phẫu chi tiết của *Free Cities*, mỗi Named NPC có bộ thông số sinh học hoàn chỉnh:

### 3.1. Số Đo & Ngoại Hình Tự Nhiên
* **Vóc dáng cơ bản**: Chiều cao (cm), Cân nặng (kg), Tạng người (`petite`, `athletic`, `curvy`, `voluptuous`, `muscular`, `slender`).
* **Số đo 3 vòng**:
  * **Vòng 1 (Bust)**: Kích cỡ cúp ngực (`flat`, `A`, `B`, `C`, `D`, `DD`, `E`, `F+`), độ săn chắc.
  * **Vòng 2 (Waist)**: Vòng eo, tỷ lệ thắt đáy lưng ong.
  * **Vòng 3 (Hips & Butt)**: Kích thước mông và độ rộng khung xương chậu (ảnh hưởng trực tiếp đến độ an toàn khi sinh con).
* **Nhan sắc (Beauty Score)**: Thang điểm $(0 \rightarrow 100)$ quyết định sức hút thị giác và giá trị thương mại/ngoại giao.
* **Bộ phận nhạy cảm**: Cấu tạo cơ quan sinh dục, tình trạng trinh tiết (*virginity status* trên từng phương diện: oral, vaginal, anal), kinh nghiệm phòng the.

### 3.2. Biến Đổi Cơ Thể & Công Nghệ (Modifications)
* **Dấu ấn định danh (Branding & Tattoos)**: Dấu nung nô lệ gia tộc, hình xăm thể hiện cấp bậc hoặc quyền sở hữu của Lãnh chúa.
* **Xỏ khuyên (Piercings)**: Xỏ khuyên tai, mũi, rốn, nhũ hoa, hoặc vùng kín (tăng tính phục tùng hoặc độ nhạy cảm).
* **Vòng cổ nô dịch (Collar)**: Biểu tượng tuyệt đối của sự sở hữu (từ vòng da đơn sơ đến vòng kim loại khóa mã số).
* **Phẫu thuật thẩm mỹ & Cấy ghép (Cybernetics & Surgeries)**: Nâng ngực, thu nhỏ eo, cấy ghép thiết bị kích thích hoặc bộ phận tăng lực sinh học.

---

## Chương 4: Sinh Học & Chu Kỳ Thai Sản (Pregmod Core)

Hệ thống mô phỏng sinh sản nhiều thế hệ kế thừa từ *Pregmod*:

### 4.1. Khả Năng Thụ Thai & Chu Kỳ Rụng Trứng
* **Fertility (Độ màu mỡ)**: Thang điểm $(0 \rightarrow 100)$, phụ thuộc vào tuổi tác, sức khỏe, mức độ căng thẳng, và các loại thuốc điều trị.
* **Chu kỳ thụ thai**: Thay đổi theo ngày trong tháng; xác suất mang thai đạt đỉnh điểm vào ngày rụng trứng khi diễn ra quan hệ xuất tinh trong.

### 4.2. Tiến Trình Thai Kỳ Theo Ngày (Gestation Lifecycle)
Một chu kỳ thai kỳ chuẩn kéo dài khoảng **40 tuần mô phỏng** (được co ngắn lại theo tỷ lệ thời gian của game, ví dụ: 40 ngày tick):
* **Tam cá nguyệt thứ nhất (Tuần 1–13)**: Ốm nghén, thay đổi tâm trạng, chưa lộ bụng, năng suất làm việc giảm nhẹ (10%).
* **Tam cá nguyệt thứ hai (Tuần 14–27)**: Bụng bắt đầu nhô rõ (*baby bump*), bắt đầu tiết sữa non (*colostrum*), năng suất lao động chân tay giảm 30%, tăng nhu cầu dinh dưỡng.
* **Tam cá nguyệt thứ ba (Tuần 28–40)**: Bụng căng tròn nặng nề, di chuyển chậm chạp, ngừng làm việc nặng, phải chuyển vào Viện dưỡng thai hoặc nghỉ ngơi tại gia.

### 4.3. Sự Kiện Sinh Nở & Di Truyền Học (Childbirth & Genetics)
* **Chuyển dạ (Labor)**: Tỷ lệ an toàn phụ thuộc vào kích thước khung chậu của người mẹ, trình độ của Bác sĩ đỡ đẻ, và cơ sở y tế.
* **Di truyền học (Genetics Inheritance)**:
  * Đứa trẻ sinh ra nhận 50% đặc điểm từ người cha và 50% từ người mẹ (màu tóc, màu mắt, cấu trúc xương, tài năng thiên bẩm, bệnh lý di truyền).
  * Đứa trẻ được tự động ghi nhận vào sổ hộ tịch của lãnh địa với tư cách là thế hệ F1/F2.
* **Sản lượng Sữa mẹ (Lactation)**: Sau sinh, người mẹ bước vào giai đoạn tiết sữa liên tục, có thể khai thác làm thực phẩm dinh dưỡng đặc biệt hoặc sản xuất dược phẩm bồi bổ.

---

## Chương 5: Tâm Lý Thuần Hóa & Kỷ Cương (FC Conditioning)

Cơ chế quyền lực và chuyển hóa tâm lý giữa Lãnh chúa và đối tượng bị quản chế:

### 5.1. Bốn Chỉ Số Tâm Lý Rèn Luyện
* **Obedience (Phục tùng)**: Đo lường mức độ tuân lệnh bất kể bản thân có thích hay không.
* **Devotion (Tôn sùng)**: Tình nguyện cống hiến trọn vẹn cả linh hồn và thể xác cho Lãnh chúa, coi ý chí của Lãnh chúa là chân lý sống.
* **Fear (Sợ hãi)**: Khiếp đảm đòn roi, hình phạt hoặc cái chết, khiến đối tượng không dám manh động phản kháng.
* **Willpower (Ý chí kháng cự)**: Năng lượng tinh thần để chống lại mệnh lệnh và duy trì lòng tự tôn cá nhân.

### 5.2. Quá Trình Thuần Hóa: Chấn Thương vs. Lệ Thuộc (Trauma vs. Stockholm)
* **Phương pháp Bạo lực & Áp chế**:
  * Đánh đập, giam cầm, nhục hình công khai: Tăng nhanh *Fear* và *Obedience* ngắn hạn, làm hao mòn *Willpower*.
  * *Hệ quả tiêu cực*: Tăng vọt chỉ số *Resentment* (Uất hận) và tạo ra *Trauma* (Chấn thương tinh thần). Khi *Resentment* vượt quá ngưỡng chịu đựng, đối tượng sẽ cố gắng trốn chạy, ám sát Lãnh chúa hoặc tự sát.
* **Phương pháp Ân Uy Song Hành (Stockholm Transformation)**:
  * Kết hợp răn đe nghiêm khắc với ban phát đặc ân bất ngờ (thức ăn ngon, quần áo đẹp, bảo vệ trước kẻ thù, lời khen ngợi âu yếm).
  * Làm suy sụp ý chí phản kháng và dần biến chuyển đối tượng sang trạng thái **Hội chứng Stockholm**: Bắt đầu đồng cảm, biết ơn và tôn sùng kẻ giam cầm mình (*Devotion* tăng cao). Khi *Devotion* $> 80$, đối tượng trở nên tuyệt đối trung thành, sẵn sàng lấy thân mình che tên đỡ đạn cho Lãnh chúa.

### 5.3. Sở Thích & Thiên Hướng Tình Dục (Kinks & Fetishes)
Nhân vật có thể sở hữu hoặc được khai mở các thiên hướng đặc biệt qua trải nghiệm:
* `submissive`: Hưng phấn khi bị chi phối, sai khiến và phục tùng.
* `dominant`: Thích nắm quyền kiểm soát và chi phối người khác.
* `masochist`: Tìm thấy khoái cảm trong đau đớn và trừng phạt.
* `exhibitionist`: Thích được phơi bày thân thể và thu hút sự chú ý.
* `breeding_fetish`: Khát khao mãnh liệt được thụ thai và sinh con cho chủ nhân.

---

## Chương 6: Cơ Sở Hạ Tầng 18+ & Kinh Tế Lãnh Địa

Các công trình chuyên biệt đóng vai trò trụ cột trong chuỗi cung ứng và điều hòa xã hội:

### 6.1. Nhà Thổ Lãnh Địa (Arcade / Brothel)
* **Chức năng**: Nơi bố trí các nữ nô lệ hoặc nhân viên dịch vụ phục vụ nhu cầu sinh lý của cư dân và thương đoàn vãng lai.
* **Tác động Kinh tế**:
  * Tạo nguồn thu Ngân khố (*Treasury*) cực lớn mỗi ngày.
  * Giảm mạnh mức độ Bất mãn (*Resentment*) và tăng Sĩ khí (*Morale*) cho khối Công nhân và Lính bảo an.
* **Rủi ro**: Nguy cơ lây lan bệnh dịch, suy giảm sức khỏe của nhân viên nếu không được trang bị y tế đầy đủ.

### 6.2. Dinh Thự Lãnh Chúa (Master Quarters)
* **Chức năng**: Khu vực sinh hoạt riêng tư tối cao của Lãnh chúa, nơi bố trí phòng ngủ xa hoa, phòng tắm hơi và các phòng giam giữ đặc biệt.
* **Tương tác**: Nơi Lãnh chúa trực tiếp triệu kiến các ái thiếp, sủng thiếp hoặc nô lệ ưa thích để thẩm vấn, ân ái, huấn luyện tâm lý, hoặc thưởng thức tài nghệ.

### 6.3. Trại Huấn Luyện Nô Lệ (Conditioning Camp)
* **Chức năng**: Tẩy não và huấn luyện kỷ luật cho các tù nhân mới bắt được hoặc cư dân nổi loạn.
* **Hiệu ứng**: Tăng tốc độ tăng *Obedience*, bẻ gãy *Willpower*, chuẩn bị nhân lực phân bổ vào các xưởng lao động hoặc cơ sở phục vụ.

### 6.4. Viện Dưỡng Thai & Nhân Giống (Breeding Nursery)
* **Chức năng**: Chăm sóc y tế toàn diện cho các thai phụ trong lãnh địa, nghiên cứu chọn lọc phôi thai và tối ưu hóa dinh dưỡng cho trẻ sơ sinh.
* **Hiệu ứng**: Giảm tỷ lệ tử vong khi sinh nở về 0%, tăng xác suất di truyền các phẩm chất tốt cho thế hệ F1/F2.

---

## Chương 7: Hiến Chương, Thể Chế & Bàn Giao Thuộc Địa (Handoff Loop)

### 7.1. Hiến Chương Sáng Lập (Founder Charter)
Trước khi bàn giao thuộc địa, người chơi ban hành Hiến chương thiết lập 3 bộ luật tối thượng:
1. **Luật Lao Động & Thân Phận**: Cho phép duy trì chế độ nô lệ vĩnh viễn, hay quy định nô lệ có thể chuộc thân sau một thời gian lao dịch hợp đồng?
2. **Chính Sách Tình Dục & Hôn Nhân**: Quyền sở hữu thân xác phụ nữ thuộc về ai? Hôn nhân tự do hay nhân giống có quy hoạch?
3. **Chính Sách Phân Phối Của Cải**: Mô hình thị trường tự do, quân phiệt thu vén, hay chia đều tài nguyên công cộng?

### 7.2. Bổ Nhiệm Thống Đốc (Governor Appointment) & Bàn Giao (Handoff)
* Người chơi lựa chọn một Named NPC có chỉ số Quản lý cao và độ Tin cậy (*Trust*) cao làm Thống Đốc.
* Khi nhấn nút **Bàn Giao (Handoff)**, quyền điều hành trực tiếp kết thúc. Thuộc địa trở thành **Legacy Settlement**.
* Dưới sự điều hành của Governor AI, thuộc địa cũ sẽ tự động mô phỏng trong nền (tạo ra hàng hóa xuất khẩu, cống nộp tiền bạc về cho người chơi, hoặc tự mở rộng phòng thủ).
* **Bốn Quỹ Đạo Phát Triển Của Thuộc Địa Cũ**:
  * `loyal_legacy` (Thuộc địa trung thành): Liên tục gửi viện trợ và binh lực cho Lãnh chúa.
  * `free_settlement` (Thuộc địa tự do): Tự chủ kinh tế, chỉ giữ quan hệ ngoại giao thương mại bình đẳng.
  * `rival_aligned` (Thuộc địa ngả phe đối thủ): Thống đốc bất mãn ly khai, cạnh tranh tài nguyên với người chơi.
  * `hostile_successor` (Thuộc địa thù địch): Nổi loạn lật đổ trật tự cũ, trở thành mối đe dọa quân sự cần trấn áp.
