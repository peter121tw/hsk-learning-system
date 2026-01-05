/**
 * HSK 學習系統 - Google Apps Script 用戶認證系統
 *
 * 功能：
 * 1. 用戶驗證 (verifyUser)
 * 2. 登入失敗次數追蹤
 * 3. 帳號鎖定 (3次失敗後)
 * 4. 登入歷史記錄
 *
 * Google Sheets 結構：
 *
 * 「User」工作表：
 * A列: ID
 * B列: Username (用戶名)
 * C列: Password (密碼)
 * D列: LockTime (鎖定時間，空白表示未鎖定)
 * E列: FailCount (失敗次數)
 * F列: LastAttempt (最後嘗試時間)
 *
 * 「LoginHistory」工作表：
 * A列: ID
 * B列: Timestamp (時間戳)
 * C列: Username (用戶名)
 * D列: Success (成功/失敗)
 * E列: IP (IP地址)
 * F列: UserAgent (瀏覽器資訊)
 */

// 設定常量
const MAX_LOGIN_ATTEMPTS = 3; // 最大登入嘗試次數

/**
 * 處理 GET 請求
 * ⚠️ 此函數不能直接執行！請執行 initUserSystem 來初始化系統。
 */
function doGet(e) {
  // 檢查是否有參數（防止直接執行時報錯）
  if (!e || !e.parameter) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '此函數不能直接執行。請透過網頁應用程式 URL 調用，或執行 initUserSystem 來初始化系統。'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const action = e.parameter.action;
  let result;

  try {
    switch (action) {
      case 'verifyUser':
        result = verifyUser(e.parameter.username, e.parameter.password);
        break;
      case 'recordLoginHistory':
        result = recordLoginHistory(
          e.parameter.username,
          e.parameter.success === 'true',
          e.parameter.timestamp
        );
        break;
      case 'getLoginHistory':
        result = getLoginHistory();
        break;
      case 'unlockUser':
        result = unlockUser(e.parameter.username);
        break;
      default:
        result = { success: false, message: '未知的操作' };
    }
  } catch (error) {
    result = { success: false, message: error.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  return doGet(e);
}

/**
 * 驗證用戶
 * @param {string} username - 用戶名
 * @param {string} password - 密碼
 * @returns {Object} 驗證結果
 */
function verifyUser(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName('User');

  // 如果 User 工作表不存在，創建它
  if (!userSheet) {
    userSheet = ss.insertSheet('User');
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    // 添加預設管理員帳號
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);
    return { success: false, message: '用戶系統已初始化，請使用 admin / admin123 登入' };
  }

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];

  // 找出各欄位的索引
  const usernameCol = headers.indexOf('Username');
  const passwordCol = headers.indexOf('Password');
  const lockTimeCol = headers.indexOf('LockTime');
  const failCountCol = headers.indexOf('FailCount');
  const lastAttemptCol = headers.indexOf('LastAttempt');

  // 確保欄位存在
  if (usernameCol === -1 || passwordCol === -1) {
    return { success: false, message: '用戶工作表格式錯誤' };
  }

  // 如果沒有 LockTime、FailCount 欄位，添加它們
  if (lockTimeCol === -1) {
    const lastCol = headers.length;
    userSheet.getRange(1, lastCol + 1).setValue('LockTime');
  }
  if (failCountCol === -1) {
    const lastCol = headers.length + (lockTimeCol === -1 ? 1 : 0);
    userSheet.getRange(1, lastCol + 1).setValue('FailCount');
  }
  if (lastAttemptCol === -1) {
    const lastCol = headers.length + (lockTimeCol === -1 ? 1 : 0) + (failCountCol === -1 ? 1 : 0);
    userSheet.getRange(1, lastCol + 1).setValue('LastAttempt');
  }

  // 重新讀取資料
  const updatedData = userSheet.getDataRange().getValues();
  const updatedHeaders = updatedData[0];
  const lockTimeIndex = updatedHeaders.indexOf('LockTime');
  const failCountIndex = updatedHeaders.indexOf('FailCount');
  const lastAttemptIndex = updatedHeaders.indexOf('LastAttempt');

  // 搜尋用戶
  for (let i = 1; i < updatedData.length; i++) {
    const row = updatedData[i];
    if (row[usernameCol] === username) {
      const rowNum = i + 1;

      // 檢查是否被鎖定
      const lockTime = row[lockTimeIndex];
      if (lockTime && lockTime !== '') {
        return {
          success: false,
          message: '帳號已被鎖定',
          locked: true,
          lockTime: formatDate(lockTime)
        };
      }

      // 驗證密碼
      if (row[passwordCol] === password) {
        // 登入成功，重置失敗次數
        userSheet.getRange(rowNum, failCountIndex + 1).setValue(0);
        userSheet.getRange(rowNum, lastAttemptIndex + 1).setValue(new Date());

        // 記錄成功登入
        recordLoginHistory(username, true);

        return { success: true, message: '登入成功' };
      } else {
        // 密碼錯誤，增加失敗次數
        let failCount = parseInt(row[failCountIndex]) || 0;
        failCount++;

        userSheet.getRange(rowNum, failCountIndex + 1).setValue(failCount);
        userSheet.getRange(rowNum, lastAttemptIndex + 1).setValue(new Date());

        // 記錄失敗登入
        recordLoginHistory(username, false);

        // 檢查是否需要鎖定
        if (failCount >= MAX_LOGIN_ATTEMPTS) {
          const lockTimeStr = new Date();
          userSheet.getRange(rowNum, lockTimeIndex + 1).setValue(lockTimeStr);

          return {
            success: false,
            message: '登入失敗次數過多，帳號已被鎖定',
            locked: true,
            lockTime: formatDate(lockTimeStr)
          };
        }

        const remaining = MAX_LOGIN_ATTEMPTS - failCount;
        return {
          success: false,
          message: '密碼錯誤（剩餘 ' + remaining + ' 次嘗試機會）',
          attemptsRemaining: remaining
        };
      }
    }
  }

  // 用戶不存在
  return { success: false, message: '用戶不存在' };
}

/**
 * 記錄登入歷史
 * @param {string} username - 用戶名
 * @param {boolean} success - 是否成功
 * @param {string} timestamp - 時間戳（可選）
 * @returns {Object} 結果
 */
function recordLoginHistory(username, success, timestamp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let historySheet = ss.getSheetByName('LoginHistory');

  // 如果工作表不存在，創建它
  if (!historySheet) {
    historySheet = ss.insertSheet('LoginHistory');
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
  }

  // 生成新 ID
  const lastRow = historySheet.getLastRow();
  const newId = lastRow > 1 ? lastRow : 1;

  // 添加新記錄
  const recordTime = timestamp ? new Date(timestamp) : new Date();
  historySheet.appendRow([
    newId,
    recordTime,
    username,
    success ? '成功' : '失敗',
    '',  // IP（在瀏覽器端無法獲取真實 IP）
    ''   // UserAgent
  ]);

  return { success: true };
}

/**
 * 獲取登入歷史
 * @returns {Object} 登入歷史列表
 */
function getLoginHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName('LoginHistory');

  if (!historySheet) {
    return { success: true, history: [] };
  }

  const data = historySheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: true, history: [] };
  }

  const headers = data[0];
  const history = [];

  // 只取最近 100 條記錄
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

  return { success: true, history: history };
}

/**
 * 解鎖用戶帳號
 * @param {string} username - 用戶名
 * @returns {Object} 結果
 */
function unlockUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName('User');

  if (!userSheet) {
    return { success: false, message: '用戶工作表不存在' };
  }

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  const usernameCol = headers.indexOf('Username');
  const lockTimeCol = headers.indexOf('LockTime');
  const failCountCol = headers.indexOf('FailCount');

  for (let i = 1; i < data.length; i++) {
    if (data[i][usernameCol] === username) {
      const rowNum = i + 1;
      // 清除鎖定時間和失敗次數
      if (lockTimeCol !== -1) {
        userSheet.getRange(rowNum, lockTimeCol + 1).setValue('');
      }
      if (failCountCol !== -1) {
        userSheet.getRange(rowNum, failCountCol + 1).setValue(0);
      }
      return { success: true, message: '帳號已解鎖' };
    }
  }

  return { success: false, message: '用戶不存在' };
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期
 * @returns {string} 格式化的日期字符串
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

/**
 * 初始化用戶系統
 * 在 Google Apps Script 編輯器中手動運行此函數來初始化
 */
function initUserSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 創建 User 工作表
  let userSheet = ss.getSheetByName('User');
  if (!userSheet) {
    userSheet = ss.insertSheet('User');
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);

    // 設定欄位寬度
    userSheet.setColumnWidth(1, 50);
    userSheet.setColumnWidth(2, 120);
    userSheet.setColumnWidth(3, 120);
    userSheet.setColumnWidth(4, 150);
    userSheet.setColumnWidth(5, 80);
    userSheet.setColumnWidth(6, 150);
  }

  // 創建 LoginHistory 工作表
  let historySheet = ss.getSheetByName('LoginHistory');
  if (!historySheet) {
    historySheet = ss.insertSheet('LoginHistory');
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);

    // 設定欄位寬度
    historySheet.setColumnWidth(1, 50);
    historySheet.setColumnWidth(2, 150);
    historySheet.setColumnWidth(3, 120);
    historySheet.setColumnWidth(4, 80);
    historySheet.setColumnWidth(5, 120);
    historySheet.setColumnWidth(6, 200);
  }

  Logger.log('用戶系統初始化完成！');
  Logger.log('預設帳號：admin / admin123');
}
