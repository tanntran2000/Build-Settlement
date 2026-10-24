# Haven: Sovereign Frontier

Prototype game quản lý khu định cư hậu tận thế: xây dựng, tổ chức công việc và chăm lo cho cộng đồng.

## Hiện có

- Bản thử nghiệm theo ô đất: xây, nâng cấp, thay thế và tạm dừng công trình.
- Phân công workforce, quản lý tài nguyên và xem kết quả sau mỗi tuần.
- Xuất/nhập checkpoint JSON và checkpoint lưu thủ công riêng cho tile trial và population trial, trong giai đoạn Planning.

Game đang ở giai đoạn **early prototype**. Nhiều hệ thống dự kiến chưa có; cơ chế và dữ liệu có thể thay đổi giữa các bản thử nghiệm.

## Chạy từ mã nguồn

Cần Git, Node.js và npm.

```bash
git clone https://github.com/tanntran2000/Build-Settlement.git
cd Build-Settlement
npm ci
npm run dev
```

Mở địa chỉ terminal hiển thị, mặc định `http://localhost:3000`. Từ Weekly, chọn **Play tile building trial**, hoặc mở `http://localhost:3000/?mode=tiles`.

## Lưu và tiếp tục

Trong tile trial hoặc population trial, chọn **Export checkpoint** khi đang Planning để giữ file lưu. Dùng **Import checkpoint** để tiếp tục từ checkpoint tương thích với chế độ đang chơi; nếu đang xem báo cáo, chọn **Plan next week** trước.

**Save locally** giữ một checkpoint riêng cho mỗi chế độ trong trình duyệt, profile và địa chỉ hiện tại (lưu lại sẽ thay bản trước của chế độ đó); **Continue locally** khôi phục checkpoint của chế độ đang chơi. Hai nút chỉ dùng khi Planning. Checkpoint này mất nếu xoá dữ liệu trang, không dùng được ở trình duyệt/profile/địa chỉ khác và có thể không khả dụng khi trình duyệt chặn lưu trữ, nên vẫn hãy Export file để sao lưu.

Reload mở ván mới. Hiện chưa có autosave hoặc cloud save; hãy giữ file checkpoint đã xuất. Classic Weekly chưa hỗ trợ lưu game.

## Góp ý và chỉnh sửa

Khi báo lỗi, hãy kèm phiên bản, trình duyệt, các bước tái hiện và kết quả mong đợi/thực tế. Không gửi dữ liệu cá nhân hoặc thông tin bảo mật.

Chưa có trình nạp mod. Chỉnh mã nguồn hiện cần build lại bằng `npm run build`; thay đổi gameplay nên được thống nhất phạm vi trước.

Giấy phép: xem [LICENSE](LICENSE).
