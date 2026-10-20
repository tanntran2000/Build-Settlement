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

Bản dành cho người chơi mở **Weekly Management**: phân công Farm Field → End Week → báo cáo WHY → Plan next week. `/`, `?mode=weekly`, `?mode=r1` và query không nhận diện đều mở Weekly. Prototype R1 ngày được giữ riêng để kiểm hồi quy, không nằm trong artifact dành cho người chơi.

Runtime Weekly hiện vẫn có đúng bốn stock Gold/Food/Wood/Iron, không đổi công thức, reset khi reload và chưa save/load. Hướng thiết kế kế tiếp đã xác định sáu stock Wheat/Gold/Wood/Iron/Food/Goods: Goods là hàng hóa vật lý dùng trao đổi, không phải status; Food chỉ được chế biến từ Wheat qua building trong cùng tuần thu hoạch. Recipes, rates, capacity và cost chưa được duyệt; triển khai sáu stock, UI/UX mới, nguồn Gold, tiêu thụ Food và hoạt động khác cần WP riêng. Entry này chưa triển khai các cơ chế đó hoặc hoàn tất demo.

### Công thức đang chạy — chưa đổi balance

Mọi stock và WF dùng fixed-point: **1 đơn vị hiển thị = 1000 milli**, **1 WF = 1000 milliWF**. Với 100 cư dân Middle, multiplier 1000: `baseWFmilli = floor(100 × 1000 / 10) = 10000`; modifier hiện tại bằng 0 nên effective WF vẫn là **10 WF**. Helper dùng số nguyên chính xác; multiplier là integer milli không âm.

Gọi `A` là milliWF phân công, `G` và `F` là Gold/Food milli trước tuần: `0 ≤ A ≤ min(effectiveWFmilli, 10000)`. Gold yêu cầu bằng `A`; milliWF được cấp kinh phí `B = min(G, A)`. Gold sau tuần `G − B`; Food sau tuần `F + 2 × B`; chưa phân công `effectiveWFmilli − A`; đã phân công nhưng thiếu kinh phí `A − B`. Wood/Iron không đổi. Đây là hệ số thử nghiệm **1 Gold/WF → 2 Food/WF**, không phải full balance.

Ví dụ: Gold10/Food4, giao4WF → Gold6/Food12. Gold2/Food4, giao4WF → Gold0/Food8, thiếu kinh phí2WF và chưa phân công6WF. Giao0.5WF tại Gold10/Food4 → Gold9.5/Food5. Không tiêu thụ Food hoặc tạo Gold tự động. Báo cáo là kết quả của tuần vừa xử lý; header đã ở tuần kế tiếp.

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
