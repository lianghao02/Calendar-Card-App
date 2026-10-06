# 11_Calendar-Card-App Agent 開發規範

本專案遵循目前有效之全域開發憲法；本檔僅定義專案專屬規則與例外。

---

## 1. 技術棧與前端架構邊界
- **主力架構**：純靜態 Web (HTML5 / ES2020 JavaScript Modules / CSS) + 選用之 Google Apps Script (GAS) 雲端後端。
- **架構純粹性標準**：
  - 本工具核心為零建置、輕量優雅之莫蘭迪卡片式行事曆。
  - **嚴禁引入 React、Vue 等大型前端 SPA 框架**，維持免編譯、現代瀏覽器原生 ES Modules 即開即用。
  - 若未來需要進一步離線安裝能力，優先導入標準 PWA (Progressive Web App)，不隨意進行語言遷移。

---

## 2. 業務領域與同步狀態核心邊界 (透明狀態原則)
- **嚴格區分「本機模式」與「Google 雲端同步」狀態**：
  - **本機模式**：活動資料僅存放於瀏覽器 Storage，必須明確提示使用者「本機資料不等同雲端備份，清除快取或更換設備不會自動保留」。
  - **雲端同步模式**：搭配 GAS 時，必須在 UI 清楚呈現即時同步狀態：
    - ⏳ 同步進行中（請求鎖定中）
    - ✅ 同步成功（時間戳記錄）
    - ❌ 同步失敗（明確回傳原因，如網路異常、GAS 配額超限或鎖定逾時）
- **資安與資料防護底線**：
  - **嚴禁假性同步成功**：若雲端同步失敗，**絕對不可讓使用者誤以為資料已安全上雲**，必須保留本機資料並提示重新嘗試。
  - **敏感資訊隔離**：`google_api_config.js` 僅存放公開 Web App 部署 URL，**嚴禁硬編碼任何密碼、個人 Access Token 或機密憑證**。

---

## 3. 核心驗證方式
- 修改 JavaScript 或 Apps Script 邏輯後，必須執行語法檢查與品質驗證：
  ```powershell
  node --check js/app.js
  powershell -ExecutionPolicy Bypass -File scripts\qa.ps1
  ```

---

## 4. 共用 Skill 引用與動態解析 (Discovery Rule)
- 本專案遵循 LiangHao 全生態系標準規範 Skill：`lianghao-development`（Canonical Source 位於 `Dev-Control-Center/configs/skills/lianghao-development`，v1.0.0）。
- Agent 開始工作時：
  1. 優先使用目前環境可自動發現的 `lianghao-development` Skill
  2. 若平台未自動載入，使用既有動態解析順序：環境變數 `LIANGHAO_SKILL_HOME` ➜ `%USERPROFILE%\.lianghao\config.json` ➜ 鄰近工作區探索 `..\00_Dev-Control-Center\configs\skills\lianghao-development` 或呼叫其 `skill-resolver.ps1`
  3. 先讀 Shared Skill
  4. 再讀本專案 `AGENTS.md`
  5. 再讀目前 `HANDOFF.md` / `IMPLEMENTATION_PLAN.md`
  6. 專案、Git、測試與建置實際狀態優先於文件歷史
- 跨 Agent HANDOFF 一律使用 `lianghao-development` 標準範本，以 `Repository Full Name`、`Branch`、`Commit SHA`、`Task Type` 為主要識別，嚴禁複製 Skill 到本專案。
