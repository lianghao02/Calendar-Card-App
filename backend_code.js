/**
 * ------------------------------------------------------------------
 * Google Apps Script for Calendar Card App
 * ------------------------------------------------------------------
 * 請將此程式碼完整複製到 Google Apps Script 編輯器中 (副檔名 .gs)
 * 
 * 功能：
 * 1. 讀取/寫入 Google Sheet 資料
 * 2. 實作 API 流量限制 (Rate Limiting)
 * 3. 提供 GET/POST 接口供前端呼叫
 */

// --- 設定區 (請依需求調整) ---
const CONFIG = {
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
  return handleRequest(e, 'GET');
}

/**
 * 處理 POST 請求 (寫入資料)
 */
function doPost(e) {
  return handleRequest(e, 'POST');
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
      // 讀取所有資料
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
      // 解析請求內容
      const postData = JSON.parse(e.postData.contents);
      const action = postData.action; 
      
      if (action === 'save_day') {
        // 儲存單日行程
        // postData: { action: 'save_day', dateKey: '2026-01-01', events: [...] }
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
  // 簡單實作：讀取所有資料查找 Row Index (資料量大時建議優化，例如使用 Cache 或 Dictionary)
  // 考慮到這是個人日曆，資料量應在可控範圍
  
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
    // 如果 eventsArray 空的，要刪除這一行嗎？ 或許留著空陣列較安全
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
