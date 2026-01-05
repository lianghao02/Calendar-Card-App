# Google Sheet API 部署教學

請按照以下步驟，建立您的專屬 API：

## 步驟 1：建立 Google Sheet
1. 前往 **[Google Sheets](https://docs.google.com/spreadsheets)**。
2. 建立一個新的空白試算表。
3. 命名為 `Calendar-Events-DB` (或您喜歡的名字)。
4. **不需要**手動建立欄位，程式會自動建立。

## 步驟 2：建立 Google Apps Script
1. 在該試算表中，點擊上方選單的 **「擴充功能 (Extensions)」** > **「Apps Script」**。
2. 這會開啟一個新的程式碼編輯器視窗。
3. 刪除編輯器中預設的 `function myFunction() {...}` 程式碼。
4. 打開您電腦中的 `backend_code.js` 檔案，**複製所有內容**。
5. 將內容貼上到 Apps Script 編輯器中。
6. 按下 `Ctrl + S` 儲存，專案名稱可命名為 `CalendarAPI`。

## 步驟 3：初次執行與授權
1. 在編輯器上方工具列，選擇 `doGet` 函式 (預設可能是 `myFunction`)。
2. 點擊 **「執行 (Run)」** 按鈕。
3. 系統會跳出 **「審查權限 (Review Permissions)」** 視窗，請點擊並選擇您的 Google 帳號。
4. **重要/警示畫面**：因為這是您自己寫的腳本，Google 會跳出「Google 尚未驗證應用程式」的警示。
    *   請點擊左下角的 **「進階 (Advanced)」**。
    *   再點擊最下方的 **「前往 CalendarAPI (不安全)」** (Go to ... (unsafe))。
    *   點擊 **「允許 (Allow)」**。
5. 接著您會在下方執行紀錄看到錯誤訊息 `TypeError: Cannot read properties of undefined (reading 'parameter')`。
    *   **這是正常的！** 因為我們直接執行 `doGet` 但沒有透過網頁傳參數。
    *   這一步的目的是為了讓腳本取得讀寫試算表的權限。

## 步驟 4：部署為 Web App API
1. 點擊編輯器右上角的 **「部署 (Deploy)」** > **「新增部署 (New deployment)」**。
2. 在左側齒輪圖示旁，確認選擇類型為 **「網頁應用程式 (Web app)」**。
3. 填寫設定：
    *   **說明 (Description)**：`v1`
    *   **執行身分 (Execute as)**：**「我 (Me)」** (這很重要！這樣才會用您的配額與權限)。
    *   **誰可以存取 (Who has access)**：**「任何人 (Anyone)」** (這也很重要！這樣您的網頁才能呼叫 API)。
4. 點擊 **「部署 (Deploy)」**。
5. 複製生成的 **「網頁應用程式網址 (Web app URL)」** (結尾是 `/exec`)。

## 步驟 5：回報網址
請將該網址貼給我，我將幫您整合到前端程式碼中。
