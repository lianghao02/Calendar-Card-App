# 莫蘭迪卡片式行事曆 Calendar-Card-App v1.1.2

## 專案概念與開發原因

月曆卡片把活動以月份及卡片方式呈現，提供本機使用與選用 Google Apps Script 同步。開發動機是日常排程需要快速新增、閱讀與調整，並清楚知道資料是在本機還是已送到雲端。

採 ES modules 的輕量前端架構，規則式智慧輸入協助整理文字與日期。它保留人工確認，避免把輸入解析或同步訊息當成已完成的行程。

**典型流程**：開啟本機服務 → 新增／編輯卡片 → 確認日期 → 保存於本機或設定雲端同步。

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

## 已知 Bug、限制與疑難排解

以下區分已確認問題、功能限制及待驗證項目；歷史修正不代表舊發行包已自動更新，也不代表本次文件更新重新完成所有功能測試。

| 狀態 | 情境 | 處理方式 |
|---|---|---|
| 啟動限制 | 直接以 file:// 開啟會受到 ES modules 安全限制。 | 使用 RUN.bat 或 README 的本機 HTTP 服務方式，不把模組載入失敗當成行程資料損毀。 |
| 保存限制 | 本機資料依瀏覽器與網站來源保存。 | 換瀏覽器、換連接埠或清除網站資料可能看不到原資料；localStorage 不應當作唯一備份。 |
| 服務限制 | GAS 同步需要網路、部署權限與可用服務；字型亦可能需要連線。 | 檢查同步回應及設定；未收到成功回應前，不認定雲端已保存。 |

API 錯誤處理、日期解析／驗證與本機服務入口等修正見 [CHANGELOG.md](CHANGELOG.md)。npm test 目前執行 JavaScript 語法檢查，不等於完整瀏覽器操作與雲端端到端測試；日期解析結果仍需人工確認。

### 問題回報

請提供使用版本／啟動方式、作業系統與相關環境、重現步驟、預期及實際結果，以及去識別的錯誤訊息或最小樣本。先保留現場與來源資料；不要附真實案件、完整帳號、密碼、Token 或 API Key。版本修正以對應原始碼與發行包為準。
