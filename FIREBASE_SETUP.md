正式網址：https://lianghao02.github.io/Calendar-Card-App/ （使用者確認，改版保留）

# 家庭共用行事曆設定與切換

## 尚未切換正式網站
原 GitHub Pages 繼續提供網站，Firebase 提供登入與家庭資料。`firebase-config.js` 預設 `enabled: false`，原本本機／GAS 模式仍可用。不要在備份、規則與帳號驗收完成前啟用。

## 已完成的實際設定（2026-10-12）

獨立 Spark 專案 calendar-family-lianghao02；Firestore Standard `(default)` 位於 asia-east1，未啟用帳單。Google provider、授權網域及正式規則已發布，首位成員由可信管理端核准並讀回確認。

手機測試版：https://calendar-family-lianghao02--family-preview-axvw16rd.web.app/ ，2026-10-19 19:08（台灣時間）到期。僅預覽頻道，原 GitHub Pages 尚未切換。手機已確認顯示家庭成員及家庭行事曆已同步；CRUD、跨裝置及第二位家人仍待驗收。

已從原網站相同的 GAS 來源唯讀備份 58 筆、52 個日期（2026-01-01 至 2026-07-16）。原始回應、備份、準備匯入副本及修正對照存於被忽略的 .cache/calendar-migration-2026-10-12T10-42-27-333Z-eac0a06a。2 筆非標準網址在副本中保留原文到備註，原始備份未改；58 筆及固定識別碼檢查通過；匯入前再次備份、核對來源內容未變，已透過可信管理端匯入 58 筆並從 Firebase 逐筆讀回核對。成員資料維持核准狀態；既有文件使用不存在前置條件保護，原來源未修改。匯入後雲端完整備份及驗證摘要位於被忽略的 .cache。正式切換前仍須停止舊版編輯並再次核對最新資料。

## 1. 先備份原行程
先在原 GitHub Pages 網址部署備份功能（維持 Firebase 關閉），從原本瀏覽器按「匯出目前資料」。本機原資料來源為 `calendar_events_fallback`；不同家人、瀏覽器或裝置可能各有資料。若使用 GAS，先確認讀取成功及來源狀態，再匯出。不得把讀取失敗的空白畫面當作成功備份。另保存 GAS 試算表副本。

## 2. 建立獨立 Firebase Spark 專案
建立行事曆專案及 Web App，不啟用 Analytics、不綁帳單。Authentication 開啟 Google provider；授權網域加入目前 GitHub Pages 的主機名稱（不含路徑），本專案為 `lianghao02.github.io`；本機測試需另外加入 `localhost`。建立 Firestore Standard `(default)` 正式模式，地區選擇須於建立前確認。

將 Web App 公開 apiKey、authDomain、projectId、appId 存入被 Git 忽略的 firebase.local.json，格式為 { "enabled": true, "familyId": "home", "config": { 四個公開欄位 } }。版本庫的 firebase-config.js 維持空白預設。執行 node scripts/prepare-pages.mjs 會注入設定到 dist/pages；本機驗收使用此目錄的靜態伺服器。這不是服務帳戶憑證；不可填入私鑰、密碼、管理端 Token。真正的資料權限由規則與成員文件決定。

## 3. 發布規則與建立家庭成員
將 `firestore.rules` 全文貼到 Firestore 規則並發布。先用部署包在本機／測試環境啟用，各人使用自己的 Google 帳號登入。尚未核准者畫面會顯示 UID；可從 Authentication 使用者清單取得。

在 Firestore 主控台建立 `families/home/members/{該使用者UID}`，欄位 `active` 型別 boolean、值 `true`。`home` 須與設定一致。成員文件只由主控台管理；網頁不能自行加入家庭，也不能列出全部成員。停用成員時把 `active` 改為 `false`，並驗證正在使用的連線被拒絕。

核准後登出再登入。至少核對兩個家庭帳號能共用、未登入及非成員不能讀寫，不可只用前端畫面測試權限。

## 4. 遷移前預覽
登入核准帳號，按「匯入家庭行程」，選步驟 1 的 JSON。確認筆數、日期、標題及會分享給家人的內容。相同匯入內容及出現次序產生固定識別碼；已存在的匯入紀錄略過，不覆寫修改後版本。一般新增行程若內容相同會提示疑似重複，須在匯入前自行確認；不直接刪除。

每批最多 100 筆，整份匯入不是單一交易。若中途失敗，保留已完成批次並用同一份檔案重試。已被刻意刪除的匯入行程，重新匯入會重新建立，請查看預覽。正常新增重複行程一次最多 100 筆。

## 5. 正式切換與復原
先停止舊版編輯並再匯出最新備份；確認 Firebase 資料後才發布新版與啟用設定。原 GitHub Pages 網址保留，使用者重新整理後登入。GitHub 的程式部署與 Firestore 規則發布分開驗證。同步為單向來源切換，不把新版變更自動回寫 GAS。

若需退回舊版，先停止新版編輯並匯出家庭雲端完整備份，再復原舊版程式及其資料；不能直接停用 Firebase 就認為最新雲端修改也已回到 GAS。本輪未 Commit／Push 或部署原 GitHub Pages；已發布 Firebase 規則、登入設定與七天測試頻道。

## 6. 驗收清單
- 新增、修改、刪除、跨日移動、重複行程、月／週切換、智慧輸入與文字分享。
- 兩個家庭帳號、手機與電腦即時更新；同筆衝突保留表單。
- 規則拒絕未登入、非成員、自行授權、非法欄位及跨家庭存取。
- 斷線及規則拒絕不顯示已儲存；登出不殘留資料；切換帳號不混用草稿。
- 全部歷史行程匯出不受目前畫面月份限制；取消匯入不寫入；重複及中途失敗重試。

Firebase Web SDK 使用固定版本官方模組；登入需要網路及瀏覽器允許彈出視窗。若遇到 auth/popup-blocked，請由 Safari 或 Chrome 開啟網址，iPhone 的 App 內頁面可用指南針／「在 Safari 開啟」操作；網頁會提供繁體中文提示。登入服務載入期間按鈕停用。雲端資料只使用記憶體快取，沒有背景推播或完整離線安裝能力。

## GitHub Pages 手動部署
原始碼中的 .github/workflows/pages.yml 只提供 workflow_dispatch，不會因 Push 自動切換。正式備份及驗收完成後，GitHub Repository 的 Pages Source 改為 GitHub Actions；新增 Actions secret FIREBASE_WEB_CONFIG，內容與 firebase.local.json 相同，再手動執行「家庭行事曆手動發布」。使用官方 checkout@v4、setup-node@v4、upload-pages-artifact@v3、deploy-pages@v4；部署工作需要 pages:write 與 id-token:write，僅用於 Pages 發布。原網址與 Repository 名稱保持不變。

正式部署包不含舊 GAS Token；切換前必須完成 GAS 備份。本輪發現原 google_api_config.js 已追蹤且包含共用 Token，未修改或重印原值。切換後應停用原 GAS Token；Git 歷史清理另行處理，不擅自改寫歷史。

## 規則測試工具
Node 24.12+、Java 21+；需官方 firebase-tools 15.33.0、firebase 13.0.0、@firebase/rules-unit-testing 6.0.0。工具可置於獨立開發目錄，以 CALENDAR_TEST_DEPENDENCIES 指向該目錄，不加入網站執行期相依套件。本輪使用既有工具，不安裝或修改其他專案。於專案執行 firebase emulators:exec --project demo-family-calendar --only firestore "node --test tests/security.rules.mjs"；只使用本機 demo 環境，不接觸正式資料。
