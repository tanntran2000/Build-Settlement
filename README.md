# Haven: Sovereign Frontier (Build-Settlement)

> Game mô phỏng quản lý lãnh địa và xã hội hậu tận thế, xây dựng trên nền tảng TypeScript, Svelte 5 và Vite.

---

## 1. Giới thiệu & Triết lý cốt lõi

Dự án phát triển một trò chơi mô phỏng quản trị lãnh địa từ con số 0, kết hợp chiều sâu tâm lý con người và thể chế xã hội:
- **Macro Loop (Vòng lặp vĩ mô)**: Người chơi chỉ trực tiếp điều hành **1 Active Settlement** tại một thời điểm. Sau khi xây dựng và phát triển vững chắc, người chơi bổ nhiệm Thống đốc (Governor), thiết lập Hiến chương Sáng lập (Founder Charter) và bàn giao (Handoff) để thuộc địa trở thành **Legacy Settlement** (do Governor AI tự vận hành). Sau đó người chơi tiếp tục khám phá vùng đất mới.
- **Hai tầng Dân số**:
  - **Named NPC**: Nhân vật cá nhân hóa sâu sắc (tính cách, nhu cầu, cảm xúc, ký ức và quan hệ 8 chiều). Đóng vai trò lãnh đạo và cầu nối quản lý.
  - **Population Cohort**: Quần thể dân cư quy mô lớn (Công nhân, Kỹ thuật viên, Lính bảo an, Nông dân, Thương nhân) mô phỏng theo chỉ số nhóm bình quân.
- **Ba trục Thân phận độc lập**: Nghề nghiệp (*Occupation*) $\\neq$ Tầng lớp (*Social Class*) $\\neq$ Địa vị pháp lý (*Legal Status: Tự do, Hợp đồng, Nô lệ hóa, Tù nhân*).
- **Hệ thống Nhân quả Minh bạch (*Explanation Layer*)**: Mọi biến động chỉ số (tài nguyên, bất mãn, lòng tin) đều có audit log chi tiết giải thích nguyên nhân (*WHY*).
- **Thuần Việt & Offline-first**: Văn bản tiếng Việt gốc, có bộ phân giải xưng hô động (*PronounResolver*), chơi hoàn toàn offline, không phụ thuộc AI API trả phí.

---

## 2. Cấu trúc Monorepo

`
Build-Settlement/
├── packages/
│   ├── core/           # Logic nền tảng: State, 3 Axes, Relationship 8D, Memory, Invariants
│   ├── simulation/     # Các subsystem: Kinh tế hàng ngày, Sản xuất, Nhu cầu dân số
│   ├── content/        # Dữ liệu tĩnh: Bản vẽ công trình, Tài nguyên, Thuật ngữ (Tiếng Việt)
│   ├── persistence/    # Lược đồ lưu trữ: World Save, Profile Save, Nén lịch sử
│   └── ui/             # Giao diện Svelte 5 + Vite: Dashboard, NPC Profile, Audit Log
├── package.json        # Quản lý workspace npm
└── tsconfig.base.json  # TypeScript strict mode
`

---

## 3. Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu môi trường
- Node.js >= 20.0.0
- npm >= 10.0.0

### Khởi chạy giao diện phát triển (Development)
`ash
npm run dev
`
Trình duyệt sẽ mở tại http://localhost:3000.

### Kiểm thử (Unit Tests)
`ash
npm test
`

### Đóng gói ứng dụng (Production Build)
`ash
npm run build
`
