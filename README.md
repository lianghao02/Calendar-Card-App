# 📅 Calendar Card App (每週日曆卡片)

這是一個極簡風格的個人週曆應用程式，專注於「卡片式」的行程管理。
前端採用原生 **HTML/JS (ES Modules)** 開發，後端結合 **Google Sheets + Apps Script** 作為免費且便利的資料庫。

## ✨ 主要功能

*   **雙重視圖**：支援「月曆」與「週曆」兩種檢視模式。
*   **響應式設計**：
    *   **電腦版**：傳統月曆佈局，滑鼠雙擊日期新增行程。
    *   **手機版**：點選日期後，下方會動態展開該日的行程卡片 (Split View)。
*   **💡 智慧輸入**：支援貼上自然語言 (例如：「明天晚上七點在北車吃飯」)，自動解析日期、時間與地點。
*   **☁️ 雲端同步**：所有資料即時同步至 Google Sheets，換裝置也能看見。
*   **🔗 強大整合**：
    *   支援加入行程連結 (Zoom, Meet, 餐廳網址)。
    *   支援 LINE / Messenger 文字分享行程。
    *   支援多選日期分享 (大量行程匯出)。

## 📂 專案結構

本專案採用 **ES Modules** 模組化架構，將代碼邏輯分離以利維護：

```text
Project Root
├── index.html              # 應用程式入口 (UI 骨架)
├── style.css               # 樣式表 (CSS Variables, Flex/Grid Layout)
├── google_api_config.js    # [重要] 個人 API 設定檔 (此檔案被 gitignore 忽略)
├── google_api_config.example.js  # 設定檔範本
├── backend_code.js         # Google Apps Script 後端程式碼
└── js/                     # 前端核心模組
    ├── app.js              # 主程式入口 (Init, Event Listeners)
    ├── api.js              # API 溝通層 (Fetch, Error Handling)
    ├── config.js           # 公用設定 (例如：2026 連假日期表)
    ├── logic.js            # 業務邏輯 (CRUD, Modal 控制, 分享功能)
    ├── smart-input.js      # 智慧輸入解析引擎 (Regex)
    ├── state.js            # 全域狀態管理 (State Store)
    ├── ui.js               # 畫面渲染 (Render Calendar, DOM 操作)
    └── utils.js            # 共用工具函式 (Date Formatters)
```

## 🚀 安裝與設定教學

### 1. 取得專案
```bash
git clone https://github.com/lianghao02/Calendar-Card-App.git
cd Calendar-Card-App
```

### 2. 設定後端 (Google Sheets)
本專案不需架設伺服器，只需擁有 Google 帳號。

1.  前往 [Google Sheets](https://sheets.google.com) 建立一個新的試算表。
2.  點選上方選單 **「擴充功能」 (Extensions) > 「Apps Script」**。
3.  將專案中的 `backend_code.js` 內容完整複製貼上到編輯器中。
4.  點選 **「部署」 (Deploy) > 「新增部署」 (New deployment)**。
5.  設定如下：
    *   **類型**：網頁應用程式 (Web app)。
    *   **執行身分**：我 (Me)。
    *   **誰可以存取**：**任何人 (Anyone)** (這樣前端才能跨網域呼叫)。
6.  部署後，複製 **網頁應用程式網址 (Web App URL)**。

### 3. 設定前端 (連接 API)
為了安全起見，API 網址不會上傳到 Git，請依照以下步驟設定：

1.  在專案根目錄，複製或是重新命名 `google_api_config.example.js` 為 `google_api_config.js`。
2.  編輯 `google_api_config.js`，填入剛剛取得的網址：

```javascript
// google_api_config.js
window.GOOGLE_API_CONFIG = {
    apiUrl: "https://script.google.com/macros/s/你的部署ID/exec"
};
```
3.  完成！

### 4. 啟動專案
由於使用了 ES Modules，直接雙擊 `index.html` 無法運作 (會有 CORS 錯誤)。
請使用 **Live Server** 或其他本地伺服器開啟。

*   **VS Code**: 安裝 "Live Server" 套件，右鍵點擊 `index.html` -> "Open with Live Server"。

## 🛠️ 開發說明

*   **修改連假**：編輯 `js/config.js` 中的 `HOLIDAYS_2026` 物件。
*   **調整樣式**：主要樣式位於 `style.css`，採用 CSS Variables 定義顏色系統，方便抽換主題。

## 🔒 安全性注意事項
*   `google_api_config.js` 已經被加入 `.gitignore`，請確保不要強制將其上傳，以免 API 網址外洩。
*   後端 Apps Script 設有簡單的流量限制 (每日 5000 次)，避免惡意刷流量。

---
Developed by Chia-Hao
