# Google Sheets 整合設定指南

## 📋 步驟一：設置 Google Sheets

1. **打開您的 Google Sheets**
   - 訪問：https://docs.google.com/spreadsheets/d/1e0Jw7ekhM0dVA8QXZAghrU2-8hoE3h3VAF6Wq7b8jDw/edit
   - 確保您已登入 Google 帳號

2. **確保工作表結構**
   - 工作表名稱應為 `Sheet1`（或在腳本中修改 SHEET_NAME）
   - 第一行應為標題行（腳本會自動創建）

## 📝 步驟二：部署 Google Apps Script

1. **打開 Apps Script 編輯器**
   - 在 Google Sheets 中，點擊頂部菜單：`擴充功能` → `Apps Script`

2. **複製腳本代碼**
   - 打開項目中的 `google-apps-script.js` 文件
   - 複製所有代碼

3. **貼上代碼**
   - 在 Apps Script 編輯器中，刪除現有的代碼
   - 貼上複製的代碼
   - 點擊 `💾 儲存` 按鈕
   - 可以將項目命名為 "HSK Learning System API"

4. **部署為網頁應用程式**
   - 點擊右上角的 `部署` → `新增部署作業`
   - 在「選取類型」中，點擊齒輪圖標，選擇 `網頁應用程式`

   **重要設定：**
   - 說明：輸入 "HSK API v1"
   - 執行身分：選擇 `我`
   - 存取權限：選擇 `所有人`（重要！否則無法從外部訪問）

   - 點擊 `部署` 按鈕

5. **授權應用程式**
   - 首次部署時，會要求授權
   - 點擊 `授權存取權`
   - 選擇您的 Google 帳號
   - 可能會出現「Google 尚未驗證這個應用程式」警告
     - 點擊 `進階` → `前往 HSK Learning System API (不安全)`
   - 點擊 `允許`

6. **複製部署 URL**
   - 部署成功後，會顯示一個 `網頁應用程式 URL`
   - 複製這個 URL，格式類似：
     ```
     https://script.google.com/macros/s/AKfycby.../exec
     ```

## 🔧 步驟三：更新前端網站

1. **打開網站配置**
   - 打開您的 HSK 學習系統網站
   - 網站會自動提示您輸入 Google Apps Script URL

2. **輸入 API URL**
   - 將複製的 URL 貼入設定框
   - 點擊保存

3. **測試連接**
   - 嘗試新增一個測試生詞
   - 檢查 Google Sheets 是否有新資料
   - 刷新網頁，確認資料同步

## ✅ 驗證設置

測試以下功能確保一切正常：

- ✅ 從 Google Sheets 讀取現有資料
- ✅ 新增生詞到 Google Sheets
- ✅ 刪除 Google Sheets 中的生詞
- ✅ 在 Google Sheets 中手動編輯，刷新網站後看到更新

## 🔄 資料結構

Google Sheets 將使用以下欄位：

| 欄位 | 說明 | 範例 |
|------|------|------|
| ID | 唯一識別碼 | 1701234567890 |
| 簡體字 | 中文簡體 | 学习 |
| 繁體字 | 中文繁體 | 學習 |
| 拼音 | 拼音標註 | xué xí |
| 詞性 | 詞性類別 | 動詞 |
| 泰文翻譯 | 泰文意思（\| 分隔） | การเรียน \| การศึกษา |
| 例句 | 例句（\| 分隔） | 我在学习中文 |
| HSK等級 | 1-9 | 1 |
| 創建時間 | ISO 時間戳 | 2024-01-01T12:00:00.000Z |

## 🛠️ 故障排除

### 問題：無法讀取數據
- 確認 Apps Script 部署時選擇了「所有人」權限
- 檢查 API URL 是否正確
- 嘗試重新部署 Apps Script

### 問題：CORS 錯誤
- Google Apps Script 應該自動處理 CORS
- 確保使用的是部署 URL，不是開發 URL

### 問題：授權失敗
- 重新授權：部署 → 管理部署 → 編輯 → 重新授權

### 問題：資料未同步
- 檢查瀏覽器控制台的錯誤訊息
- 確認 Google Sheets 的工作表名稱為 `Sheet1`
- 手動刷新網頁

## 📞 需要協助？

如有問題，請檢查：
1. Apps Script 的執行記錄（查看 → 執行作業）
2. 瀏覽器的開發者工具控制台
3. Google Sheets 的權限設定
