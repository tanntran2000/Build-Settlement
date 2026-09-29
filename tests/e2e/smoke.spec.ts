import { test, expect } from '@playwright/test';

test.describe('Prototype Browser Smoke Test (LAW-02, LAW-03, LAW-04)', () => {
  test('advances day via command dispatcher, updates inventory, floors at 0 on shortage, and logs WHY', async ({ page }) => {
    // 1. Mở prototype
    await page.goto('/');

    // Kiểm tra hiển thị Ngày 1
    const currentDayEl = page.locator('#current-day');
    await expect(currentDayEl).toHaveText('1');

    // Kiểm tra kho lương thực ban đầu là 100
    const foodEl = page.locator('#resource-food');
    await expect(foodEl).toHaveText('100');

    // 2. Click "Tiến Sang Ngày Mới"
    const nextDayBtn = page.locator('#btn-advance-day');
    await nextDayBtn.click();

    // 3. Xác nhận Ngày chuyển thành 2
    await expect(currentDayEl).toHaveText('2');

    // 4. Xác nhận Kho lương thực giảm từ 100 xuống 77 (tiêu thụ 23)
    await expect(foodEl).toHaveText('77');

    // 5. Xác nhận Nhật ký Nhân quả ghi nhận sự kiện của Ngày 1
    const auditContainer = page.locator('#audit-log-container');
    await expect(auditContainer).toContainText('[Ngày 1]');

    // 6. Click tiếp tục nhiều lần cho đến khi lương thực cạn kiệt
    // Ngày 2: 77 - 23 = 54 (Ngày -> 3)
    await nextDayBtn.click();
    await expect(currentDayEl).toHaveText('3');
    await expect(foodEl).toHaveText('54');

    // Ngày 3: 54 - 23 = 31 (Ngày -> 4)
    await nextDayBtn.click();
    await expect(currentDayEl).toHaveText('4');
    await expect(foodEl).toHaveText('31');

    // Ngày 4: 31 - 23 = 8 (Ngày -> 5)
    await nextDayBtn.click();
    await expect(currentDayEl).toHaveText('5');
    await expect(foodEl).toHaveText('8');

    // Ngày 5: Kho có 8, cần 23 -> Cấp phát 8, Thiếu hụt 15, Kho còn 0 (Ngày -> 6)
    await nextDayBtn.click();
    await expect(currentDayEl).toHaveText('6');
    await expect(foodEl).toHaveText('0');

    // Xác nhận xuất hiện dòng nhật ký giải trình thiếu hụt của Ngày 5
    await expect(auditContainer).toContainText('Thiếu hụt');
    await expect(auditContainer).toContainText('[Ngày 5]');

    // 7. Click thêm một ngày nữa khi kho hoàn toàn cạn kiệt (Kho = 0)
    // Ngày 6: Kho có 0, cần 23 -> Cấp phát 0, Thiếu hụt 23, Kho VẪN LÀ 0 (tuyệt đối không âm!)
    await nextDayBtn.click();
    await expect(currentDayEl).toHaveText('7');
    await expect(foodEl).toHaveText('0');
    await expect(auditContainer).toContainText('[Ngày 6]');
    await expect(auditContainer).toContainText('Thiếu hụt 23');
  });
});
