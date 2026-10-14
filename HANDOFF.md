# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/Calendar-Card-App
- **Branch**：codex/firebase-family（已同步至 main）
- **Commit SHA**：226a8d8442fae3dd56a9faeef16c02ebba949b2c
- **Skill Version**：v1.0.0
- **Task Type**：RELEASE
- **Local Path Hint**：11_Calendar-Card-App

---

## 目前狀態
可交付。v1.2.0 (Build 37) 升級、行動端快捷導航列、PWA 圖示與快取、舊 GitHub Pages 自動轉導機制已全數實作並上線。Firebase Hosting（正式頻道與預覽頻道）及 GitHub Pages 已成功發布並通過 HTTP 實測驗證。

## 本輪目標
1. 修正 `13_Project-Hub` 行事曆入口網址，由舊 GitHub Pages 改為直連 Firebase PWA 網址（`https://calendar-family-lianghao02.web.app/`）。
2. 在 `11_Calendar-Card-App` 實作舊 GitHub Pages 自動無縫轉導腳本，避免從舊書籤或舊網址開啟時停留在舊版 `1.1.2 Build 36`。
3. 重新建立部署包並部署至 Firebase Hosting（正式頻道與預覽頻道）。
4. 將 `codex/firebase-family` 合併推送至 `main` 分支以更新 GitHub Pages，完成雙重導向防護。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- GitHub Pages 綁定於 `main` 分支根目錄 `/`。
- 先前所有行動端操作列、PWA 快取與 Firebase 升級均在 `codex/firebase-family` 分支，因此未合併至 `main` 前舊 GitHub Pages 仍會顯示舊版。
- Firebase Hosting 正式網址為 `https://calendar-family-lianghao02.web.app/`。

## 已完成 (Completed)
- **13_Project-Hub**：
  - 更新 `data/projects.json`、`assets/js/main.js` 與 `README.md`，將行事曆連結導向 `https://calendar-family-lianghao02.web.app/`，標註為 `v1.2.0`。
  - 推送至 `origin/main`（Commit SHA `75c2858`），GitHub Pages 已更新上線。
- **11_Calendar-Card-App**：
  - 更新版號為 `1.2.0`（`package.json`、`index.html` 頁尾標註 `v1.2.0 (Build 37)`、`sw.js` 快取名稱升級為 `calendar-card-app-v2`）。
  - 在 `index.html` 增加自動轉導腳本，造訪 `lianghao02.github.io/Calendar-Card-App` 時立即以 `window.location.replace` 跳轉至 Firebase 網址並保留查詢參數與錨點。
  - 執行 `npm test`（21/21 項測試通過）。
  - 產生乾淨 `dist/pages` 部署包，成功部署至 Firebase Hosting 正式頻道與預覽頻道。
  - 將最新成果合併至 `main` 分支（Fast-forward）並推送至 `origin/main`，舊 GitHub Pages 具備自動轉導功能。

## 異動檔案 (Changed Files)
- `11_Calendar-Card-App`：
  - `index.html`：加入舊網址自動轉導邏輯。
  - `HANDOFF.md`：更新交付狀態與元資料。
- `13_Project-Hub`：
  - `data/projects.json`、`assets/js/main.js`、`README.md`：外連路徑調整。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 嚴格遵守憲法，不觸碰 `09_PaperSwitch` 等其他無關專案之未提交異動。
- 不修改既有 Firestore 安全規則與測試。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：無。
- **P3 (改善建議/暫緩)**：後續其他專案若有 PWA 化或導航列需求依梯隊排程處理。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test`：21/21 項測試完全通過（包含語法檢查、日期邏輯、舊模式 fallback、部署包純淨度測試）。
- Firebase Hosting 正式網址驗證：`curl.exe -s "https://calendar-family-lianghao02.web.app/"` 回傳包含 `v1.2.0 (Build 37)` 及 `mobile-bottom-bar` 快捷導航列。
- GitHub Pages 轉導驗證：`curl.exe -s "https://lianghao02.github.io/Calendar-Card-App/"` 回傳包含 `window.location.replace('https://calendar-family-lianghao02.web.app/...')`。
- Project-Hub 驗證：`curl.exe -s "https://lianghao02.github.io/Project-Hub/data/projects.json"` 行事曆 URL 已變更為 `https://calendar-family-lianghao02.web.app/`。

### 尚未驗證項目
- 使用者實機自手機瀏覽器開啟與 PWA 安裝操作。

### 已知風險 (Known Risks)
- 使用者若在手機瀏覽器開啟過舊網址且快取極度頑固，建議點擊瀏覽器「重新整理」以即刻套用轉址與新版快取。

## Git 狀態
- Commit：`226a8d8`
- Push：是（`codex/firebase-family` 與 `main` 皆已推送到 `origin`）
- Working Tree：Clean
- Branch：`codex/firebase-family`（已同步至 `main`）

## 下一步建議動作 (Next Recommended Action)
- 請使用者直接透過手機開啟 `https://lianghao02.github.io/Project-Hub/` 點擊「行事曆」，或直連 `https://calendar-family-lianghao02.web.app/` 進行實機操作與體驗手機底部快捷操作列。

## 發布狀態 (Release Status)
可發布（已正式發布上線）
