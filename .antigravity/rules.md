# 專案特定細則：日曆卡片應用程式 (Calendar Card App Rules)

> [!IMPORTANT]
> 本專案嚴格遵循「全域大腦 v2.1.0 (Tech Lead)」。所有開發動作、架構設計與註解必須 100% 使用台灣繁體中文。請保持直率、專業的 Tech Lead 溝通口吻，徹底消除 AI 罐頭感。

## 1. 核心架構與開發準則 (Architecture & Standards)
- **職責分離 (Separation of Concerns)**：前端邏輯必須嚴格切割。
  - `ui.js`：專職 DOM 渲染與視覺切換。
  - `logic.js`：專職狀態管理、事件 CRUD 與表單彈窗邏輯。
  - `utils.js`：負責共用工具與資安防禦函式。
- **無後端輕量化 (Serverless)**：目前依賴瀏覽器的 `localStorage` 或靜態狀態進行資料存儲，嚴禁引入不必要的大型資料庫或繁重的後端框架。

## 2. 絕對的資安防禦 (Security & XSS Mitigation)
作為 Tech Lead，安全是不可妥協的底線：
- **強制 HTML 轉義**：在渲染任何包含使用者輸入的卡片標題、時間或描述時，必須呼叫 `escapeHTML()` 進行字串過濾，嚴禁將原始字串直接塞入 `innerHTML`。
- **協議安全 (Protocol Safety)**：所有的網址與外部連結在寫入 `href` 屬性前，必須強制通過 `sanitizeLink()`，徹底封殺 `javascript:` 偽協議等 XSS 手法。

## 3. UI/UX 與極致美學 (Aesthetics & User Experience)
- **現代化設計語言**：UI 介面必須擺脫傳統的死板感。善用玻璃擬態 (Glassmorphism)、細膩的陰影過渡 (Box-shadow transitions) 與圓角設計，讓每一張「日曆卡片」都具備高質感的點擊回饋。
- **響應式與移動優先 (Mobile-First)**：
  - 日曆網格在手機端必須能優雅降級或轉換顯示模式（如單欄列表或滑動卡片），保證極致的滑順度。
  - 觸控熱區 (Touch targets) 必須大於 44px，避免行動裝置誤觸。
- **防呆與即時驗證**：新增或編輯行程時，表單必須提供即時的格式驗證提示，並妥善處理空白輸入的極端情況。

## 4. 效能優化 (Performance)
- **DOM 操作最小化**：在切換月份或大規模重繪日曆時，盡可能使用 `DocumentFragment` 進行批量操作，避免引發不必要的瀏覽器重排 (Reflow)。
- **輕量化依賴**：非必要不引入龐大的第三方套件（如 jQuery 或大型日期庫），善用原生 `Date` 物件與 Vanilla JS 解決問題。
