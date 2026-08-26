# Codex 專案指引 — 11_Calendar-Card-App

> 最後更新：2026-08-27
> 維護者：Antigravity（梁巡官）

---

## 1. 專案定位

**莫蘭迪卡片式行事曆 v1.1.2**

- 純前端 (HTML5 / ES2020 Modules / Vanilla CSS)，零建置步驟
- 選用 Google Apps Script 作為雲端後端同步
- 本機模式以 `localStorage` 儲存行事曆資料
- 啟動方式：雙擊 `RUN.bat` 或執行 `py -3 -m http.server 8000 --bind 127.0.0.1`

---

## 2. 目錄結構

```
11_Calendar-Card-App/
├── index.html                 # 主介面 HTML
├── style.css                  # 莫蘭迪 CSS 變數主題 (17 KB)
├── google_api_config.js       # 前端 API 組態（apiUrl / apiToken，公開 URL）
├── RUN.bat                    # Windows 一鍵啟動靜態伺服器
├── js/
│   ├── app.js                 # ★ 應用程式進入點：DOMContentLoaded、事件綁定、全域函式掛載
│   ├── logic.js               # ★ 核心業務邏輯：CRUD、重複事件、分享文字產生
│   ├── ui.js                  # DOM 渲染：月視圖/週視圖、日卡、行動端 Split View
│   ├── api.js                 # API 層：GAS 雲端 ↔ localStorage fallback
│   ├── smart-input.js         # 智慧輸入解析（日期、時間、地點、連結）
│   ├── config.js              # 台灣 2026 國定假日常數
│   ├── state.js               # 全域狀態物件（currentDate、events、view…）
│   └── utils.js               # 工具函式（formatDateKey、escapeHTML、sanitizeLink）
├── apps-script/
│   └── backend_code.js        # Google Apps Script 後端（讀取/寫入 Google Sheet）
├── scripts/
│   └── qa.ps1                 # 提交前 QA：git diff --check + 敏感值掃描
├── docs/
│   └── DEVELOPMENT_RULES.md   # 雙 Agent 協作規則
├── .agents/AGENTS.md          # ← 本檔案（Codex 讀取）
└── .gemini/AGENTS.md          # Antigravity 讀取，請勿修改
```

---

## 3. 模組依賴圖

```
index.html
 └─ google_api_config.js       (window.GOOGLE_API_CONFIG)
 └─ js/app.js  [type=module]
      ├─ state.js
      ├─ api.js
      ├─ utils.js
      ├─ ui.js
      │    ├─ state.js
      │    ├─ config.js
      │    └─ utils.js
      ├─ logic.js
      │    ├─ state.js
      │    ├─ ui.js
      │    ├─ api.js
      │    ├─ utils.js
      │    └─ config.js
      └─ smart-input.js
           └─ utils.js
```

**window 全域掛載**（`app.js` 中供 HTML `onclick` 使用）：
- `window.editEvent`
- `window.openAddModal`
- `window.openEventListModal`
- `window.closeEventListModal`
- `window.shareSpecificDay`

---

## 4. 核心資料結構

### 4.1 state.events（`state.js`）

```js
// 鍵值：'YYYY-MM-DD'；值：事件物件陣列（依 time 排序）
state.events = {
  '2026-08-27': [
    {
      title: '夜來香',      // 必填，string
      time: '20:00',        // '全日' 或 'HH:MM'，空字串自動補 '全日'
      location: '',         // 選填
      description: '',      // 選填
      link: ''              // 選填，已過 sanitizeLink 驗證
    }
  ]
}
```

### 4.2 API 合約（`api.js`）

| 方法 | 說明 |
|------|------|
| `API.fetchAllEvents()` | GET：讀取全部事件。無 URL/Token → 直接讀 localStorage |
| `API.saveDayEvents(dateKey, events[])` | POST：儲存單日事件（events 為空陣列 = 刪除該日） |

**fallback 策略**：
1. 未設 `apiUrl` / `apiToken` → 自動切換 localStorage 本機模式
2. GAS 回 403 → 自動降級至 localStorage
3. localStorage 損毀 → 拋出 Error，**不**以空物件覆寫

### 4.3 智慧輸入支援格式（`smart-input.js`）

| 日期關鍵字 | 範例 |
|------------|------|
| 明確日期 | `8/27`、`2026/08/27` |
| 相對日期 | `今天`、`明天`、`後天`、`大後天` |
| 週次 | `週三`、`下週五`、`下下週一` |
| 時間 | `20:00`、`七點半`、`晚上8點` |
| 地點 | `在台中`、`地點：台北` |

---

## 5. 重要實作細節

### 5.1 儲存流程（`logic.saveEvent`）

1. 備份 `state.events`（用於失敗回滾）
2. 樂觀更新 `state.events`（含移動事件、重複事件展開）
3. 事件依 `time` 排序（`全日` 永遠排最前）
4. `await Promise.all(promises)` 呼叫 API
5. 成功 → 關閉 Modal，重新渲染
6. 失敗 → 回滾 `state.events`，保留 Modal 讓使用者重試

### 5.2 重複事件展開邏輯

| recurrence 值 | 結束日 |
|---------------|--------|
| `weekly_current_month` | 本月最後一天 |
| `weekly_3_month` | startDate + 3 個月 |
| `custom` | `event-recurrence-end` input 值 |

> **注意**：重複事件新增時每日各存一筆，**刪除時只刪該日那筆**，不連動其他日期。

### 5.3 行動端 Split View

- 螢幕寬度 ≤ 640px + 月視圖：點擊日卡觸發 `selectDay(dateKey)`，於頁面底部渲染 `#selected-day-events`
- 週視圖：隱藏 Split View

### 5.4 安全機制

- `escapeHTML()`：所有用戶輸入渲染前必須過此函式
- `sanitizeLink()`：阻擋 `javascript:` / `data:` / `vbscript:` 協定
- localStorage 損毀防護：解析失敗時拋錯，不以空物件靜默覆寫

---

## 6. Google Apps Script 後端重點（`apps-script/backend_code.js`）

| 項目 | 說明 |
|------|------|
| Token 驗證 | GET 從 URL param 取 token；POST 從 Body JSON 取 apiToken |
| API_TOKEN 來源 | **只能**從 ScriptProperties 讀取，禁止 hardcode |
| 並發保護 | `LockService.getScriptLock().tryLock(10000)` |
| 配額保護 | 每日 2500 次；80% 警告、90% 封鎖 |
| Sheet 結構 | Col A: DateKey (YYYY-MM-DD)、Col B: EventsJSON |
| 空陣列行為 | `events.length === 0` → 刪除該 Row |

---

## 7. Codex 職責邊界

- ✅ 負責：程式碼審查、回歸測試、小範圍 Bug 修正、QA 腳本維護
- ✅ 可修改：`js/`、`apps-script/`、`scripts/`、`index.html`、`style.css`
- ❌ 禁止修改：`.gemini/AGENTS.md`
- ❌ 禁止：在 `google_api_config.js` 或任何版控檔案中 hardcode Token / 密碼

---

## 8. 提交前驗證流程

```powershell
# 1. 語法檢查
node --check apps-script/backend_code.js
node --check js/api.js
node --check js/app.js
node --check js/logic.js
node --check js/smart-input.js
node --check js/ui.js

# 2. QA 掃描（git diff 格式 + 敏感值偵測）
.\scripts\qa.ps1

# 3. 啟動服務手動驗證
py -3 -m http.server 8000 --bind 127.0.0.1
# 開啟 http://127.0.0.1:8000 確認功能
```

---

## 9. 已知限制與注意事項

1. **config.js 假日資料**：目前只涵蓋 2026 年，跨年後需補充 2027 資料
2. **重複事件**：無批次刪除機制，只能逐日手動刪除
3. **GAS 配額**：每日 2500 次請求上限，頻繁重新整理可能提早耗盡
4. **LocalStorage**：同瀏覽器 Origin 儲存，換裝置或清除瀏覽器資料即失效
5. **ES Modules**：必須透過 HTTP 伺服器開啟，直接 `file://` 開啟會因 CORS 失敗

---

## 10. 安全警示

> ⚠️ `google_api_config.js` 目前包含公開部署用的 GAS URL 與 Token。
> 此 Token 僅用於控制 GAS 端點存取，**不得視為高機密**，
> 但仍應避免將其複製至其他場合或公開 README 中展示。
> 若需輪替 Token，同步更新 GAS ScriptProperties 中的 `API_TOKEN` 欄位。