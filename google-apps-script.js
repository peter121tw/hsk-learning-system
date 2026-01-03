/**
 * Google Apps Script for HSK Learning System
 *
 * 部署步驟：
 * 1. 創建一個 Google Sheets
 * 2. 點擊「擴充功能」→「Apps Script」
 * 3. 將此文件的所有代碼複製到編輯器中
 * 4. 點擊「部署」→「新增部署作業」
 * 5. 類型選擇「網頁應用程式」
 * 6. 執行身分選擇「我」
 * 7. 存取權限選擇「所有人」
 * 8. 部署後複製「網頁應用程式 URL」
 * 9. 將 URL 貼到前端網站的設定中
 */

// 工作表名稱
const SHEET_NAME = 'Sheet1';

// 欄位對應
const COLUMNS = {
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

/**
 * 處理 GET 請求 - 讀取所有數據
 */
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 如果工作表不存在，創建它
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      // 設置標題行
      newSheet.getRange(1, 1, 1, 9).setValues([[
        'ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間'
      ]]);
      newSheet.getRange(1, 1, 1, 9).setFontWeight('bold');

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const lastRow = sheet.getLastRow();

    // 如果只有標題行或沒有數據
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 讀取所有數據（跳過標題行）
    const range = sheet.getRange(2, 1, lastRow - 1, 9);
    const values = range.getValues();

    const data = values.map(row => ({
      id: row[COLUMNS.id]?.toString() || '',
      simplified: row[COLUMNS.simplified] || '',
      traditional: row[COLUMNS.traditional] || '',
      pinyin: row[COLUMNS.pinyin] || '',
      word_type: row[COLUMNS.word_type] || '',
      thai_meanings: row[COLUMNS.thai_meanings] || '',
      example_sentences: row[COLUMNS.example_sentences] || '',
      hsk_level: parseInt(row[COLUMNS.hsk_level]) || 1,
      created_at: row[COLUMNS.created_at] || ''
    })).filter(item => item.id); // 過濾掉空行

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      data: data
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 POST 請求 - 創建、更新、刪除數據
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 確保工作表存在
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      newSheet.getRange(1, 1, 1, 9).setValues([[
        'ID', '簡體字', '繁體字', '拼音', '詞性', '泰文翻譯', '例句', 'HSK等級', '創建時間'
      ]]);
      newSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    }

    switch (action) {
      case 'create':
        return createWord(data.word);
      case 'delete':
        return deleteWord(data.id);
      case 'update':
        return updateWord(data.word);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unknown action'
        })).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 創建新生詞
 */
function createWord(word) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
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

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Word created successfully'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 刪除生詞
 */
function deleteWord(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  // 從第2行開始搜索（跳過標題行）
  for (let i = 2; i <= lastRow; i++) {
    const cellId = sheet.getRange(i, 1).getValue().toString();
    if (cellId === id.toString()) {
      sheet.deleteRow(i);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Word deleted successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Word not found'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 更新生詞
 */
function updateWord(word) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  // 從第2行開始搜索（跳過標題行）
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

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Word updated successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: false,
    error: 'Word not found'
  })).setMimeType(ContentService.MimeType.JSON);
}
