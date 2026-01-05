# HSK 學習系統 - 用戶認證系統設置指南

本指南將幫助您設置 Google Sheets 用戶認證系統，包括登入失敗限制、帳號鎖定和登入歷史記錄功能。

---

## ⚠️ 重要更新

**請使用合併版腳本 `google-apps-script-combined.js`**

此版本將資料同步和用戶認證功能合併到一個腳本中，解決了以下問題：
- 認證驗證更嚴格，防止繞過登入
- 資料和認證使用同一個 API URL
- 更簡單的部署流程

---

## 📋 目錄

1. [功能說明](#功能說明)
2. [快速開始](#快速開始)
3. [詳細步驟](#詳細步驟)
4. [管理用戶帳號](#管理用戶帳號)
5. [常見問題](#常見問題)

---

## 功能說明

此認證系統提供以下功能：

| 功能 | 說明 |
|------|------|
| 用戶驗證 | 使用 Google Sheets 儲存的帳號密碼進行驗證 |
| 登入失敗限制 | 最多允許 3 次錯誤嘗試 |
| 帳號鎖定 | 3 次失敗後自動鎖定帳號 |
| 鎖定時間顯示 | 顯示帳號被鎖定的時間 |
| 登入歷史 | 記錄所有登入嘗試（成功/失敗） |
| 生詞資料同步 | 同時支持生詞資料的 CRUD 操作 |

---

## 快速開始

### 1. 創建 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 創建新的試算表
3. 命名為「HSK 學習系統」

### 2. 打開 Apps Script

1. 點擊「擴充功能」→「Apps Script」
2. 刪除預設代碼

### 3. 複製合併版腳本

將 `google-apps-script-combined.js` 的**完整代碼**複製貼上到編輯器中。

### 4. 初始化系統

1. 在函數選擇器中選擇「initSystem」
2. 點擊「▶ 執行」
3. 授權應用程式存取 Google Sheets

### 5. 部署為網頁應用程式

1. 點擊「部署」→「新增部署作業」
2. 類型選擇「網頁應用程式」
3. 執行身分選擇「我」
4. 存取權限選擇「**所有人**」⚠️ 重要！
5. 點擊「部署」
6. 複製「網頁應用程式 URL」

### 6. 在網站中設置

1. 打開 HSK 學習系統網站
2. 點擊「⚙️ 設定」按鈕
3. 貼上您的網頁應用程式 URL
4. 保存設定

---

## 詳細步驟

### 步驟一：創建 Google Sheets

### 1.1 創建新的試算表

1. 打開瀏覽器，前往 [Google Sheets](https://sheets.google.com)
2. 點擊左上角的 **「+ 空白」** 創建新的試算表
3. 將試算表命名為 **「HSK 學習系統 - 用戶資料」**（或您喜歡的名稱）

![創建新試算表](https://via.placeholder.com/600x300?text=創建新的+Google+Sheets)

### 1.2 記下試算表 ID

試算表的 URL 格式如下：
```
https://docs.google.com/spreadsheets/d/【試算表ID】/edit
```

例如：
```
https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit
```

中間的 `1ABC123xyz...` 就是您的試算表 ID，請記下來備用。

---

## 步驟二：打開 Apps Script 編輯器

### 2.1 進入 Apps Script

1. 在 Google Sheets 中，點擊上方選單的 **「擴充功能」**
2. 選擇 **「Apps Script」**

![打開 Apps Script](https://via.placeholder.com/600x200?text=擴充功能+→+Apps+Script)

### 2.2 認識編輯器介面

Apps Script 編輯器會在新分頁中打開，您會看到：

```
┌─────────────────────────────────────────────────────┐
│  未命名專案                               部署 ▼    │
├─────────────────────────────────────────────────────┤
│  📁 檔案                                            │
│  └─ 程式碼.gs                                       │
│                                                     │
│  function myFunction() {                            │
│                                                     │
│  }                                                  │
└─────────────────────────────────────────────────────┘
```

### 2.3 重命名專案

1. 點擊左上角的 **「未命名專案」**
2. 輸入專案名稱：**「HSK 用戶認證系統」**
3. 點擊 **「重新命名」**

---

## 步驟三：複製認證代碼

### 3.1 清除預設代碼

在編輯器中，您會看到預設的程式碼：

```javascript
function myFunction() {

}
```

**請全選並刪除這段代碼。**

### 3.2 複製以下完整代碼

將下面的代碼**完整複製**並**貼到編輯器中**：

```javascript
/**
 * HSK 學習系統 - Google Apps Script 用戶認證系統
 *
 * 功能：
 * 1. 用戶驗證 (verifyUser)
 * 2. 登入失敗次數追蹤
 * 3. 帳號鎖定 (3次失敗後)
 * 4. 登入歷史記錄
 */

// 設定常量
const MAX_LOGIN_ATTEMPTS = 3; // 最大登入嘗試次數

/**
 * 處理 GET 請求
 */
function doGet(e) {
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
 */
function verifyUser(username, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName('User');

  // 如果 User 工作表不存在，創建它
  if (!userSheet) {
    userSheet = ss.insertSheet('User');
    userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
    userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);
    return { success: false, message: '用戶系統已初始化，請使用 admin / admin123 登入' };
  }

  const data = userSheet.getDataRange().getValues();
  const headers = data[0];

  const usernameCol = headers.indexOf('Username');
  const passwordCol = headers.indexOf('Password');
  const lockTimeCol = headers.indexOf('LockTime');
  const failCountCol = headers.indexOf('FailCount');
  const lastAttemptCol = headers.indexOf('LastAttempt');

  if (usernameCol === -1 || passwordCol === -1) {
    return { success: false, message: '用戶工作表格式錯誤' };
  }

  // 搜尋用戶
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[usernameCol] === username) {
      const rowNum = i + 1;

      // 檢查是否被鎖定
      const lockTime = row[lockTimeCol];
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
        if (failCountCol !== -1) {
          userSheet.getRange(rowNum, failCountCol + 1).setValue(0);
        }
        if (lastAttemptCol !== -1) {
          userSheet.getRange(rowNum, lastAttemptCol + 1).setValue(new Date());
        }

        recordLoginHistory(username, true);
        return { success: true, message: '登入成功' };
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

        recordLoginHistory(username, false);

        // 檢查是否需要鎖定
        if (failCount >= MAX_LOGIN_ATTEMPTS) {
          const lockTimeStr = new Date();
          if (lockTimeCol !== -1) {
            userSheet.getRange(rowNum, lockTimeCol + 1).setValue(lockTimeStr);
          }

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

  return { success: false, message: '用戶不存在' };
}

/**
 * 記錄登入歷史
 */
function recordLoginHistory(username, success, timestamp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let historySheet = ss.getSheetByName('LoginHistory');

  if (!historySheet) {
    historySheet = ss.insertSheet('LoginHistory');
    historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
  }

  const lastRow = historySheet.getLastRow();
  const newId = lastRow > 1 ? lastRow : 1;
  const recordTime = timestamp ? new Date(timestamp) : new Date();

  historySheet.appendRow([
    newId,
    recordTime,
    username,
    success ? '成功' : '失敗',
    '',
    ''
  ]);

  return { success: true };
}

/**
 * 獲取登入歷史
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

  return { success: true, history: history };
}

/**
 * 解鎖用戶帳號
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
 * ⚠️ 請在 Apps Script 編輯器中手動運行此函數
 */
function initUserSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 創建 User 工作表
  let userSheet = ss.getSheetByName('User');
  if (!userSheet) {
    userSheet = ss.insertSheet('User');
  }

  // 清除現有內容並設置標題
  userSheet.clear();
  userSheet.getRange('A1:F1').setValues([['ID', 'Username', 'Password', 'LockTime', 'FailCount', 'LastAttempt']]);
  userSheet.getRange('A2:F2').setValues([[1, 'admin', 'admin123', '', 0, '']]);

  // 設定欄位樣式
  userSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  userSheet.setColumnWidth(1, 50);
  userSheet.setColumnWidth(2, 120);
  userSheet.setColumnWidth(3, 120);
  userSheet.setColumnWidth(4, 150);
  userSheet.setColumnWidth(5, 80);
  userSheet.setColumnWidth(6, 150);

  // 創建 LoginHistory 工作表
  let historySheet = ss.getSheetByName('LoginHistory');
  if (!historySheet) {
    historySheet = ss.insertSheet('LoginHistory');
  }

  historySheet.clear();
  historySheet.getRange('A1:F1').setValues([['ID', 'Timestamp', 'Username', 'Success', 'IP', 'UserAgent']]);
  historySheet.getRange('A1:F1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  historySheet.setColumnWidth(1, 50);
  historySheet.setColumnWidth(2, 150);
  historySheet.setColumnWidth(3, 120);
  historySheet.setColumnWidth(4, 80);
  historySheet.setColumnWidth(5, 120);
  historySheet.setColumnWidth(6, 200);

  // 顯示完成訊息
  SpreadsheetApp.getUi().alert(
    '✅ 用戶系統初始化完成！\n\n' +
    '預設管理員帳號：\n' +
    '用戶名：admin\n' +
    '密碼：admin123\n\n' +
    '請繼續進行「部署為網頁應用程式」步驟。'
  );
}
```

### 3.3 保存代碼

1. 點擊工具列上的 **「💾」保存按鈕**，或按 **Ctrl+S** (Windows) / **Cmd+S** (Mac)
2. 等待顯示「專案已儲存」

---

## 步驟四：初始化用戶系統

### 4.1 運行初始化函數

⚠️ **重要提醒：請務必選擇正確的函數！**

1. 在編輯器頂部，找到函數選擇下拉選單（預設可能顯示 `doGet` 或 `myFunction`）
2. **點擊下拉選單，選擇「initUserSystem」**

```
┌─────────────────────────────────────────────────────┐
│  [initUserSystem ▼]  [▶ 執行]  [偵錯]              │
│       ↑                                             │
│   ⚠️ 必須選擇 initUserSystem                        │
│   ❌ 不要選擇 doGet（會報錯）                        │
└─────────────────────────────────────────────────────┘
```

3. 點擊 **「▶ 執行」** 按鈕

> ⚠️ **常見錯誤**：如果您執行 `doGet` 會看到錯誤：
> `TypeError: Cannot read properties of undefined (reading 'parameter')`
> 這是因為 `doGet` 是用來處理網頁請求的，不能直接執行。

### 4.2 授權應用程式

首次執行時，系統會要求授權：

1. 彼出視窗顯示「需要授權」，點擊 **「查看權限」**
2. 選擇您的 Google 帳號
3. 可能會顯示「Google 尚未驗證這個應用程式」警告：
   - 點擊 **「進階」**
   - 點擊 **「前往 HSK 用戶認證系統（不安全）」**
4. 點擊 **「允許」** 授予權限

### 4.3 確認初始化成功

執行成功後，您會看到一個彈出視窗：

```
┌─────────────────────────────────────────────────────┐
│  ✅ 用戶系統初始化完成！                            │
│                                                     │
│  預設管理員帳號：                                    │
│  用戶名：admin                                       │
│  密碼：admin123                                      │
│                                                     │
│  請繼續進行「部署為網頁應用程式」步驟。              │
│                                                     │
│                                    [確定]           │
└─────────────────────────────────────────────────────┘
```

### 4.4 檢查工作表

回到 Google Sheets，您應該會看到兩個新的工作表：

- **User** - 包含預設管理員帳號
- **LoginHistory** - 空的登入記錄表

---

## 步驟五：部署為網頁應用程式

### 5.1 開始部署

1. 在 Apps Script 編輯器中，點擊右上角的 **「部署」** 按鈕
2. 選擇 **「新增部署作業」**

### 5.2 設定部署選項

在彈出的視窗中：

1. 點擊「選取類型」旁邊的 **⚙️ 齒輪圖示**
2. 選擇 **「網頁應用程式」**

### 5.3 填寫部署資訊

| 欄位 | 設定值 |
|------|--------|
| 說明 | `HSK 用戶認證系統 v1.0` |
| 執行身分 | **我** |
| 存取權限 | **所有人** ⚠️ 重要！ |

```
┌─────────────────────────────────────────────────────┐
│  新增部署作業                                        │
├─────────────────────────────────────────────────────┤
│  類型：網頁應用程式                                  │
│                                                     │
│  說明：HSK 用戶認證系統 v1.0                        │
│                                                     │
│  執行身分：我 (your-email@gmail.com)                │
│                                                     │
│  存取權限：所有人                      ← ⚠️ 重要！   │
│                                                     │
│                          [取消]  [部署]             │
└─────────────────────────────────────────────────────┘
```

### 5.4 完成部署

1. 點擊 **「部署」** 按鈕
2. 等待部署完成
3. 複製顯示的 **「網頁應用程式 URL」**

URL 格式類似：
```
https://script.google.com/macros/s/AKfycbx.../exec
```

⚠️ **請妥善保存這個 URL，之後需要用到！**

---

## 步驟六：在網站中設置 URL

### 6.1 打開 HSK 學習系統網站

1. 前往您的 HSK 學習系統網站
2. 您會看到登入彈窗

### 6.2 設置 Google Sheets URL

1. 使用預設帳號登入：`admin` / `admin123`
2. 登入後，點擊右上角的 **「⚙️ 設定」** 按鈕
3. 在彈出的對話框中，貼上您的 **網頁應用程式 URL**
4. 點擊 **「保存」**
5. 頁面會自動重新載入

### 6.3 測試連接

1. 登出系統
2. 重新登入，確認可以正常使用
3. 嘗試輸入錯誤密碼，確認會顯示剩餘嘗試次數

---

## Google Sheets 結構

系統會使用三個工作表：

### Sheet1（生詞資料）
| 欄位 | A | B | C | D | E | F | G | H | I |
|------|---|---|---|---|---|---|---|---|---|
| 名稱 | ID | 簡體字 | 繁體字 | 拼音 | 詞性 | 泰文翻譯 | 例句 | HSK等級 | 創建時間 |

### User（用戶資料）
| 欄位 | A | B | C | D | E | F |
|------|---|---|---|---|---|---|
| 名稱 | ID | Username | Password | LockTime | FailCount | LastAttempt |
| 說明 | 編號 | 用戶名 | 密碼 | 鎖定時間 | 失敗次數 | 最後嘗試時間 |

### LoginHistory（登入記錄）
| 欄位 | A | B | C | D | E | F |
|------|---|---|---|---|---|---|
| 名稱 | ID | Timestamp | Username | Success | IP | UserAgent |
| 說明 | 編號 | 時間戳 | 用戶名 | 成功/失敗 | IP地址 | 瀏覽器資訊 |

---

## 管理用戶帳號

### 新增用戶

1. 打開 Google Sheets
2. 在 **User** 工作表中新增一行：

| ID | Username | Password | LockTime | FailCount | LastAttempt |
|----|----------|----------|----------|-----------|-------------|
| 2  | student1 | pass123  |          | 0         |             |

### 解鎖被鎖定的帳號

**方法一：在 Google Sheets 中手動解鎖**

1. 打開 Google Sheets 的 **User** 工作表
2. 找到被鎖定的用戶
3. 清除 **D 欄 (LockTime)** 的內容
4. 將 **E 欄 (FailCount)** 設為 `0`

**方法二：使用 API 解鎖**

在瀏覽器中訪問：
```
https://script.google.com/macros/s/您的ID/exec?action=unlockUser&username=被鎖定的用戶名
```

---

## 常見問題

### Q1: 登入時顯示「Google Apps Script 未正確設置」？

**原因**：您可能使用的是舊版的資料同步腳本，該腳本不包含用戶驗證功能。

**解決方法**：
1. 打開 Google Apps Script
2. 刪除現有代碼
3. 複製貼上 `google-apps-script-combined.js` 的完整代碼
4. 執行「initSystem」函數
5. 重新部署為網頁應用程式

### Q2: 可以隨意用戶名和密碼登入？

**原因**：這是認證邏輯漏洞，舊版腳本的資料回應被誤認為是認證成功。

**解決方法**：
1. 確保使用最新版的前端代碼（index.html）
2. 確保使用合併版 Google Apps Script（google-apps-script-combined.js）
3. 重新部署 Google Apps Script

### Q3: 登入時顯示「用戶不存在」但我確定帳號存在？

**解決方法**：
1. 檢查 Google Sheets 中的用戶名是否有多餘空格
2. 確認輸入的用戶名與 Sheets 中完全一致
3. 用戶名會自動去除前後空白進行比對

### Q4: 登入時顯示「密碼錯誤」但我確定密碼正確？

**解決方法**：
1. 密碼區分大小寫，請確認大小寫正確
2. 檢查是否使用了全形字符
3. 確認 Google Sheets 中的密碼欄位沒有多餘空格

---

## 認證回應格式

成功的認證回應必須包含 `authenticated: true` 欄位：

```json
{
  "success": true,
  "authenticated": true,
  "message": "登入成功",
  "username": "admin"
}
```

失敗的認證回應：

```json
{
  "success": false,
  "authenticated": false,
  "message": "密碼錯誤（剩餘 2 次嘗試機會）",
  "attemptsRemaining": 2
}
```

⚠️ 注意：如果回應包含 `data` 欄位（資料回應），前端會拒絕登入。

---

## 安全建議

1. **定期更換密碼** - 建議每 3 個月更換一次管理員密碼
2. **不要分享 URL** - 網頁應用程式 URL 應該保密
3. **監控登入歷史** - 定期檢查是否有異常登入嘗試
4. **及時解鎖帳號** - 確認是本人後才解鎖被鎖定的帳號
5. **使用強密碼** - 密碼應包含大小寫字母和數字

---

*最後更新：2025年1月*
