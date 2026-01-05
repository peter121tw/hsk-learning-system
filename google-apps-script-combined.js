/**
 * HSK 學習系統 - 合併版 Google Apps Script
 * ============================================
 *
 * 此腳本同時處理：
 * 1. 生詞資料的 CRUD 操作（Sheet1）
 * 2. 用戶認證功能（User 工作表）
 * 3. 登入歷史記錄（LoginHistory 工作表）
 *
 * ⚠️ 重要：請使用此合併版腳本替換原有的資料同步腳本
 *
 * 部署步驟：
 * 1. 創建或打開您的 Google Sheets
 * 2. 點擊「擴充功能」→「Apps Script」
 * 3. 刪除所有現有代碼
 * 4. 將此文件的所有代碼複製貼上
 * 5. 點擊「執行」，選擇「initSystem」函數來初始化系統
 * 6. 點擊「部署」→「新增部署作業」
 * 7. 類型選擇「網頁應用程式」
 * 8. 執行身分選擇「我」
 * 9. 存取權限選擇「所有人」
 * 10. 部署後複製「網頁應用程式 URL」
 * 11. 將 URL 貼到前端網站的設定中
 */

// ============================================
// 設定常量
// ============================================
const DATA_SHEET_NAME = 'Sheet1';    // 生詞資料工作表
const USER_SHEET_NAME = 'User';       // 用戶資料工作表
const HISTORY_SHEET_NAME = 'LoginHistory';  // 登入歷史工作表
const MAX_LOGIN_ATTEMPTS = 3;         // 最大登入嘗試次數

// 生詞欄位對應
const DATA_COLUMNS = {
  id: 0,
  simplified: 1,
  traditional: 2,
  pinyin: 3,
  word_type: 4,
  thai_meanings: 5,
  example_sentences: 6,
  hsk_level: 7,
  created_at: 8
};

// ============================================
// 主要請求處理
// ============================================

/**
 * 處理 GET 請求
 * 根據 action 參數決定執行的操作
 */
function doGet(e) {
  // 檢查是否有參數（防止直接執行時報錯）
  if (!e || !e.parameter) {
    return createJsonResponse({
      success: false,
      message: '此函數不能直接執行。請透過網頁應用程式 URL 調用，或執行 initSystem 來初始化系統。'
    });
  }

  const action = e.parameter.action;

  try {
    switch (action) {
      // 用戶認證相關
      case 'verifyUser':
        return verifyUser(e.parameter.username, e.parameter.password);

      case 'recordLoginHistory':
        return recordLoginHistory(
          e.parameter.username,
          e.parameter.success === 'true',
          e.parameter.timestamp
        );

      case 'getLoginHistory':
        return getLoginHistory();

      case 'unlockUser':
        return unlockUser(e.parameter.username);

      // 預設：讀取生詞資料
      default:
        return getWordData();
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.toString()
    });
  }
}

/**
 * 處理 POST 請求
 * 用於創建、更新、刪除生詞
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'create':
        return createWord(data.word);
      case 'delete':
        return deleteWord(data.id);
      case 'update':
        return updateWord(data.word);
      default:
        return createJsonResponse({
          success: false,
          error: 'Unknown action: ' + action
        });
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// 用戶認證功能
// ============================================

/**
 * 驗證用戶
 * @param {string} username - 用戶名
 * @param {string} password - 密碼
 * @returns {Object} 驗證結果，包含 authenticated 欄位
 *
 * ⚠️ 重要：
 * - 用戶名會去除前後空白後進行比對
 * - 密碼是區分大小寫的精確比對
 * - 返回值必須包含 authenticated 欄位以區別於資料回應
 */
function verifyUser(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName(USER_SHEET_NAME);

  // 去除用戶名前後空白（確保精確匹配）
  const trimmedUsername = username ? username.toString().trim() : '';
  const trimmedPassword = password ? password.toString() : '';

  // 如果 User 工作表不存在，創建它
  if (!userSheet) {
    userSheet = ss.insertSheet(USER_SHEET_NAME);
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);
    userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');

    return createJsonResponse({
      success: false,
      authenticated: false,
      message: '用戶系統已初始化，請使用 admin / admin123 登入'
    });
  }

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];

  // 找出各欄位的索引
  const usernameCol = headers.indexOf('Username');
  const passwordCol = headers.indexOf('Password');
  let lockTimeCol = headers.indexOf('LockTime');
  let failCountCol = headers.indexOf('FailCount');
  let lastAttemptCol = headers.indexOf('LastAttempt');

  // 確保欄位存在
  if (usernameCol === -1 || passwordCol === -1) {
    return createJsonResponse({
      success: false,
      authenticated: false,
      message: '用戶工作表格式錯誤，缺少 Username 或 Password 欄位'
    });
  }

  // 如果沒有 LockTime、FailCount、LastAttempt 欄位，添加它們
  if (lockTimeCol === -1) {
    const lastCol = headers.length;
    userSheet.getRange(1, lastCol + 1).setValue('LockTime');
    lockTimeCol = lastCol;
  }
  if (failCountCol === -1) {
    const lastCol = userSheet.getLastColumn();
    userSheet.getRange(1, lastCol + 1).setValue('FailCount');
    failCountCol = lastCol;
  }
  if (lastAttemptCol === -1) {
    const lastCol = userSheet.getLastColumn();
    userSheet.getRange(1, lastCol + 1).setValue('LastAttempt');
    lastAttemptCol = lastCol;
  }

  // 重新讀取資料以獲取更新後的欄位索引
  const updatedData = userSheet.getDataRange().getValues();
  const updatedHeaders = updatedData[0];
  lockTimeCol = updatedHeaders.indexOf('LockTime');
  failCountCol = updatedHeaders.indexOf('FailCount');
  lastAttemptCol = updatedHeaders.indexOf('LastAttempt');

  // 搜尋用戶
  for (let i = 1; i < updatedData.length; i++) {
    const row = updatedData[i];
    // 精確匹配：去除 Google Sheets 中用戶名的前後空白後進行比對
    const sheetUsername = row[usernameCol] ? row[usernameCol].toString().trim() : '';
    const sheetPassword = row[passwordCol] ? row[passwordCol].toString() : '';

    if (sheetUsername === trimmedUsername) {
      const rowNum = i + 1;

      // 檢查是否被鎖定
      const lockTime = row[lockTimeCol];
      if (lockTime && lockTime !== '') {
        return createJsonResponse({
          success: false,
          authenticated: false,
          message: '帳號已被鎖定',
          locked: true,
          lockTime: formatDate(lockTime)
        });
      }

      // 驗證密碼（精確匹配，區分大小寫）
      if (sheetPassword === trimmedPassword) {
        // 登入成功，重置失敗次數
        if (failCountCol !== -1) {
          userSheet.getRange(rowNum, failCountCol + 1).setValue(0);
        }
        if (lastAttemptCol !== -1) {
          userSheet.getRange(rowNum, lastAttemptCol + 1).setValue(new Date());
        }

        // 記錄成功登入
        recordLoginHistoryInternal(trimmedUsername, true);

        return createJsonResponse({
          success: true,
          authenticated: true,
          message: '登入成功',
          username: trimmedUsername
        });
      } else {
        // 密碼錯誤，增加失敗次數
        let failCount = parseInt(row[failCountCol]) || 0;
        failCount++;

        if (failCountCol !== -1) {
          userSheet.getRange(rowNum, failCountCol + 1).setValue(failCount);
        }
        if (lastAttemptCol !== -1) {
          userSheet.getRange(rowNum, lastAttemptCol + 1).setValue(new Date());
        }

        // 記錄失敗登入
        recordLoginHistoryInternal(trimmedUsername, false);

        // 檢查是否需要鎖定
        if (failCount >= MAX_LOGIN_ATTEMPTS) {
          const lockTimeStr = new Date();
          if (lockTimeCol !== -1) {
            userSheet.getRange(rowNum, lockTimeCol + 1).setValue(lockTimeStr);
          }

          return createJsonResponse({
            success: false,
            authenticated: false,
            message: '登入失敗次數過多，帳號已被鎖定',
            locked: true,
            lockTime: formatDate(lockTimeStr)
          });
        }

        const remaining = MAX_LOGIN_ATTEMPTS - failCount;
        return createJsonResponse({
          success: false,
          authenticated: false,
          message: '密碼錯誤（剩餘 ' + remaining + ' 次嘗試機會）',
          attemptsRemaining: remaining
        });
      }
    }
  }

  // 用戶不存在
  return createJsonResponse({
    success: false,
    authenticated: false,
    message: '用戶不存在'
  });
}

/**
 * 內部函數：記錄登入歷史
 */
function recordLoginHistoryInternal(username, success) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let historySheet = ss.getSheetByName(HISTORY_SHEET_NAME);

  if (!historySheet) {
    historySheet = ss.insertSheet(HISTORY_SHEET_NAME);
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
    historySheet.getRange('A1:F1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  }

  const lastRow = historySheet.getLastRow();
  const newId = lastRow > 0 ? lastRow : 1;

  historySheet.appendRow([
    newId,
    new Date(),
    username,
    success ? '成功' : '失敗',
    '',
    ''
  ]);
}

/**
 * API 函數：記錄登入歷史
 */
function recordLoginHistory(username, success, timestamp) {
  recordLoginHistoryInternal(username, success);
  return createJsonResponse({ success: true });
}

/**
 * 獲取登入歷史
 */
function getLoginHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(HISTORY_SHEET_NAME);

  if (!historySheet) {
    return createJsonResponse({ success: true, history: [] });
  }

  const data = historySheet.getDataRange().getValues();
  if (data.length <= 1) {
    return createJsonResponse({ success: true, history: [] });
  }

  const history = [];
  const startRow = Math.max(1, data.length - 100);

  for (let i = data.length - 1; i >= startRow; i--) {
    const row = data[i];
    history.push({
      id: row[0],
      timestamp: row[1] instanceof Date ? row[1].toISOString() : row[1],
      username: row[2],
      success: row[3] === '成功',
      ip: row[4] || '-',
      userAgent: row[5] || ''
    });
  }

  return createJsonResponse({ success: true, history: history });
}

/**
 * 解鎖用戶帳號
 */
function unlockUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(USER_SHEET_NAME);

  if (!userSheet) {
    return createJsonResponse({ success: false, message: '用戶工作表不存在' });
  }

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  const usernameCol = headers.indexOf('Username');
  const lockTimeCol = headers.indexOf('LockTime');
  const failCountCol = headers.indexOf('FailCount');

  for (let i = 1; i < data.length; i++) {
    const sheetUsername = data[i][usernameCol] ? data[i][usernameCol].toString().trim() : '';
    if (sheetUsername === username.trim()) {
      const rowNum = i + 1;
      if (lockTimeCol !== -1) {
        userSheet.getRange(rowNum, lockTimeCol + 1).setValue('');
      }
      if (failCountCol !== -1) {
        userSheet.getRange(rowNum, failCountCol + 1).setValue(0);
      }
      return createJsonResponse({ success: true, message: '帳號已解鎖' });
    }
  }

  return createJsonResponse({ success: false, message: '用戶不存在' });
}

// ============================================
// 生詞資料功能
// ============================================

/**
 * 讀取所有生詞資料
 */
function getWordData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DATA_SHEET_NAME);

  // 如果工作表不存在，創建它
  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    sheet.getRange(1, 1, 1, 9).setValues([[
      'ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間'
    ]]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');

    return createJsonResponse({
      success: true,
      data: []
    });
  }

  const lastRow = sheet.getLastRow();

  // 如果只有標題行或沒有數據
  if (lastRow <= 1) {
    return createJsonResponse({
      success: true,
      data: []
    });
  }

  // 讀取所有數據（跳過標題行）
  const range = sheet.getRange(2, 1, lastRow - 1, 9);
  const values = range.getValues();

  const data = values.map(row => ({
    id: row[DATA_COLUMNS.id]?.toString() || '',
    simplified: row[DATA_COLUMNS.simplified] || '',
    traditional: row[DATA_COLUMNS.traditional] || '',
    pinyin: row[DATA_COLUMNS.pinyin] || '',
    word_type: row[DATA_COLUMNS.word_type] || '',
    thai_meanings: row[DATA_COLUMNS.thai_meanings] || '',
    example_sentences: row[DATA_COLUMNS.example_sentences] || '',
    hsk_level: parseInt(row[DATA_COLUMNS.hsk_level]) || 1,
    created_at: row[DATA_COLUMNS.created_at] || ''
  })).filter(item => item.id);

  return createJsonResponse({
    success: true,
    data: data
  });
}

/**
 * 創建新生詞
 */
function createWord(word) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    sheet.getRange(1, 1, 1, 9).setValues([[
      'ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間'
    ]]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
  }

  const lastRow = sheet.getLastRow();

  const newRow = [
    word.id,
    word.simplified,
    word.traditional,
    word.pinyin,
    word.word_type,
    word.thai_meanings,
    word.example_sentences || '',
    word.hsk_level,
    word.created_at
  ];

  sheet.getRange(lastRow + 1, 1, 1, 9).setValues([newRow]);

  return createJsonResponse({
    success: true,
    message: 'Word created successfully'
  });
}

/**
 * 刪除生詞
 */
function deleteWord(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    return createJsonResponse({ success: false, error: 'Sheet not found' });
  }

  const lastRow = sheet.getLastRow();

  for (let i = 2; i <= lastRow; i++) {
    const cellId = sheet.getRange(i, 1).getValue().toString();
    if (cellId === id.toString()) {
      sheet.deleteRow(i);
      return createJsonResponse({
        success: true,
        message: 'Word deleted successfully'
      });
    }
  }

  return createJsonResponse({
    success: false,
    error: 'Word not found'
  });
}

/**
 * 更新生詞
 */
function updateWord(word) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    return createJsonResponse({ success: false, error: 'Sheet not found' });
  }

  const lastRow = sheet.getLastRow();

  for (let i = 2; i <= lastRow; i++) {
    const cellId = sheet.getRange(i, 1).getValue().toString();
    if (cellId === word.id.toString()) {
      const updatedRow = [
        word.id,
        word.simplified,
        word.traditional,
        word.pinyin,
        word.word_type,
        word.thai_meanings,
        word.example_sentences || '',
        word.hsk_level,
        word.created_at
      ];

      sheet.getRange(i, 1, 1, 9).setValues([updatedRow]);

      return createJsonResponse({
        success: true,
        message: 'Word updated successfully'
      });
    }
  }

  return createJsonResponse({
    success: false,
    error: 'Word not found'
  });
}

// ============================================
// 輔助函數
// ============================================

/**
 * 創建 JSON 回應
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
}

// ============================================
// 初始化函數
// ============================================

/**
 * 初始化系統
 * ⚠️ 請在 Apps Script 編輯器中手動運行此函數
 */
function initSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 創建或更新生詞資料工作表
  let dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!dataSheet) {
    dataSheet = ss.insertSheet(DATA_SHEET_NAME);
    dataSheet.getRange(1, 1, 1, 9).setValues([[
      'ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間'
    ]]);
    dataSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  }

  // 2. 創建或更新用戶工作表
  let userSheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!userSheet) {
    userSheet = ss.insertSheet(USER_SHEET_NAME);
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);
    userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    userSheet.setColumnWidth(1, 50);
    userSheet.setColumnWidth(2, 120);
    userSheet.setColumnWidth(3, 120);
    userSheet.setColumnWidth(4, 150);
    userSheet.setColumnWidth(5, 80);
    userSheet.setColumnWidth(6, 150);
  }

  // 3. 創建或更新登入歷史工作表
  let historySheet = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (!historySheet) {
    historySheet = ss.insertSheet(HISTORY_SHEET_NAME);
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
    historySheet.getRange('A1:F1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
    historySheet.setColumnWidth(1, 50);
    historySheet.setColumnWidth(2, 150);
    historySheet.setColumnWidth(3, 120);
    historySheet.setColumnWidth(4, 80);
    historySheet.setColumnWidth(5, 120);
    historySheet.setColumnWidth(6, 200);
  }

  // 顯示完成訊息
  SpreadsheetApp.getUi().alert(
    '✅ 系統初始化完成！\n\n' +
    '已創建以下工作表：\n' +
    '• Sheet1 - 生詞資料\n' +
    '• User - 用戶帳號\n' +
    '• LoginHistory - 登入記錄\n\n' +
    '預設管理員帳號：\n' +
    '用戶名：admin\n' +
    '密碼：admin123\n\n' +
    '請繼續進行「部署為網頁應用程式」步驟。'
  );

  Logger.log('系統初始化完成！');
  Logger.log('預設帳號：admin / admin123');
}

/**
 * 測試驗證功能（僅用於調試）
 */
function testVerify() {
  const result = verifyUser('admin', 'admin123');
  Logger.log(result.getContent());
}
