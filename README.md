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

Bản hiện tại có giao diện thử nghiệm hiển thị tài nguyên, nhân vật, quần thể dân cư, danh mục công trình và mô phỏng tiêu thụ theo ngày kèm nhật ký ban đầu. Vòng xây dựng–sản xuất, lưu/khôi phục tiến trình và các hệ thống dài hạn đang được hoàn thiện.

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
npm run build --workspace=@haven/ui
```

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
