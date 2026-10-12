# HANDOFF

## 核心元資料 (Metadata)
- **Repository**：lianghao02/Calendar-Card-App
- **Branch**：codex/firebase-family
- **Commit SHA**：316f8c1114fa71653df15ec4126d68a0cf1635f9（本輪未提交；開始時 HEAD）
- **Skill Version**：v1.0.0
- **Task Type**：IMPROVE
- **Local Path Hint**：11_Calendar-Card-App

---

## 目前狀態
進行中／待手機 CRUD、跨裝置及遷移驗收。2026-10-12 已建立獨立專案、台灣 Firestore、Google 登入及正式規則，發布七天手機測試版；使用者手機登入成功，首位家庭成員已核准並讀回確認。原 GAS 的 58 筆已備份，匯入副本已檢查、58 筆全部建立並逐筆讀回核對成功。原始碼 Firebase 仍預設關閉；未 Commit／Push、未切換原 GitHub Pages，不標記正式雲端版可交付。

## 本輪目標
使用者確認：家人共用同一份行程；獨立建立 Firebase 行事曆專案；保留 https://lianghao02.github.io/Calendar-Card-App/ 。承接前輪 README 成果，維持原生介面、週／月檢視、智慧輸入、重複行程與文字分享。

## 基準與已確認事實 (Baseline & Confirmed Facts)
開始時工作目錄乾淨。舊資料為日期對應行程陣列，原資料鍵 calendar_events_fallback；已核對原網站與本機 google_api_config.js 的 GAS 設定一致，唯讀取得 58 筆、52 個日期（2026-01-01 至 2026-07-16）。每位家人的其他本機內容尚未核對。原設定檔已由 Git 追蹤；本輪保留原檔，不重印值。正式網址 HTTP 讀取與來源核對成功。

## 已完成 (Completed)
- 本輪修復四項已評估問題並整理手機介面；新增 dialogs.js 原生表單／頁面內確認流程、草稿提醒、儲存回饋與帳號變更取消操作。新增月底導覽及確認流程測試，npm test 21 項、QA 及 diff 檢查通過。瀏覽器已實測新增、自訂重複、重新整理、跨日修改、換月及週／月切換；393px 測試無橫向溢出。
- 新版同一 Firebase 預覽頻道已發布，7 個主要檔案逐一 HTTP 核對一致；發布前後的 58 筆雲端內容完全一致，未修改資料或家庭權限。確認對話框後段因 Browser 工具受舊 confirm 阻塞，僅單元測試通過，手機驗收待完成。
- 本輪依使用者要求完成現有 HTML 頁面的商品品質評估，結果位於 project-scorecard.md；只修改評估／交接文件，沒有修改應用程式或資料庫。以使用者提供的手機照片、實際原始碼及本輪 Browser 的 393×852 手機 DOM 操作為依據，未宣稱完成新增截圖或已登入 CRUD 驗收。
- Firebase Authentication／Firestore 家庭成員存取、範圍監聽、每筆固定識別碼及交易版本防護；拒絕未登入／非成員／跨家庭／自行授權。
- 原本本機與 GAS 入口移至 legacy-api.js，尚未設定時繼續使用；損毀資料停止讀寫，不用空白覆寫。
- 完整 JSON 備份、最多 5,000 筆匯入預覽、100 筆分批可重試；匯入紀錄不覆寫，疑似相同一般行程提示，原來源保留。
- 新版編輯不依陣列位置存檔；跨日移動及重複新增共用交易。
- GitHub Pages 僅手動發布工作流程與部署包準備；實際 Firebase 設定用忽略的本機 JSON 或環境變數注入；正式包不含原 GAS Token。
- 實作計畫、設定／切換／復原說明與新版進度說明；前輪 README 說明保留。
- 使用官方 Firebase CLI 15.33.0／MCP 建立 calendar-family-lianghao02 與 Web App；Firestore Standard `(default)` 位於 asia-east1，未啟用帳單。Google provider、授權網域、正式規則已發布。
- 以官方 MCP 核對手機登入 UID 與已驗證 Google 帳號；建立 families/home/members/{uid} 的 active:true，使用 exists:false 避免覆寫，再讀回確認。UID／email／登入回應僅存忽略的 .cache，未放公開 Git。
- Firebase Hosting 預覽：https://calendar-family-lianghao02--family-preview-axvw16rd.web.app/ ，2026-10-19 21:06（台灣時間）到期；部署包不含原 GAS Token。
- 原始 GAS 回應、備份及 SHA256 核對在 .cache/calendar-migration-2026-10-12T10-42-27-333Z-eac0a06a。2 筆非標準網址在 calendar-backup.import-ready.json 副本中保留原文到備註，修正對照另存；58 筆／58 個固定識別碼通過匯入格式檢查，原始備份未變。匯入前另存最新 GAS 備份，核對仍是相同 58 筆；以官方 MCP 逐筆建立且 currentDocument.exists:false，58 筆全部匯入，原 Firebase 行程筆數為 0。匯入後讀回 58 筆，固定識別碼及 date/title/time/location/description/link 全欄位一致、revision 有效；雲端完整備份為 .cache/calendar-after-import-backup.json，驗證摘要為 .cache/import-verification-summary.json。

## 異動檔案 (Changed Files)
本輪修訂 index.html、style.css、ui/app/logic/state/family-controls/firebase-calendar/calendar-data、firebase.json；新增 dialogs.js、dialogs.test.mjs 與日期回歸測試；下列為先前 Firebase 實作仍未提交的異動。
核心：js/api.js、app.js、logic.js、state.js、ui.js、utils.js；新增 calendar-data.js、firebase-calendar.js、family-controls.js、legacy-api.js。
介面：index.html、style.css。
設定／交付：.gitignore、package.json、firebase-config.js、firebase.json、.firebaserc、firestore.indexes.json、firestore.rules、.github/workflows/pages.yml、scripts/check.mjs、scripts/prepare-pages.mjs。
測試：tests/calendar-data.test.mjs、legacy-data.test.mjs、pages-package.test.mjs、security.rules.mjs。
文件：AGENTS.md、README.md、IMPLEMENTATION_PLAN.md、FIREBASE_SETUP.md、HANDOFF.md。

## 刻意未修改 (Do Not Do / Deliberately Omitted)
不修改 google_api_config.js 原值、不將真實行程放入公開 Git 或網站靜態包、不切換正式 GitHub Pages；不修改其他專案。借用既有 Node Firebase 測試工具與模擬器，最新官方 CLI 快取於本專案 .cache/npm。Emulator CLI 設定隔離；正式 Firebase 管理使用已有登入憑證與官方 MCP，未輸出憑證。無背景推播、完整離線 PWA 或 Google Calendar 雙向同步。

## 尚未完成 (Remaining Work)
- **P1 (阻斷/必須)**：四項既有 UI 問題已修復並更新測試頻道：換月日期同步、週／月明細顯示、自訂結束日期、月底跳月。最終確認對話框的手機點擊驗收尚未完成。手機登入已成功，等待使用者完成新增、重新整理與刪除測試；第二位家庭帳號、非成員、跨裝置驗收。58 筆已匯入且資料核對成功，待使用者手機重新整理確認可見。正式切換前停止舊版編輯，核對本次匯入後舊來源的最新變動；其他裝置的本機資料另行核對。
- **P2 (重要/當次)**：手機頁首、資料選單、新增入口、送出按鈕、日期／行程鍵盤操作及原生對話框已整理；保留原功能。完整 UI 驗收及匯入前後筆數／內容核對。原 GAS Token 已存在追蹤檔，切換後停用；不得把它帶入正式部署包或擅自改寫歷史。
- **P3 (改善建議/暫緩)**：提醒、PWA、家庭邀請介面、雙向 Calendar 同步另案處理。

## 驗證結果 (Validation)
### 已執行測試與結果
- 全部 JavaScript 語法檢查通過。
- npm test：15 項資料／舊模式／部署包測試通過。
- Firestore Emulator：3 項規則測試通過，包含家庭共用、拒絕存取與格式／版本限制。
- 使用 Node 24.21.0、Java 21.0.9、既有 firebase-tools 15.33.0／firebase 13.0.0／rules-unit-testing 6.0.0／Firestore emulator 1.22.0。
- 第一輪 CLI 無法讀取個人設定；改用專案內 XDG_CONFIG_HOME 隔離後通過。
- 預期拒絕案例的 PERMISSION_DENIED 為測試成功條件。
- Pages YAML 已解析，只有 workflow_dispatch；工作流程尚未在 GitHub 執行。
- scripts/qa.ps1 與 git diff --check 通過；新增行尾空白已修正。
- 官方 MCP 規則驗證通過，CLI 正式 Auth／Firestore 規則發布成功。
- HTTPS 預覽部署成功；HTTP 200、runtime config 與部署包一致、legacy config 為空；原 GitHub 來源與 GAS 備份設定核對一致。
- 瀏覽器 DOM 實測 SDK 載入、週檢視及智慧輸入通過，載入時未見 error logs；使用者手機 Google 登入成功。正式首位成員文件 active:true 讀回確認。
- 管理 MCP 初次 listTools 因無關 developerknowledge 服務連線逾時；改官方 --only core,auth,firestore 後成功，橋接與請求／結果均為忽略的 .cache。
- GAS 原始資料與備份均 58 筆；原始備份保存不變，匯入副本 58 筆／58 個固定 ID 通過格式檢查。2026-10-12 19:39（台灣時間）Firebase 全部 58 筆建立成功、逐筆全內容核對通過；6 月 12 筆、7 月 1 筆（7/16），其餘月份 1 月 24、2 月 6、3 月 9、4 月 6。
- 手機登入提示修正後再次 npm test：15 項通過，scripts/qa.ps1 通過；瀏覽器 DOM 確認提示可見、SDK 就緒後登入按鈕可用，error logs 為空。截圖工具仍回報 Unable to capture screenshot，沒有截圖證據。修正版已更新相同預覽頻道，HTTP 逐檔核對 index.html、firebase-calendar.js、family-controls.js、api.js 與部署包完全一致。
- 本輪評估已重現四項 UI 問題；智慧輸入的 2026/1/31 草稿只開啟並取消，未儲存。送出按鈕約 13×18、上一頁約 37×40 CSS px；393×852 模擬下 clientWidth 378、scrollWidth 409，窄螢幕有溢出。
### 尚未驗證項目
使用者重新登入時回報 auth/popup-blocked，照片為 App 內瀏覽器介面。已加入繁體中文錯誤／外部 Safari 或 Chrome 操作提示、登入服務未就緒時停用按鈕；使用者最新手機照片已顯示家庭成員及家庭行事曆已同步，登入與雲端範圍讀取成功；CRUD 尚未回報。手機新增／修改／刪除、重新整理後持久保存、第二位成員、跨裝置仍待驗證；本次 58 筆遷移已讀回核對，手機可見性待回報。瀏覽器截圖 API 失敗，儲存互動時 CDP 逾時，不能宣稱完整 UI 通過。
### 已知風險 (Known Risks)
匯入分批不是整份原子寫入；已刪除的匯入行程再次匯入會重建。相同一般行程僅提示、不自動刪除。舊版非標準連結可備份，但須修正才能匯入。原 GAS 寫入仍為逐日流程；只有 Firebase 正常操作使用單一交易。回退不會把新雲端資料自動同步回 GAS。

## Git 狀態
- Commit：本輪無。
- Push：否。
- Working Tree：Modified，全部本輪異動；無未知既有修改。
- Branch：codex/firebase-family。

## 下一步建議動作 (Next Recommended Action)
本輪修訂已發布至相同測試網址，先請使用者重新整理，確認 6 月 12 筆及 7/16 行程，並驗收手機新增、修改、刪除與返回／確認操作。最終確認對話框已有單元測試，但 Browser 被舊版系統 confirm 卡住，getJsDialog 回傳 undefined、清理／導覽亦逾時；不得宣稱該段 Browser 驗收通過。先前 Firebase 工作斷點保留如下。
使用者已重新登入成功並顯示家庭行事曆已同步；下一步新增「Firebase 測試」、重新整理核對、刪除並回報；問題優先排除。58 筆已代為匯入，請使用者重新整理後核對 6 月 12 筆及 7/16 的 1 筆；不要重複建立或再次詢問相同匯入。匯入請求、逐筆回應及內容核對保存在忽略的 .cache/import-execution-*。至少完成第二位家人及跨裝置驗收。公開設定位於忽略的 firebase.local.json；正式 dist/pages 已存在，prepare-pages.mjs 會拒絕覆蓋，若修改程式須安全建立新部署包。GitHub Pages 授權網域 lianghao02.github.io；正式切換前取得必要提交／推送與部署授權。

## 發布狀態 (Release Status)
待進一步實測；Firebase 七天測試頻道已發布，正式家庭雲端版尚不可切換。現有 GitHub Pages 未變更。


## 2026-10-12 原始碼同步補充

使用者已授權本輪提交與推送所有專案，先前不提交／不推送的工作範圍限制由本輪授權取代。更新事項已依實際差異補入 CHANGELOG；提交 SHA 與推送結果以 Git log、遠端分支及控制中心同步報告為準。本輪不建立新 Release 或切換正式雲端網站；前述手機、跨帳號、跨裝置與跨電腦的待驗收項目保留。

行事曆另存 codex/firebase-family 分支，main 自動 Pages 發布保持原版。google_api_config.js 僅移出索引並列入忽略，本機原檔保留；不改寫 Git 歷史、不擅自停用舊服務。
