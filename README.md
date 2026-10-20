# Haven: Sovereign Frontier

**Dựng một nơi trú ẩn. Gây dựng một cộng đồng. Để những lựa chọn của bạn tạo nên câu chuyện.**

Haven: Sovereign Frontier là dự án game quản lý lãnh địa và tường thuật hậu tận thế đang được phát triển. Giữa một thế giới đổ vỡ, thực phẩm, nước sạch và nơi ở chỉ là khởi đầu. Điều khó hơn là tổ chức công việc, lựa chọn người để tin tưởng và xây dựng một cộng đồng có thể đứng vững trước những thay đổi.

---

## Trải nghiệm chúng tôi đang hướng tới

### Quản lý con người, không chỉ tài nguyên
Một quyết định về công việc hay điều kiện sống có thể ảnh hưởng đến cả một cộng đồng. Dự án hướng tới việc kết nối nhân vật, nguồn lực và sự phát triển của lãnh địa trong cùng một vòng chơi.

### Những lựa chọn có nguyên nhân và hệ quả
Không chỉ biết một chỉ số tăng hay giảm, người chơi cần hiểu điều gì đã dẫn đến thay đổi đó. Khả năng quan sát và giải thích kết quả (Explanation Layer) là một trọng tâm của thiết kế.

### Tường thuật dễ đọc, có chiều sâu để khám phá
Văn bản là phần cốt lõi của trải nghiệm. Hình ảnh pixel art và chuyển động nhỏ được định hướng làm lớp hỗ trợ, thay vì thay thế câu chuyện hoặc quyết định của người chơi.

---

## Trạng thái hiện tại

**Early prototype — chưa phải bản game hoàn chỉnh.**

Mặc định bản dành cho người chơi mở **Weekly Management (classic)**: phân công Farm Field → End Week → báo cáo WHY → Plan next week. `/`, `?mode=weekly`, `?mode=r1` và query không nhận diện đều mở Weekly. Prototype R1 ngày được giữ riêng để kiểm hồi quy, không nằm trong artifact dành cho người chơi.

Runtime Weekly classic là thử nghiệm chuỗi **Farm → Wheat → Food Processor → Food**, có 5 kho live **Gold/Wheat/Food/Wood/Iron**. Một Farm và một Food Processor operational có sẵn; chưa có cơ chế xây dựng. World mới khởi tạo Gold10/Wheat0/Food4/Wood0/Iron0, cohort hiện có cho 10 WF dùng chung. Reload reset game; chưa save/load/migration. Thiết kế Goods mới giữ Goods là Requirement theo % phục vụ mỗi tuần, không phải loại inventory thứ sáu: building dùng Wood/Iron một lần, giới hạn bởi capacity Market; nhu cầu theo tổng dân × định mức chưa chốt. Cùng kết quả phục vụ đóng góp Gold/Happiness, không trừ nguyên liệu lần hai. Recipe, định mức/capacity/hệ số và edge rules còn pending. Ba nhóm xã hội, Requirements Food/Goods, Status và Law chưa mô phỏng.

### Playable tile/building trial — tham số mới là TRIAL

Mở **`/?mode=tiles`** hoặc chọn **Play tile building trial** từ Weekly. Chọn tile để xây, nâng cấp, thay thế, giao WF và pause/resume; Farm/Processor có sẵn. Logging Camp khai thác Wood trên forest, Iron Mine khai thác Iron trên ore. Workshop dùng Wood/Iron phục vụ Goods Requirement qua capacity Market; **không có kho Goods**, không tăng nhu cầu khi nâng Market và không thu/trừ nguyên liệu hai lần. Mọi giao dịch lỗi giữ nguyên state; report khóa thao tác tới Plan next week.

Để thử chuỗi bền vững: xây Logging Camp tại forest-1 (2 WF), Mine tại ore-1 (1 WF), Workshop tại plain-2 (1 WF), Market tại plain-3; giữ Farm/Processor 2 WF mỗi nơi rồi End Week. Báo cáo có tax, upkeep, Goods, Food consumption và Happiness. Tax tối giản cùng pause giúp hồi phục khi thiếu Gold. Các chi phí, thuế, sản lượng khai thác, service, Market capacity, Goods revenue/Happiness và chính sách upgrade/replace đều là **lựa chọn triển khai TRIAL, chưa phải balance được user duyệt**; chỉnh tại `packages/core/src/trial/catalog.ts`.

Mode này dùng cùng công thức Farm/Processor và Food/Happiness đã ghi nhận, nhưng **chỉ là lát cắt playable**: chưa tích hợp Flourishing/Faltering, Tension/crisis/game-over, Security/Corruption, membership ba nhóm, Law, trade engine, explore/combat, asset pixel hoặc save/load/migration. R1 và classic giữ dispatcher/fixture riêng; mỗi mode chỉ mount một world/một clock. Reload reset. [Spec và chính sách TRIAL](docs/superpowers/specs/2026-10-20-weekly-tile-buildings-trial.md).

### Công thức Weekly classic đã duyệt — chưa phải balance chính thức

**1 stock hiển thị = 1000 milli; 1 WF = 1000 milli-WF.** Chỉ phân công WF nguyên, mỗi công trình 0–5 WF = 0–5 mẻ/tuần; tổng hai phân công không vượt WF thực từ cohort. WF đã giao nhưng thiếu đầu vào không tự chuyển sang công trình khác.

| Công trình | Một mẻ | Thứ tự |
| --- | --- | --- |
| Farm Field | 1 WF + 1 Gold → 2 Wheat | Thu hoạch trước, tối đa 5 mẻ/tuần |
| Food Processor | 1 WF + 2 Wheat → 2 Food | Chế biến sau, được dùng Wheat vừa thu trong tuần, tối đa 5 mẻ/tuần |

Gọi `a,b` là số WF nguyên giao Farm/Processor; `G,W,F` là tồn đầu tuần theo đơn vị hiển thị. `h=min(a,floor(G))`; Wheat có để chế biến=`W+2h`; `p=min(b,floor((W+2h)/2))`. Sau tuần: **Gold=`G−h`, Wheat=`W+2h−2p`, Food=`F+2p`**; Wood/Iron không đổi. WF chưa giao=`effective−a−b`, WF thực chạy=`h+p`, WF đã giao nhưng chờ=`a+b−h−p`. Mỗi mẻ chỉ trừ đầu vào một lần; dư lẻ giữ lại. Không có processor thì không được giao processing; lệnh quá WF, state lỗi hoặc overflow không đổi bất kỳ kho/tuần nào. Thành công tăng tuần đúng một lần; report là tuần vừa xử lý.

Ví dụ từ Gold10/Wheat0/Food4: giao **4+4WF** → Gold6/Wheat0/Food12, còn2WF chưa giao. Gold2 với cùng phân công → Gold0/Wheat0/Food8,2WF chưa giao và4WF đã giao nhưng chờ. Gold1.5 → cònGold0.5/Food6, không mua nửa mẻ. Giao4+0 chỉ thu8Wheat, Food giữ4; tuần sau0+4 dùng8Wheat tồn kho để tăngFood lên12. Chưa có Food consumption/Gold income.

**Lịch sử đã thay thế:** prototype trước dùng Farm4WF trực tiếp tạo8Food (Gold6/Food12,6WF chưa giao), cap10WF và cho giaoWF lẻ. Trial mới cần8WF cho cùng8Food; không relabel Food cũ thành Wheat, không chuyển dữ liệu prototype cũ. [WP, tham số và acceptance](docs/work_packages/WP-WHEAT-FOOD-CHAIN-01_v0.1.md).

Những trải nghiệm mô tả trong phần định hướng không có nghĩa đã hiện diện đầy đủ trong prototype. Dữ liệu và cơ chế có thể thay đổi giữa các phiên bản thử nghiệm.

---

## Chạy prototype từ mã nguồn

Cần Git, Node.js và npm. Đối chiếu phiên bản môi trường với cấu hình CI của repository trước khi chạy.

```bash
git clone https://github.com/tanntran2000/Build-Settlement.git
cd Build-Settlement
npm ci
npm run dev
```

Mở địa chỉ được terminal hiển thị (mặc định: `http://localhost:3000`).

Kiểm thử hiện có:
```bash
npm test
```

Build giao diện web:
```bash
npm run build
```

Chỉ `packages/ui/dist` là artifact dành cho người chơi. Để kiểm R1 riêng:

```bash
npm run build:regression --workspace=@haven/ui
npm run preview:regression --workspace=@haven/ui -- --port 4174 --strictPort
```

R1 regression mở tại `http://localhost:4174`, dùng `packages/ui/regression/dist`; không đóng gói thư mục này vào ZIP preview. Chạy `npm run test:smoke` sau production build sẽ tự build regression, khởi động hai preview server 4173/4174 và kiểm cả hai. Error log dùng cùng tên key nhưng storage tách theo origin; không chuyển log giữa hai port. Production vẫn đọc được log R1 cũ đã lưu trên chính origin production. Các ZIP cũ không được cập nhật tự động bởi thay đổi source.

---

## Góp ý và báo lỗi

Ưu tiên phản hồi về độ rõ ràng của giao diện, các thay đổi khó hiểu và lỗi có thể tái hiện.

Khi báo lỗi, vui lòng ghi:
* Phiên bản hoặc commit hash
* Trình duyệt và hệ điều hành
* Các bước tái hiện cụ thể
* Kết quả mong đợi và kết quả thực tế

*Lưu ý: Vui lòng không gửi dữ liệu cá nhân hoặc thông tin bảo mật.*

---

## Định hướng nội dung

Dự án hướng tới người chơi trưởng thành (18+). Thông tin cảnh báo và phạm vi nội dung sẽ được công bố rõ cho từng bản phát hành.

Trang giới thiệu này chỉ trình bày tổng quan, không tiết lộ toàn bộ cơ chế hoặc diễn biến của trò chơi.

---

## Công nghệ và giấy phép

* Nền tảng: TypeScript · Svelte 5 · Vite
* Giấy phép: Xem [LICENSE](LICENSE) để biết điều kiện sử dụng mã nguồn.
