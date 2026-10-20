# WP-WEEKLY-PLAYER-ENTRY-01 v0.1

Base: `d13b9f9536e0eaeec900099b07be164c3b993212`. Phạm vi implementation được người dùng giao: chỉ player entry/packaging và regression; không mở rộng gameplay. Candidate cần local gates, exact-SHA CI và Reviewer/Tester độc lập; Builder không merge hoặc tuyên bố demo hoàn chỉnh.

## Hợp đồng entry và artifact

Production `packages/ui/src/main.ts` mount thẳng WeeklyManagement, không import App.svelte hoặc chọn scene theo query. `/`, `?mode=weekly`, `?mode=r1` và unknown đều Weekly; HTML `lang=en`. Giữ global error/rejection/pagehide capture, logger mode weekly.

R1 giữ nguyên App.svelte, fixtures và assertions; entry riêng tại `packages/ui/regression/main.ts`, HTML `lang=vi`, logger r1 và capture tương đương. Vite hiện có build regression ra `packages/ui/regression/dist`, không ghi đè `packages/ui/dist`. Chỉ production dist được ship; regression không nằm trong ZIP preview. WP không tạo hoặc thay ZIP đã giao trước đó.

`build:regression`: `vite build regression --config vite.config.ts --outDir dist`; `preview:regression`: `vite preview regression --config vite.config.ts --outDir dist`. Root pretest:smoke build regression. Playwright default production4173, server regression4174. Không thêm dependencies/framework hoặc đổi CI gates.

## Công thức hiện hành — không thay đổi

| Đại lượng | Cách tính và đơn vị |
| --- | --- |
| Scale | 1 stock hiển thị=1000 milli; 1WF=1000 milliWF |
| Base WF | Shared calculator tính floor theo từng cohort trước cộng tổng; Middle100, multiplier1000 → floor(100×1000/10)=10000 milliWF |
| Effective WF | Shared helper với modifier0: floor(10000×10000/10000)=10000 milliWF=10WF; không buff mới |
| Giao Farm Field | A là integer milliWF; 0≤A≤min(effective milliWF,10000) |
| Gold yêu cầu / tài trợ | G là Gold milli mở đầu; yêu cầu=A; B=min(G,A) là milliWF được tài trợ ở hệ số1Gold/WF |
| Kết thúc tuần | Gold=G−B; Food=F+2B; Wood/Iron không đổi; week tăng1 chỉ khi thành công |
| Nhân lực báo cáo | Chưa phân công=effective−A; đã giao nhưng thiếu kinh phí=A−B |

Stocks khởi tạo: Gold10/Food4/Wood0/Iron0. Ví dụ4WF →6Gold/12Food; nếu Gold2/Food4 thì4WF →0Gold/8Food,2WF unfunded và6WF unassigned. Giao0.5WF tại fixture đầu →9.5Gold/5Food. Giao0WF giữ stocks, kể cả Gold0. Số nguyên chính xác nội bộ, floor từng cohort; multiplier integer milli không âm. Report lấy kết quả dispatcher, không tái tính kinh tế khi render.

Đây là hệ số thử nghiệm của một Farm Field, chưa full balance. Chưa có Food consumption, Gold income, activity khác, Support/CityEffects/Medal, NPC workforce, dynamics hoặc persistence. Production đầu vào vẫn đúng4 kho; sáu tài nguyên UI R1 chỉ còn ở regression. Thiết kế5 nhóm tài nguyên và UI/UX mới là kế hoạch WP kế tiếp, chưa chốt mapping/rates hoặc triển khai Goods/status.

## Logging và dữ liệu

Giữ nguyên key/schema/catalog/error-log helper. Production vẫn đọc lịch sử record r1 đã tồn tại trên origin của nó, rồi ghi các sự kiện mới dưới weekly. Regression port khác nên storage độc lập; không bridge/migration localStorage giữa ports. Game vẫn RAM/reset khi reload, không save/load/migration; runtime logger không chứa snapshot game/stack và UI buildId vẫn unavailable.

## Kiểm tra và giới hạn nghiệm thu

1. RED entry trên baseline: các route/language/import graph còn vi phạm; GREEN sau implementation. Browser kiểm tất cả route không có R1 controls và vẫn thực hiện4WF→Gold6/Food12.
2. Duy trì assertions R1 bằng regressionserver, Weekly ở production; giữ report lock, Enter/double-click, Plan next draft0/reload và MAX_SAFE formatter.
3. Import graph và artifact không có App/R1 controls; hash production trước/sau regressionbuild bằng nhau. Kiểm output thực tế, không suy ra chỉ từ command string.
4. Global capture cả hai entry, error clock/mode, pagehide flush, native exceptions/rejections, safe export, storage failures; lịch sử r1 cùng production origin vẫn đọc được, không bridge khác origin.
5. Gates bắt buộc: lint, full typecheck, npm test, npm run build, npm run test:smoke, npm audit --audit-level=moderate, diff/allowlist. Không skip/weaken assertion. Hai lượt sửa thất bại cùng issue → HOLD. Chưa kiểm mọi browser/OS, chưa nghiệm thu Android native hoặc demo hoàn chỉnh.

## Allowlist tối đa15 file

`packages/ui/src/main.ts`, `packages/ui/index.html`, `packages/ui/regression/index.html`, `packages/ui/regression/main.ts`, `packages/ui/package.json`, `package.json`, `packages/ui/tsconfig.json`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/weekly-management.spec.ts`, `tests/e2e/error-log.spec.ts`, `README.md`, `docs/MASTER_ROADMAP.md`, `docs/INTERNAL_PROGRESS_TRACKER.md`, file WP này. Không cần diff file không phục vụ thay đổi. Cấm sửa core/simulation/content/components/save schema/exports/fixtures/rates/lockfile/global CSS/CI gates. Mở rộng ngoài allowlist phải báo trước.

## Bằng chứng local của candidate

RED trên baseline:5 entry tests fail, exit1 (HTML vi và import graph còn App). GREEN:617unit/17file,29browser, exit0; lint/typecheck/build/regressionbuild/audit đạt, audit0 vulnerabilities. Browser kiểm hai artifact thực tế; regressionbuild không thay hash production. Logs ở `/tmp/weekly-player-entry-01/` trong executor; exact SHA và hash manifest ghi ở kết quả Builder sau commit. Đây là bằng chứng local, chưa phải independent PASS hoặc CI trên candidate, chưa merge/G6.
