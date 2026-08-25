# 莫蘭迪卡片式行事曆 Calendar-Card-App v1.1.2

## 技術架構現況（2026-08-24）

本專案主力為 **HTML5／CSS／ES2020 JavaScript**；雲端同步為選用的 Google Apps Script，Python 只用於本機靜態伺服器。現階段維持免建置網站，若需安裝與離線能力優先導入 PWA，不進行語言遷移。

[![Version](https://img.shields.io/badge/version-v1.1.2-blue.svg)](CHANGELOG.md)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2020-yellow.svg)](js/app.js)

這是一套以卡片呈現月曆與活動的網頁應用程式，可在純前端本機模式使用，也可搭配 Google Apps Script 後端同步資料。

## 下載、依賴與啟動

- **一般使用**：下載 ZIP 並解壓後雙擊 `RUN.bat`。因前端使用 ES Modules，啟動器會在 `127.0.0.1:8000` 開啟本機靜態伺服器；也可手動執行 `py -3 -m http.server 8000 --bind 127.0.0.1`。
- **執行依賴**：現代瀏覽器；Google Fonts 由 CDN 載入。本機月曆功能不需要 npm 套件，Python 只用來啟動簡易靜態伺服器。
- **本機資料**：活動保存在瀏覽器儲存空間；`google_api_config.js` 只放公開部署 URL，不可放密碼、Token 或其他機密。
- **雲端同步**：選用 Google Apps Script 時，另部署 `apps-script/backend_code.js`，再從 `google_api_config.example.js` 建立本機設定檔。
- **打包／部署**：不需編譯；完整上傳 `index.html`、`css/`、`js/` 及必要設定檔至 GitHub Pages 或其他 HTTPS 靜態空間。
- **開發檢查**：已安裝 Node.js 時可執行 `npm test`；`package.json` 沒有執行期套件。

## v1.1.2 更新重點

- 強化後端輸入、欄位與請求大小驗證。
- 加入同步鎖定逾時及明確錯誤回復。
- 修正前端日期計算、活動索引、智慧輸入及 API 錯誤處理。

## 使用模式

### 本機模式

透過本機靜態伺服器開啟介面。資料僅保存在目前瀏覽器可用的本機儲存空間，清除瀏覽器資料或更換裝置時不會自動同步。

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
