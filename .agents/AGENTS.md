> [!IMPORTANT]
> **本專案受 全域開發憲法 v5.0 最高規範約束**
> 1. **預設啟用**：現代化 UI/UX 審美底線、驗證先行 (Verification First)。
> 2. **進階調度**：支援 NotebookLM 條件觸發與 Subagent (子代理) 背景分工機制。
> ---
> 以下為專屬本專案之業務領域知識與技術細則：

# Calendar-Card-App 專案領域知識 (Local Rules)

## 1. 核心業務邏輯
* **卡片式管理**：強調 Mobile-First 與 Split View（點擊日期展開下方卡片），非傳統的滿版網格。
* **智慧輸入 (Smart NLP)**：內建 Regex 解析引擎，必須支援解析自然語言中的「時間、日期與地點」。

## 2. 技術棧與架構規範
* **前端架構**：採用原生 **HTML/JS (ES Modules)**，嚴禁將所有邏輯塞回單一檔案。新功能必須依照 `ui.js`, `api.js`, `logic.js` 拆分。
* **無後端資料庫**：後端強制使用 **Google Sheets + Apps Script** 作為儲存層，所有對外資料交換必須透過 Fetch API 處理。

## 3. 安全與部署防線
* **設定檔隔離**：`google_api_config.js` 絕對不可寫死或提交至 Git，必須以 `window.GOOGLE_API_CONFIG` 作為讀取入口。
