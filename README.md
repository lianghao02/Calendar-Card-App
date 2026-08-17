# 莫蘭迪卡片式行事曆 Calendar-Card-App v1.1.1

[![Version](https://img.shields.io/badge/version-v1.1.1-blue.svg)](CHANGELOG.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-yellow.svg)](js/app.js)

這是一套以卡片呈現月曆與活動的網頁應用程式，可在純前端本機模式使用，也可搭配 Google Apps Script 後端同步資料。

## v1.1.1 更新重點

- 強化後端輸入、欄位與請求大小驗證。
- 加入同步鎖定逾時及明確錯誤回復。
- 修正前端日期計算、活動索引、智慧輸入及 API 錯誤處理。

## 使用模式

### 本機模式

直接開啟 `index.html` 即可使用介面。資料僅保存在目前瀏覽器可用的本機儲存空間，清除瀏覽器資料或更換裝置時不會自動同步。

### Google Apps Script 模式

1. 建立 Google Apps Script 專案。
2. 依專案設定部署 `apps-script/backend_code.js`。
3. 將部署後的 Web App URL 設定到前端 API 組態。
4. 先用非敏感測試資料確認讀寫與權限，再投入正式使用。

## 開發與驗證

本專案不需要前端建置步驟。可用 Node.js 檢查 JavaScript 語法：

```powershell
node --check apps-script/backend_code.js
node --check js/api.js
node --check js/app.js
node --check js/logic.js
node --check js/smart-input.js
node --check js/ui.js
```

## 限制

- Google Apps Script 的權限、配額與鎖定時間會影響同步結果。
- 本機模式不等同雲端備份；重要活動資料應另行備份。
- 智慧輸入是規則式解析，日期與文字仍需由使用者確認。

詳細異動請參閱 [CHANGELOG.md](CHANGELOG.md)。
