# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/Calendar-Card-App
- **Branch**：main
- **Commit SHA**：1949324（本輪修改前基準；本輪升版尚未提交）
- **Skill Version**：v1.0.0
- **Task Type**：RELEASE
- **Local Path Hint**：11_Calendar-Card-App

---

## 目前狀態
待部署。v1.3.0 (Build 38) 版號已更新、測試通過、部署包已重建，但尚未提交、推送與部署；正式站目前是「Q 版內容＋v1.2.0 (Build 37) 版號」。

## 本輪目標
1. 2026-10-21 將 Q 版改版部署到 Firebase Hosting 正式站（使用者授權，只部署 Hosting）。
2. 部署後依使用者要求升版為 v1.3.0 (Build 38)，讓版號能區分改版前後。

## 基準與已確認事實 (Baseline & Confirmed Facts)
- `main` 與 `origin/main` 一致，工作目錄乾淨；`codex/firebase-family` 已合併並刪除，目前只使用 `main`。
- Firebase 專案 `calendar-family-lianghao02`，`firebase.json` 的 Hosting 來源為 `dist/pages`；CLI 使用 `17_Subscription-Manager` 內的 firebase-tools 15.33.0，帳號 tpc0941101090@gmail.com。

## 已完成 (Completed)
- **Q 版部署**：重建 `dist/pages` 後執行 `firebase deploy --only hosting --project calendar-family-lianghao02`，上傳 14 個檔案；線上 21 個檔案的 SHA-256 與部署包全部一致，瀏覽器開啟正式網址無錯誤，Service Worker 已註冊。
- **升版 v1.3.0 (Build 38)**：`package.json`／`package-lock.json`、`index.html` 頁尾、`README.md`（標題、徽章、新增 v1.3.0 更新重點）、`CHANGELOG.md`（未發布段落改為 v1.3.0）。
- **快取**：`sw.js` 快取名稱 `calendar-card-app-v3` → `v4`，部署後家人重新整理即取得新版號。
- **部署包**：以 v1.3.0 重建 `dist/pages`，頁尾為 `v1.3.0 (Build 38)`。

## 異動檔案 (Changed Files)
`package.json`、`package-lock.json`、`index.html`、`sw.js`、`README.md`、`CHANGELOG.md`、`HANDOFF.md`。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
- 未修改 JavaScript 邏輯、樣式、Firestore 規則或雲端資料；未部署 Firestore。
- 未建立 Git 標記或 GitHub Release。
- `package-lock.json` 原本停在 1.1.2，本輪一併對齊為 1.3.0。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：無。
- **P2 (重要/當次)**：提交並推送本輪升版；再部署 v1.3.0 到 Hosting，否則正式站頁尾仍顯示 v1.2.0 (Build 37)。
- **P3 (改善建議/暫緩)**：`dist/` 內已有 6 個 `pages-backup-*`／`pages-before-*` 舊部署包，確認不需要後可清理；`Calendar-Card-App-v1.1.2.zip` 找不到產生腳本。

## 驗證結果 (Validation)
### 已執行測試與結果
- `npm test` 21/21 通過；`node --check sw.js`、`node --check js/app.js` 與 `scripts/qa.ps1` 通過。
- v1.3.0 部署包：頁尾 `v1.3.0 (Build 38)`、`sw.js` 為 `calendar-card-app-v4`，其餘檔案與原始碼一致。
- Q 版正式站：線上 21 檔 SHA-256 一致、瀏覽器載入無錯誤（2026-10-21 部署）。
### 尚未驗證項目
- v1.3.0 尚未部署，線上版號未驗證；手機 PWA 與跨裝置操作仍待家人實機驗收。
### 已知風險 (Known Risks)
- 家人裝置的舊 Service Worker 快取可能需要重新整理一兩次才會換成新版。

## Git 狀態
- Commit：未提交（基準 1949324）
- Push：否
- Working Tree：Modified
- Branch：main

## 下一步建議動作 (Next Recommended Action)
提交 `chore: 升版至 v1.3.0 (Build 38)` 並推送，接著重新部署 Hosting，並逐檔比對線上 SHA-256。

## 發布狀態 (Release Status)
可發布（版號與部署包就緒，待提交與部署）

---

## 歷史交接快照（以下不是當前待辦或測試結果）

### 2026-10-20 2D Q 版介面接手收尾（Claude）
- 前一輪（其他 Agent，已結束）未提交的 Q 版改版，本輪已驗收並一併提交。範圍：`style.css` 與 `js/ui.js` 的選取日高亮條件。
- 修正內容：
  - 色彩變數調整：`--game-blue` 改為 `#2563EB`、`--game-green` 改為 `#047857`、`--danger-color` 改為 `#DC2626`。
  - 非本月日期的透明度從 0.48 調整為 0.78。
  - Service Worker 快取名稱改為 `calendar-card-app-v3`。
  - 空白日提示文字修正。
- 驗證：
  - `npm test` 21/21 通過。
  - `node --check js/app.js` 與 `scripts/qa.ps1` 通過。
  - 本機以 `http.server` 實測，視窗 1366×800 與手機 375×812：
    - 以智慧輸入新增「明天 18:00 家庭聚餐」，確認對話框正確解析並成功新增。
    - 月、週、行程對話框三個畫面的可見文字對比，皆無低於 4.5:1。
- 未做：
  - 沒有部署 Firebase Hosting，也沒有推送。
  - 沒有重建 `dist/`。
  - 沒有測試 Firebase 登入與家庭共用（核心邏輯未修改）。

### 2026-10-16 文件校正
#### 目前狀態
2026-10-16：家庭版與 main 已同步；GitHub Pages 已轉導 Firebase Hosting。README 的遷移前敘述已校正，於本輪提交並同步至家庭版與 main。

## 本輪目標
移除已失效的尚未切換敘述。

## 基準與已確認事實 (Baseline & Confirmed Facts)
起始分支 codex/firebase-family，工作目錄乾淨；既有交接已記載轉導上線證據。

## 已完成 (Completed)
校正 README 的 Pages 轉導與 npm test 涵蓋範圍，不變更雲端資料或部署。

## 異動檔案 (Changed Files)
README.md、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
未修改來源資產、既有發布包、全域憲法與共用 Skills；本輪提交並推送既有修正，不另建立 Release。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：本輪文件修正無阻斷項目。
- **P2 (重要/當次)**：手機 PWA 與跨裝置操作仍依原交接待驗收。
- **P3 (改善建議/暫緩)**：其他專案重構不在本輪範圍。

## 驗證結果 (Validation)
### 已執行測試與結果
npm test：21／21 通過，全部 JavaScript 語法檢查通過；README 差異已核對。未重跑雲端與跨裝置驗收。
### 尚未驗證項目
手機 PWA 與跨裝置操作仍依原交接待驗收。
### 已知風險 (Known Risks)
原始碼修正不會自動更新既有下載包或正式部署。

## Git 狀態
- Commit：本輪差異獨立提交；SHA 以包含本交接的 Git 記錄為準。
- Push：交付時核對 HEAD 與遠端追蹤分支一致。
- Working Tree：提交後以 git status 確認，未納入無關修改。
- Branch：codex/firebase-family。

## 下一步建議動作 (Next Recommended Action)
保留手機與跨裝置實測待辦；本輪不重新部署 Firebase。

## 發布狀態 (Release Status)
既有正式服務維持上線；本輪只同步文件，不變更雲端資料。

---

### 2026-10-14 v1.2.0 發布

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
