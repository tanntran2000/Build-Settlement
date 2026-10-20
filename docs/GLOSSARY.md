# Từ Điển Thuật Ngữ Chuẩn Hóa Anh - Việt (GLOSSARY.md)

> **Phạm vi 2026-10-20**: Các thuật ngữ thiết kế kế tiếp bên dưới không đổi enum, save hay runtime hiện có. [Thiết kế non-Law](design/SOCIAL-REQUIREMENTS-STATUS-DRAFT-01.md) ghi năm stock hiện hành/đích Wheat/Gold/Wood/Iron/Food; Goods là Requirement phục vụ theo tuần, không có inventory. Target sáu kho cũ đã được thay thế. Law / Civic Charter **DEFERRED**; các thuật ngữ pháp lý lịch sử không phải đặc tả triển khai mới.

> **Mục đích**: Chuẩn hóa toàn bộ thuật ngữ chuyên môn dùng trong mã nguồn (Interface, Enum, Biến) và văn bản hiển thị trong giao diện tiếng Việt của trò chơi, đảm bảo tính thống nhất tuyệt đối giữa bạn và các AI Agent.

---

## 1. Thuật Ngữ Vận Hành Lãnh Địa (Settlement & Governance)

| Thuật Ngữ Kỹ Thuật (Code / English) | Thuật Ngữ Hiển Thị (Tiếng Việt) | Định Nghĩa & Ngữ Cảnh |
| :--- | :--- | :--- |
| `Settlement` | **Lãnh Địa / Thuộc Địa** | Khu định cư có ranh giới và hệ thống kinh tế độc lập. |
| `Active Settlement` | **Lãnh Địa Trực Trị** | Thuộc địa duy nhất đang do Người chơi trực tiếp điều hành mọi hoạt động. |
| `Legacy Settlement` | **Lãnh Địa Di Sản** | Thuộc địa cũ sau khi đã bàn giao cho Thống Đốc AI tự động vận hành trong nền. |
| `Founder Charter` | **Hiến Chương Sáng Lập** | Bản hiến pháp tối thượng quy định thể chế, luật pháp và chính sách đạo đức của thuộc địa. |
| `Governor` | **Thống Đốc** | Named NPC được người chơi tin cậy bổ nhiệm để cai trị Lãnh Địa Di Sản. |
| `Handoff` | **Bàn Giao Quyền Lực** | Hành động chuyển giao Lãnh địa Trực trị thành Lãnh địa Di sản để khai hoang vùng đất mới. |
| `Day Tick` | **Nhịp Ngày / Tiến Ngày Mới** | Chu kỳ thời gian mô phỏng tính toán kinh tế, biến động tâm lý và thai kỳ hàng ngày. |
| `Audit Trail ("WHY")` | **Nhật Ký Nhân Quả** | Hệ thống ghi nhận chi tiết nguyên nhân gốc rễ dẫn đến mọi biến động chỉ số trong game. |

---

## 2. Nhân Khẩu & Ba Trục Thân Phận (Population & 3 Axes)

| Thuật Ngữ Kỹ Thuật (Code / English) | Thuật Ngữ Hiển Thị (Tiếng Việt) | Định Nghĩa & Ngữ Cảnh |
| :--- | :--- | :--- |
| `Named NPC` | **Nhân Vật Cốt Cán** | Cá nhân có tên riêng, số đo, tâm lý phức tạp và mối quan hệ cá nhân sâu sắc. |
| `Population Cohort` | **Quần Thể Dân Cư** | Khối cư dân số đông được quản lý theo nhóm ngành nghề và chỉ số bình quân. |
| `Occupation` | **Nghề Nghiệp** | Chức danh công việc thực tế (Công nhân, Kỹ sư, Bác sĩ, Đấu sĩ, Kỹ nữ...). |
| `Social Class` | **Tầng Lớp Xã Hội** | Schema/runtime hiện có: Dưới đáy, Bình dân, Thợ lành nghề, Quản trị, Tinh hoa. Không ánh xạ một-một sang ba nhóm thiết kế mới. |
| Social group (planned) | **Nhóm Xã Hội (dự kiến)** | Đúng 3 nhóm: labor; intellectual/scientific; merchants. Chưa gán membership hoặc số dân runtime. |
| The Makers’ Union / Makers | **Nhóm Lao Động** | Tên đầy đủ đề xuất / nhãn UI; sản xuất, xây dựng, bảo trì. |
| The Luminary Circle / Luminaries | **Nhóm Tri Thức / Khoa Học** | Tên đầy đủ đề xuất / nhãn UI; nghiên cứu, giáo dục, quy hoạch, tiêu chuẩn kỹ thuật. |
| The Mercantile League / Merchants | **Nhóm Thương Nhân** | Tên đầy đủ đề xuất / nhãn UI; thương mại, phân phối. Không có tham nhũng bẩm sinh hoặc cơ chế giao thương mới trong gói này. |
| `Legal Status` | **Địa Vị Pháp Lý** | Thân phận pháp lý (Công dân, Cư dân tự do, Lao động hợp đồng, Tù nhân, Nô lệ). |
| `Enslaved` | **Nô Lệ Hóa / Nô Lệ Sở Hữu**| Địa vị pháp lý bị tước đoạt quyền tự do và coi là tài sản sở hữu. |
| `Citizen` | **Công Dân Chính Thức** | Cư dân tự do có đầy đủ quyền lợi chính trị, hôn nhân và tư pháp. |
| `Contract Bound` | **Lao Động Hợp Đồng** | Cá nhân bị ràng buộc thời hạn phục vụ để trả nợ hoặc đổi lấy quyền định cư. |

---

## 3. Tâm Lý Học & Quan Hệ 8 Chiều (Psychology & 8D Relationships)

| Thuật Ngữ Kỹ Thuật (Code / English) | Thuật Ngữ Hiển Thị (Tiếng Việt) | Định Nghĩa & Ngữ Cảnh |
| :--- | :--- | :--- |
| `trust` | **Tin Cậy** | Niềm tin rằng đối phương sẽ không bội phản hoặc hãm hại mình. |
| `affection` | **Yêu Mến / Tình Cảm** | Mức độ gắn kết cảm xúc cá nhân thân thiết. |
| `attraction` | **Sức Hút / Hấp Dẫn Thể Xác**| Mức độ lôi cuốn tình dục và khao khát thân xác đối phương. |
| `respect` | **Tôn Trọng** | Sự kính phục trước năng lực, bản lĩnh hoặc tài năng của người khác. |
| `fear` | **Sợ Hãi / Khiếp Sợ** | Nỗi sợ trước bạo lực, trừng phạt hoặc quyền lực tối thượng. |
| `resentment` | **Bất Mãn / Uất Hận** | Sự căm phẫn tích tụ do bị áp bức, bóc lột hoặc đối xử bất công. |
| `dependency` | **Lệ Thuộc / Phụ Thuộc** | Mức độ phụ thuộc về kinh tế, bảo bọc hoặc chỗ dựa tâm lý. |
| `familiarity` | **Quen Thuộc** | Mức độ hiểu biết, thời gian tiếp xúc và gần gũi giữa hai bên. |
| `willpower` | **Ý Chí Kháng Cự** | Sức mạnh tinh thần chống lại sự quy phục và áp chế. |
| `trauma` | **Chấn Thương Tâm Lý** | Vết thương lòng sâu sắc do bạo lực hoặc ngược đãi gây ra. |
| `Stockholm Devotion` | **Sùng Kính Stockholm** | Trạng thái lệ thuộc tâm lý và sùng kính kẻ giam cầm mình sau quá trình ân uy song hành. |
| `Memory Decay` | **Phai Mờ Ký Ức** | Tỷ lệ giảm dần ảnh hưởng cảm xúc của ký ức theo thời gian. |

---

## 4. Giải Phẫu Cơ Thể & Hệ Sinh Thái 18+ (Anatomy & Free Cities Mechanics)

| Thuật Ngữ Kỹ Thuật (Code / English) | Thuật Ngữ Hiển Thị (Tiếng Việt) | Định Nghĩa & Ngữ Cảnh |
| :--- | :--- | :--- |
| `Anatomy` | **Giải Phẫu / Cơ Thể Học** | Tập hợp các thông số đo đạc vóc dáng, số đo 3 vòng và đặc điểm sinh học. |
| `Beauty Score` | **Điểm Nhan Sắc / Dung Mạo** | Thang điểm đánh giá độ quyến rũ thị giác tự nhiên. |
| `Virginity` | **Trinh Tiết** | Tình trạng còn trinh hay đã mất trên từng khía cạnh (miệng, âm đạo, hậu môn). |
| `Fertility` | **Độ Màu Mỡ Sinh Sản** | Xác suất thụ thai thành công trong quan hệ tình dục. |
| `Gestation` | **Thai Kỳ / Quá Trình Mang Thai**| Tiến trình phát triển của bào thai từ khi thụ tinh đến lúc chuyển dạ. |
| `Trimester` | **Tam Cá Nguyệt** | Giai đoạn thai kỳ (3 tháng đầu, 3 tháng giữa, 3 tháng cuối). |
| `Lactation` | **Tiết Sữa Mẹ** | Khả năng và sản lượng sản xuất sữa tự nhiên của cơ thể. |
| `Breeding Program` | **Chương Trình Nhân Giống** | Kế hoạch quy hoạch sinh sản có chọn lọc trong lãnh địa. |
| `Collar` | **Vòng Cổ Nô Dịch** | Biểu tượng vật lý của quyền sở hữu chủ - tớ. |
| `Conditioning` | **Thuần Hóa / Rèn Luyện Tâm Lý** | Quá trình uốn nắn, kỷ luật và biến đổi ý thức của nhân vật. |
| `Kink / Fetish` | **Sở Thích Tình Dục / Thiên Hướng**| Thiên hướng khoái cảm đặc thù (khổ dâm, thích phục tùng, thích mang thai...). |

---

## 5. Kinh Tế & Cơ Sở Hạ Tầng (Economy & Facilities)

Thiết kế hiện hành — [Goods flow đã duyệt, chưa mô phỏng](design/TENSION-CRISIS-GOLD-DECISIONS-01.md#goods-requirement-flow--later-approved-clarification). Food và Goods là Requirements; Goods không có inventory. Target sáu kho cũ đã được thay thế:

| Thuật Ngữ Thiết Kế | Tiếng Việt | Ranh Giới |
| :--- | :--- | :--- |
| Physical inventory | Kho vật lý | Năm loại hiện hành/đích: Wheat/Gold/Wood/Iron/Food, khớp năm stock Weekly. Không có kho Goods; Food runtime không đổi tên thành Wheat. |
| Wheat / Gold / Wood / Iron | Lúa mì / Vàng / Gỗ / Sắt | Bốn đầu vào dự kiến cho xây dựng/sản xuất; recipe, cost và nguồn Gold chưa chốt. |
| Food inventory / Goods service | Kho Food / Phục vụ Goods | Food là thành phẩm chế biến từ Wheat qua building, có thể cùng tuần thu hoạch. Goods là phần nhu cầu building đáp ứng từ Wood/Iron một lần mỗi tuần, giới hạn bởi capacity Market; không có thành phẩm Goods để cất kho/bán theo đơn vị. |
| City-wide Requirements: Food / Goods | Nhu cầu thực phẩm / hàng hóa toàn thành phố | Food trial theo rulebook; Goods demand = tổng dân × định mức chưa chốt, fulfillment % = phần phục vụ / nhu cầu × 100% khi nhu cầu > 0. Market giới hạn phục vụ, không tăng demand. Gold/Happiness dùng cùng kết quả tuần; hệ số và edge rules còn pending. |
| City Status: Happiness / Security / Corruption / Tension | Hạnh phúc / An ninh / Tham nhũng / Căng thẳng | Bốn Status chung thành phố, miền thiết kế 0–100; Food/Tension trial và các interface còn mở theo rulebook/decision record. Gói Goods không đổi công thức hoặc ngưỡng đã duyệt. |

Các thuật ngữ kinh tế và công trình lịch sử:

| Thuật Ngữ Kỹ Thuật (Code / English) | Thuật Ngữ Hiển Thị (Tiếng Việt) | Định Nghĩa & Ngữ Cảnh |
| :--- | :--- | :--- |
| `Arcade / Brothel` | **Nhà Thổ / Khu Giải Trí** | Cơ sở kinh doanh dịch vụ xác thịt, mang lại ngân khố và giải tỏa bất mãn cư dân. |
| `Master Quarters` | **Dinh Thự Lãnh Chúa** | Khu vực sinh hoạt và phòng riêng của Người chơi để tương tác thân mật với NPC. |
| `Conditioning Center` | **Trại Huấn Luyện Nô Lệ** | Cơ sở chuyên trách tẩy não và bẻ gãy ý chí kháng cự của tù nhân. |
| `Breeding Nursery` | **Viện Dưỡng Thai & Nhân Giống**| Cơ sở chăm sóc y tế cho thai phụ và trẻ sơ sinh trong thuộc địa. |
| `Treasury` | **Ngân Khố Lãnh Địa** | Nguồn tiền tệ và vàng bạc tích lũy để chi trả lương và nhập khẩu hàng hóa. |
| `Morale` | **Sĩ Khí** | Tinh thần phấn chấn và sẵn sàng cống hiến của khối dân cư. |
| `Productivity` | **Năng Suất Lao Động** | Hiệu quả sản xuất đầu ra của công nhân và nông dân. |
