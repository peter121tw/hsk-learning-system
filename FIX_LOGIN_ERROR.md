# 🔧 修復登入錯誤：「Google Apps Script 未正確設置」

## 問題描述

登入時看到以下錯誤訊息：
```
Google Apps Script 未正確設置
請確認您的腳本包含用戶驗證功能（verifyUser action）
請參考 AUTH_SETUP_GUIDE.md 設置認證腳本
```

## 問題原因

您的 Google Apps Script 使用的是**舊版的資料同步腳本**，該腳本只能讀取/寫入生詞資料，但**缺少用戶驗證功能**。

您需要將腳本替換為**合併版腳本**（`google-apps-script-combined.js`），它同時包含：
- 生詞資料的 CRUD 操作
- 用戶認證功能（verifyUser）
- 登入歷史記錄

---

## 修復步驟

### 步驟 1：打開 Google Apps Script 編輯器

1. 打開您的 Google Sheets（HSK 學習系統）
2. 點擊上方選單 **「擴充功能」** → **「Apps Script」**

![打開 Apps Script](https://i.imgur.com/placeholder.png)

### 步驟 2：刪除現有的舊代碼

1. 在 Apps Script 編輯器中，您會看到現有的代碼
2. **全選所有代碼**（Ctrl+A 或 Cmd+A）
3. **刪除所有代碼**（按 Delete 或 Backspace）

### 步驟 3：複製新的合併版代碼

將以下**完整代碼**複製貼上到 Apps Script 編輯器中：

```javascript
/**
 * HSK 學習系統 - 合併版 Google Apps Script
 * ============================================
 * 此腳本同時處理：
 * 1. 生詞資料的 CRUD 操作（Sheet1）
 * 2. 用戶認證功能（User 工作表）
 * 3. 登入歷史記錄（LoginHistory 工作表）
 */

// 設定常量
const DATA_SHEET_NAME = 'Sheet1';
const USER_SHEET_NAME = 'User';
const HISTORY_SHEET_NAME = 'LoginHistory';
const MAX_LOGIN_ATTEMPTS = 3;

// 生詞欄位對應
const DATA_COLUMNS = {
  id: 0, simplified: 1, traditional: 2, pinyin: 3,
  word_type: 4, thai_meanings: 5, example_sentences: 6,
  hsk_level: 7, created_at: 8
};

// 處理 GET 請求
function doGet(e) {
  if (!e || !e.parameter) {
    return createJsonResponse({
      success: false,
      message: '此函數不能直接執行。請執行 initSystem 來初始化系統。'
    });
  }

  const action = e.parameter.action;

  try {
    switch (action) {
      case 'verifyUser':
        return verifyUser(e.parameter.username, e.parameter.password);
      case 'recordLoginHistory':
        return recordLoginHistory(e.parameter.username, e.parameter.success === 'true', e.parameter.timestamp);
      case 'getLoginHistory':
        return getLoginHistory();
      case 'unlockUser':
        return unlockUser(e.parameter.username);
      default:
        return getWordData();
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.toString() });
  }
}

// 處理 POST 請求
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'create': return createWord(data.word);
      case 'delete': return deleteWord(data.id);
      case 'update': return updateWord(data.word);
      default: return createJsonResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    return createJsonResponse({ success: false, error: error.message });
  }
}

// 驗證用戶
function verifyUser(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName(USER_SHEET_NAME);

  const trimmedUsername = username ? username.toString().trim() : '';
  const trimmedPassword = password ? password.toString() : '';

  if (!userSheet) {
    userSheet = ss.insertSheet(USER_SHEET_NAME);
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);
    userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
    return createJsonResponse({
      success: false, authenticated: false,
      message: '用戶系統已初始化，請使用 admin / admin123 登入'
    });
  }

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  const usernameCol = headers.indexOf('Username');
  const passwordCol = headers.indexOf('Password');
  let lockTimeCol = headers.indexOf('LockTime');
  let failCountCol = headers.indexOf('FailCount');
  let lastAttemptCol = headers.indexOf('LastAttempt');

  if (usernameCol === -1 || passwordCol === -1) {
    return createJsonResponse({
      success: false, authenticated: false,
      message: '用戶工作表格式錯誤'
    });
  }

  // 確保欄位存在
  if (lockTimeCol === -1) {
    userSheet.getRange(1, headers.length + 1).setValue('LockTime');
    lockTimeCol = headers.length;
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

  // 重新讀取資料
  const updatedData = userSheet.getDataRange().getValues();
  const updatedHeaders = updatedData[0];
  lockTimeCol = updatedHeaders.indexOf('LockTime');
  failCountCol = updatedHeaders.indexOf('FailCount');
  lastAttemptCol = updatedHeaders.indexOf('LastAttempt');

  // 搜尋用戶
  for (let i = 1; i < updatedData.length; i++) {
    const row = updatedData[i];
    const sheetUsername = row[usernameCol] ? row[usernameCol].toString().trim() : '';
    const sheetPassword = row[passwordCol] ? row[passwordCol].toString() : '';

    if (sheetUsername === trimmedUsername) {
      const rowNum = i + 1;

      // 檢查是否被鎖定
      const lockTime = row[lockTimeCol];
      if (lockTime && lockTime !== '') {
        return createJsonResponse({
          success: false, authenticated: false,
          message: '帳號已被鎖定', locked: true, lockTime: formatDate(lockTime)
        });
      }

      // 驗證密碼
      if (sheetPassword === trimmedPassword) {
        if (failCountCol !== -1) userSheet.getRange(rowNum, failCountCol + 1).setValue(0);
        if (lastAttemptCol !== -1) userSheet.getRange(rowNum, lastAttemptCol + 1).setValue(new Date());
        recordLoginHistoryInternal(trimmedUsername, true);
        return createJsonResponse({
          success: true, authenticated: true,
          message: '登入成功', username: trimmedUsername
        });
      } else {
        let failCount = parseInt(row[failCountCol]) || 0;
        failCount++;
        if (failCountCol !== -1) userSheet.getRange(rowNum, failCountCol + 1).setValue(failCount);
        if (lastAttemptCol !== -1) userSheet.getRange(rowNum, lastAttemptCol + 1).setValue(new Date());
        recordLoginHistoryInternal(trimmedUsername, false);

        if (failCount >= MAX_LOGIN_ATTEMPTS) {
          const lockTimeStr = new Date();
          if (lockTimeCol !== -1) userSheet.getRange(rowNum, lockTimeCol + 1).setValue(lockTimeStr);
          return createJsonResponse({
            success: false, authenticated: false,
            message: '登入失敗次數過多，帳號已被鎖定', locked: true, lockTime: formatDate(lockTimeStr)
          });
        }

        return createJsonResponse({
          success: false, authenticated: false,
          message: '密碼錯誤（剩餘 ' + (MAX_LOGIN_ATTEMPTS - failCount) + ' 次嘗試機會）',
          attemptsRemaining: MAX_LOGIN_ATTEMPTS - failCount
        });
      }
    }
  }

  return createJsonResponse({
    success: false, authenticated: false, message: '用戶不存在'
  });
}

// 內部函數：記錄登入歷史
function recordLoginHistoryInternal(username, success) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let historySheet = ss.getSheetByName(HISTORY_SHEET_NAME);

  if (!historySheet) {
    historySheet = ss.insertSheet(HISTORY_SHEET_NAME);
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
    historySheet.getRange('A1:F1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  }

  const lastRow = historySheet.getLastRow();
  historySheet.appendRow([lastRow > 0 ? lastRow : 1, new Date(), username, success ? '成功' : '失敗', '', '']);
}

// API：記錄登入歷史
function recordLoginHistory(username, success, timestamp) {
  recordLoginHistoryInternal(username, success);
  return createJsonResponse({ success: true });
}

// 獲取登入歷史
function getLoginHistory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName(HISTORY_SHEET_NAME);

  if (!historySheet) return createJsonResponse({ success: true, history: [] });

  const data = historySheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ success: true, history: [] });

  const history = [];
  for (let i = Math.min(data.length - 1, 100); i >= 1; i--) {
    const row = data[i];
    history.push({
      id: row[0],
      timestamp: row[1] instanceof Date ? row[1].toISOString() : row[1],
      username: row[2], success: row[3] === '成功', ip: row[4] || '-', userAgent: row[5] || ''
    });
  }
  return createJsonResponse({ success: true, history: history });
}

// 解鎖用戶
function unlockUser(username) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName(USER_SHEET_NAME);

  if (!userSheet) return createJsonResponse({ success: false, message: '用戶工作表不存在' });

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];
  const usernameCol = headers.indexOf('Username');
  const lockTimeCol = headers.indexOf('LockTime');
  const failCountCol = headers.indexOf('FailCount');

  for (let i = 1; i < data.length; i++) {
    if (data[i][usernameCol]?.toString().trim() === username.trim()) {
      const rowNum = i + 1;
      if (lockTimeCol !== -1) userSheet.getRange(rowNum, lockTimeCol + 1).setValue('');
      if (failCountCol !== -1) userSheet.getRange(rowNum, failCountCol + 1).setValue(0);
      return createJsonResponse({ success: true, message: '帳號已解鎖' });
    }
  }
  return createJsonResponse({ success: false, message: '用戶不存在' });
}

// 讀取生詞資料
function getWordData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    sheet.getRange(1, 1, 1, 9).setValues([['ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間']]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    return createJsonResponse({ success: true, data: [] });
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return createJsonResponse({ success: true, data: [] });

  const values = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const data = values.map(row => ({
    id: row[0]?.toString() || '', simplified: row[1] || '', traditional: row[2] || '',
    pinyin: row[3] || '', word_type: row[4] || '', thai_meanings: row[5] || '',
    example_sentences: row[6] || '', hsk_level: parseInt(row[7]) || 1, created_at: row[8] || ''
  })).filter(item => item.id);

  return createJsonResponse({ success: true, data: data });
}

// 創建生詞
function createWord(word) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    sheet.getRange(1, 1, 1, 9).setValues([['ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間']]);
  }

  sheet.appendRow([word.id, word.simplified, word.traditional, word.pinyin, word.word_type, word.thai_meanings, word.example_sentences || '', word.hsk_level, word.created_at]);
  return createJsonResponse({ success: true, message: 'Word created' });
}

// 刪除生詞
function deleteWord(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found' });

  const lastRow = sheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    if (sheet.getRange(i, 1).getValue().toString() === id.toString()) {
      sheet.deleteRow(i);
      return createJsonResponse({ success: true, message: 'Word deleted' });
    }
  }
  return createJsonResponse({ success: false, error: 'Word not found' });
}

// 更新生詞
function updateWord(word) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!sheet) return createJsonResponse({ success: false, error: 'Sheet not found' });

  const lastRow = sheet.getLastRow();
  for (let i = 2; i <= lastRow; i++) {
    if (sheet.getRange(i, 1).getValue().toString() === word.id.toString()) {
      sheet.getRange(i, 1, 1, 9).setValues([[word.id, word.simplified, word.traditional, word.pinyin, word.word_type, word.thai_meanings, word.example_sentences || '', word.hsk_level, word.created_at]]);
      return createJsonResponse({ success: true, message: 'Word updated' });
    }
  }
  return createJsonResponse({ success: false, error: 'Word not found' });
}

// 創建 JSON 回應
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// 格式化日期
function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

// ⭐ 初始化系統 - 請先執行此函數！
function initSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 創建生詞資料工作表
  let dataSheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!dataSheet) {
    dataSheet = ss.insertSheet(DATA_SHEET_NAME);
    dataSheet.getRange(1, 1, 1, 9).setValues([['ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間']]);
    dataSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  }

  // 創建用戶工作表
  let userSheet = ss.getSheetByName(USER_SHEET_NAME);
  if (!userSheet) {
    userSheet = ss.insertSheet(USER_SHEET_NAME);
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);
    userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  }

  // 創建登入歷史工作表
  let historySheet = ss.getSheetByName(HISTORY_SHEET_NAME);
  if (!historySheet) {
    historySheet = ss.insertSheet(HISTORY_SHEET_NAME);
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
    historySheet.getRange('A1:F1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  }

  SpreadsheetApp.getUi().alert(
    '✅ 系統初始化完成！\n\n' +
    '預設管理員帳號：\n' +
    '用戶名：admin\n' +
    '密碼：admin123\n\n' +
    '請繼續進行「部署為網頁應用程式」步驟。'
  );
}
```

### 步驟 4：保存代碼

1. 點擊 **「💾」保存按鈕**，或按 **Ctrl+S** (Windows) / **Cmd+S** (Mac)
2. 等待顯示「專案已儲存」

### 步驟 5：執行初始化函數

⚠️ **非常重要！**

1. 在編輯器頂部，找到函數選擇下拉選單
2. **選擇「initSystem」**（不要選擇 doGet！）

```
┌─────────────────────────────────────────────────────┐
│  [initSystem ▼]  [▶ 執行]  [偵錯]                   │
│       ↑                                             │
│   ⚠️ 必須選擇 initSystem                           │
└─────────────────────────────────────────────────────┘
```

3. 點擊 **「▶ 執行」** 按鈕
4. 首次執行會要求授權，請按照提示授權

### 步驟 6：重新部署

⚠️ **這是最重要的步驟！您必須重新部署才能生效！**

1. 點擊右上角的 **「部署」** 按鈕
2. 選擇 **「管理部署作業」**

```
┌─────────────────────────────────────────────────────┐
│  部署 ▼                                             │
│  ├─ 新增部署作業                                    │
│  ├─ 管理部署作業    ← 點這個                        │
│  └─ 測試部署作業                                    │
└─────────────────────────────────────────────────────┘
```

3. 在彈出視窗中，點擊右上角的 **「✏️ 編輯」** 按鈕
4. 在「版本」下拉選單中，選擇 **「新版本」**
5. 點擊 **「部署」**

```
┌─────────────────────────────────────────────────────┐
│  管理部署作業                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  網頁應用程式                          [✏️ 編輯]    │
│                                                     │
│  版本：[新版本 ▼]        ← 選擇「新版本」           │
│                                                     │
│                          [取消]  [部署]             │
└─────────────────────────────────────────────────────┘
```

### 步驟 7：確認 URL

部署成功後，您會看到 **「網頁應用程式 URL」**。

**請確認這個 URL 與您在網站中設置的 URL 一致！**

URL 格式範例：
```
https://script.google.com/macros/s/AKfycby.../exec
```

---

## 驗證修復是否成功

### 方法 1：在瀏覽器中測試 API

在瀏覽器網址列中輸入：

```
您的URL?action=verifyUser&username=admin&password=admin123
```

如果看到以下回應，表示設置成功：

```json
{
  "success": true,
  "authenticated": true,
  "message": "登入成功",
  "username": "admin"
}
```

如果看到的回應包含 `"data"` 欄位，表示仍然是舊腳本，請重新按照上述步驟操作。

### 方法 2：直接登入

1. 打開 HSK 學習系統網站
2. 使用預設帳號登入：
   - 用戶名：`admin`
   - 密碼：`admin123`

---

## 常見問題

### Q1：為什麼重新部署後還是無法登入？

**原因**：您可能只「保存」了代碼，但沒有「重新部署」。

**解決**：請務必按照步驟 6，選擇「管理部署作業」→「編輯」→「新版本」→「部署」。

### Q2：執行 initSystem 時出現錯誤？

**原因**：可能是權限問題。

**解決**：
1. 確認您已授權應用程式存取 Google Sheets
2. 如果看到「Google 尚未驗證這個應用程式」，點擊「進階」→「前往 XXX（不安全）」

### Q3：登入時顯示「連線 Google Sheets 失敗」？

**原因**：API URL 可能不正確。

**解決**：
1. 在網站中點擊「設定」按鈕
2. 輸入正確的 Google Apps Script URL
3. 確認 URL 是從「部署」頁面複製的

---

## 檢查清單

完成修復後，請確認：

- [ ] 已複製貼上完整的新代碼
- [ ] 已執行 `initSystem` 函數
- [ ] 已**重新部署**（選擇「新版本」）
- [ ] Google Sheets 中有 `User` 和 `LoginHistory` 工作表
- [ ] 瀏覽器測試 API 返回 `authenticated: true`
- [ ] 可以使用 admin / admin123 登入

---

*如果仍有問題，請截圖 Google Apps Script 編輯器的畫面和錯誤訊息。*
