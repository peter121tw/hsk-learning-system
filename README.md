# HSK 生詞卡學習系統

一個功能完整的 HSK 中文學習平台，支持與 Google Sheets 實時雙向同步。

## ✨ 主要功能

### 📚 生詞管理
- **瀏覽生詞**：查看所有已添加的生詞
- **搜尋功能**：支援簡體、繁體、拼音、泰文搜尋
- **按等級篩選**：快速找到指定 HSK 等級的生詞
- **新增生詞**：輸入簡體字自動轉換繁體字
- **刪除生詞**：一鍵刪除不需要的生詞

### 🎮 學習模式

系統提供 6 種不同的學習模式：

1. **📇 生詞卡模式**
   - 點擊卡片翻轉查看翻譯和例句
   - 適合記憶和複習

2. **✏️ 測驗模式**
   - 輸入正確的泰文翻譯
   - 即時反饋答案正確性

3. **🎯 選擇題模式**
   - 從四個選項中選擇正確答案
   - 動畫效果提示對錯

4. **⚡ 速度挑戰**
   - 60秒內答對越多越好
   - 測試反應速度和記憶力

5. **🎴 配對遊戲**
   - 翻牌找出中文和泰文的配對
   - 訓練記憶力的趣味方式

6. **👂 拼音練習**
   - 看拼音猜中文
   - 加強發音記憶

### 🔄 Google Sheets 同步

**全新設定界面：**
- 🎛️ **完整的設定面板**：點擊「⚙️ 設定」按鈕打開專業的設定界面
- 📊 **連接狀態顯示**：實時顯示是否已連接到 Google Sheets
- 💾 **保存 URL**：輸入並保存 Google Apps Script URL
- 🔍 **測試連接**：一鍵測試連接是否正常
- 🗑️ **清除連接**：隨時斷開 Google Sheets 連接
- 📖 **內建指南**：設定面板中包含完整部署步驟

**實時雙向同步功能：**
- ✅ 從 Google Sheets 讀取現有資料
- ✅ 新增生詞自動同步到 Google Sheets
- ✅ 刪除生詞即時更新 Google Sheets
- ✅ 在 Google Sheets 中編輯，網站自動更新
- ✅ 每 30 秒自動刷新保持同步
- ✅ 數據永久保存在 Google Sheets

## 🚀 快速開始

### 設置 Google Sheets 同步（推薦）

**方式一：使用設定界面（最簡單）**

1. 訪問您的 HSK 學習系統網站
2. 點擊右上角的「⚙️ 設定」按鈕
3. 在設定面板中查看詳細的部署指南
4. 跟隨步驟設置 Google Apps Script
5. 將部署 URL 貼到輸入框
6. 點擊「💾 保存 URL」
7. 使用「🔍 測試連接」確認連接正常
8. 開始使用！

**方式二：手動設置**

詳細步驟請參考 [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) 文件。

**簡要步驟：**

1. **準備 Google Sheets**
   - 打開您的 Google Sheets：
     https://docs.google.com/spreadsheets/d/1e0Jw7ekhM0dVA8QXZAghrU2-8hoE3h3VAF6Wq7b8jDw/edit

2. **部署 Apps Script**
   - 點擊「擴充功能」→「Apps Script」
   - 複製 `google-apps-script.js` 的代碼
   - 部署為網頁應用程式
   - 複製部署 URL

3. **連接網站**
   - 在網站中點擊「⚙️ 設定」按鈕
   - 輸入 Apps Script URL
   - 完成！

## 📊 數據結構

Google Sheets 使用以下欄位：

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

## 🎨 特色功能

- **簡繁自動轉換**：輸入簡體字自動生成繁體字
- **自定義詞性**：可以添加自己的詞性分類
- **自定義等級**：不限於標準 HSK 等級
- **響應式設計**：完美支持手機、平板、電腦
- **實時統計**：首頁顯示各等級的生詞數量
- **專業設定界面**：完整的 Google Sheets 管理功能
- **連接測試**：確保數據同步正常運作
- **本地控制台**：使用瀏覽器控制台管理設置

## 🛠️ 技術特點

- **前端框架**：原生 JavaScript + Tailwind CSS
- **數據存儲**：Google Sheets（通過 Apps Script API）
- **同步機制**：輪詢 + 事件觸發
- **字體轉換**：內建簡繁轉換字典
- **無後端**：純前端應用，無需服務器

## 📱 設定管理

### 使用設定界面（推薦）

點擊任何頁面右上角的「⚙️ 設定」按鈕，您可以：

1. **查看連接狀態**
   - 綠色指示器：已連接
   - 紅色指示器：未連接

2. **管理 API URL**
   - 輸入新的 URL
   - 更改現有的 URL
   - 清除連接

3. **測試連接**
   - 確保 API 正常運作
   - 查看詳細的錯誤訊息

4. **查看部署指南**
   - 內建完整的設置步驟
   - 快速參考文檔鏈接

## 📱 瀏覽器控制台命令

在瀏覽器控制台（F12）中可以使用這些命令：

```javascript
// 設置 Google Apps Script URL
window.setGoogleScriptUrl("https://script.google.com/macros/s/.../exec")

// 查看當前 URL
window.getGoogleScriptUrl()

// 清除 URL 設置
window.clearGoogleScriptUrl()

// 手動刷新數據
window.dataSdk.init(window._dataHandler)
```

## 🔧 開發

```bash
# 安裝依賴
bun install

# 啟動開發服務器
bun run dev

# 構建生產版本
bun run build
```

## 📝 文件說明

- `index.html` - 主要 HTML 文件
- `src/google-sheets-sdk.js` - Google Sheets API 集成
- `google-apps-script.js` - Google Apps Script 部署代碼
- `GOOGLE_SHEETS_SETUP.md` - 詳細部署指南
- `README.md` - 本文件

## ❓ 常見問題

### Q: 為什麼看不到數據？
A: 請確認已正確設置 Google Apps Script URL，並且 Apps Script 已部署且權限設置為「所有人」。

### Q: 如何備份數據？
A: 所有數據都存儲在 Google Sheets 中，Google 會自動備份。您也可以下載 Google Sheets 作為備份。

### Q: 可以離線使用嗎？
A: 需要網絡連接才能與 Google Sheets 同步。未來版本可能會添加離線模式。

### Q: 支持哪些瀏覽器？
A: 支持所有現代瀏覽器（Chrome、Firefox、Safari、Edge）。

### Q: 數據是否安全？
A: 數據存儲在您自己的 Google Sheets 中，只有您有權限訪問。

## 📄 授權

本項目僅供學習和個人使用。

## 🤝 貢獻

歡迎提交問題和改進建議！

---

**開發者提示**：查看瀏覽器控制台可以看到詳細的同步日誌和錯誤信息。
