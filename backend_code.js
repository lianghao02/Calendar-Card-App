/**
 * ------------------------------------------------------------------
 * Google Apps Script for Calendar Card App
 * ------------------------------------------------------------------
 * 更新日期：2026-01-06
 * 更新內容：新增 API Token 安全驗證機制
 * 
 * 功能：
 * 1. 讀取/寫入 Google Sheet 資料
 * 2. 實作 API 流量限制 (Rate Limiting)
 * 3. 安全驗證：阻擋未帶 Token 的請求
 */

// --- 設定區 (請依需求調整) ---
const CONFIG = {
  // ⚠️ [重要] 請確保這裡的 Token 與前端 google_api_config.js 中的 apiToken 完全一致
  API_TOKEN: "CALENDAR_CARD_APP_2026", 

  // 每日最大請求次數限制
  MAX_DAILY_QUOTA: 5000, 
  // 警告門檻 (80%)
  WARNING_THRESHOLD: 0.8,
  // 阻擋門檻 (90%)
  BLOCK_THRESHOLD: 0.9,
  // 資料儲存的 Sheet 名稱
  SHEET_NAME: 'EventsData' 
};

/**
 * 處理 GET 請求 (讀取資料)
 */
function doGet(e) {
  // 安全檢查：驗證 URL 參數中的 token
  if (!verifyToken(e)) {
    return createError('403 Forbidden: Invalid or Missing Token');
  }
  return handleRequest(e, 'GET');
}

/**
 * 處理 POST 請求 (寫入資料)
 */
function doPost(e) {
  // POST 請求的核心驗證會在 handleRequest 解析 Body 後進行
  return handleRequest(e, 'POST');
}

/**
 * 驗證 GET 請求的參數
 */
function verifyToken(e) {
  if (e && e.parameter && e.parameter.token === CONFIG.API_TOKEN) {
    return true;
  }
  return false;
}

/**
 * 核心請求處理函式
 */
function handleRequest(e, method) {
  const lock = LockService.getScriptLock();
  // 嘗試取得鎖定 10秒，避免並發寫入衝突
  lock.tryLock(10000); 

  try {
    // 1. 檢查流量限制
    const quotaStatus = checkQuota();
    if (quotaStatus.isBlocked) {
      return createResponse({
        status: 'error',
        message: 'API 使用量已達 90% 上限，暫時停止服務。',
        quota: quotaStatus
      });
    }

    // 2. 取得試算表
    const sheet = getSheet();
    let result = {};
    
    if (method === 'GET') {
      // --- GET 邏輯 ---
      const data = sheet.getDataRange().getValues();
      const events = {};
      
      // 假設第一列是標題，從第二列開始讀取
      // 欄位結構 [Col A: DateKey, Col B: EventsJsonString]
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const dateKey = row[0];
        const jsonStr = row[1];
        if (dateKey && jsonStr) {
          try {
            events[dateKey] = JSON.parse(jsonStr);
          } catch (err) {
            // 忽略解析錯誤
          }
        }
      }
      result = { events: events };
      
    } else if (method === 'POST') {
      // --- POST 邏輯 ---
      if (!e.postData || !e.postData.contents) {
        throw new Error('Empty POST body');
      }

      const postData = JSON.parse(e.postData.contents);
      
      // 🔒 POST 安全檢查：驗證 JSON Payload 內的 apiToken
      if (postData.apiToken !== CONFIG.API_TOKEN) {
         return createError('403 Forbidden: Invalid Token in Payload');
      }

      const action = postData.action; 
      
      if (action === 'save_day') {
        // 儲存單日行程
        saveDayEvents(sheet, postData.dateKey, postData.events);
        result = { success: true };
      } else if (action === 'delete_day') {
          // 清空單日
          saveDayEvents(sheet, postData.dateKey, []);
          result = { success: true };
      }
       else {
        throw new Error('Unknown Action');
      }
    }

    return createResponse({
      status: 'success',
      data: result,
      quota: quotaStatus
    });

  } catch (err) {
    return createResponse({
      status: 'error',
      message: err.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 儲存某日的資料 (若存在則更新，不存在則新增)
 */
function saveDayEvents(sheet, dateKey, eventsArray) {
  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;
  
  // 搜尋該日期是否已存在 (Skip header)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == dateKey) {
      rowIndex = i + 1; // 1-based index
      break;
    }
  }
  
  const jsonStr = JSON.stringify(eventsArray);
  
  if (rowIndex > 0) {
    // 更新
    if (eventsArray.length === 0) {
        // 選擇刪除該行以節省空間
         sheet.deleteRow(rowIndex);
    } else {
         sheet.getRange(rowIndex, 2).setValue(jsonStr);
    }
  } else {
    // 新增 (如果不為空)
    if (eventsArray.length > 0) {
        sheet.appendRow([dateKey, jsonStr]);
    }
  }
}

/**
 * 取得或建立 Sheet
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    // 建立標題列
    sheet.appendRow(['DateKey', 'Events(JSON)']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * 檢查並更新流量額度
 */
function checkQuota() {
  const props = PropertiesService.getScriptProperties();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  let savedDate = props.getProperty('QUOTA_DATE');
  let currentCount = parseInt(props.getProperty('QUOTA_COUNT') || '0');
  
  // 換日重置
  if (savedDate !== today) {
    savedDate = today;
    currentCount = 0;
  }
  
  // 增加計數
  currentCount++;
  
  // 儲存
  props.setProperties({
    'QUOTA_DATE': savedDate,
    'QUOTA_COUNT': currentCount.toString()
  });
  
  const usageRatio = currentCount / CONFIG.MAX_DAILY_QUOTA;
  
  return {
    isBlocked: usageRatio >= CONFIG.BLOCK_THRESHOLD,
    isWarning: usageRatio >= CONFIG.WARNING_THRESHOLD,
    currentCount: currentCount,
    usageRatio: usageRatio
  };
}

/**
 * 建立標準 JSON 回應
 */
function createResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 建立錯誤回應
 */
function createError(msg) {
  return createResponse({
      status: 'error',
      message: msg
  });
}
