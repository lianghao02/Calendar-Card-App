import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSmartInput } from '../js/smart-input.js';

const base = new Date(2026, 10, 17, 10, 0, 0); // 2026-11-17 (週二)

test('智慧輸入支援每週X並帶入重複週期，不退回今天單次行程', () => {
    const result = parseSmartInput('每週五 14:00 會議', base);
    assert.equal(result.date.getFullYear(), 2026);
    assert.equal(result.date.getMonth(), 10);
    assert.equal(result.date.getDate(), 20);
    assert.equal(result.data.time, '14:00');
    assert.equal(result.data.title, '會議');
    assert.equal(result.data.recurrence, 'weekly_current_month');
});

test('智慧輸入不會把「在家工作」誤切為空白標題', () => {
    const workFromHome = parseSmartInput('明天 09:00 在家工作', base);
    assert.equal(workFromHome.date.getDate(), 18);
    assert.equal(workFromHome.data.title, '在家工作');
    assert.equal(workFromHome.data.location, '');

    const withLocation = parseSmartInput('明天 18:00 家庭聚餐 在台北', base);
    assert.equal(withLocation.data.title, '家庭聚餐');
    assert.equal(withLocation.data.location, '台北');

    const explicitLocation = parseSmartInput('明天 18:00 家庭聚餐 地點：家裡', base);
    assert.equal(explicitLocation.data.title, '家庭聚餐');
    assert.equal(explicitLocation.data.location, '家裡');
});

test('智慧輸入支援 13 以上中文數字並拒絕越界時間', () => {
    const cnTime = parseSmartInput('明天 十三點二十五分 健檢', base);
    assert.equal(cnTime.data.time, '13:25');
    assert.equal(cnTime.data.title, '健檢');

    const pmTime = parseSmartInput('明天 晚上七點半 聚餐', base);
    assert.equal(pmTime.data.time, '19:30');

    const badHour = parseSmartInput('明天 25:00 開會', base);
    assert.ok(badHour.error);

    const badMinute = parseSmartInput('明天 10:65 開會', base);
    assert.ok(badMinute.error);
});
