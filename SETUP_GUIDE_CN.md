# 🔗 設置 Google Sheets 雙向同步

## 📝 完整設置步驟（約 5 分鐘）

### 第一步：創建 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 點擊「空白」創建新試算表
3. 將試算表命名為「HSK 生詞庫」
4. 確保工作表名稱是 `Sheet1`（預設名稱）

---

### 第二步：部署 Google Apps Script

#### 2.1 打開 Apps Script 編輯器

1. 在您的 Google Sheets 中
2. 點擊頂部菜單：`擴充功能` → `Apps Script`
3. 會打開一個新視窗

#### 2.2 複製並貼上代碼

請查看項目中的 `google-apps-script.js` 文件，複製所有代碼到 Apps Script 編輯器中。

**重要步驟**：
1. 刪除編輯器中的現有代碼
2. 貼上完整的腳本代碼
3. 點擊 💾 儲存專案
4. 為專案命名：「HSK Learning System API」

---

#### 2.3 部署為網頁應用程式

1. 點擊右上角的 **「部署」** → **「新增部署作業」**
2. 點擊「選取類型」旁的 ⚙️ 齒輪圖標
3. 選擇 **「網頁應用程式」**
4. **重要設定**：
   - **說明**：輸入 `HSK API v1`
   - **執行身分**：選擇 **「我」**
   - **具備存取權的使用者**：選擇 **「所有人」** ⚠️ 非常重要！
5. 點擊 **「部署」** 按鈕

---

#### 2.4 授權應用程式（首次）

1. 會出現「需要授權」的提示，點擊 **「授權存取權」**
2. 選擇您的 Google 帳號
3. 可能會出現「Google 尚未驗證這個應用程式」的警告
   - 點擊 **「進階」**
   - 點擊 **「前往 HSK Learning System API (不安全)」**
4. 點擊 **「允許」**

---

#### 2.5 複製部署 URL

部署成功後，會看到：

```
✅ 已部署新項目

網頁應用程式
https://script.google.com/macros/s/AKfycby...很長的字串.../exec
```

**📋 複製這個完整的 URL**（包括 `https://` 到 `/exec`）

---

### 第三步：在網站中設定 URL

1. 打開您的 HSK 學習系統網站：
   https://peter121tw.github.io/hsk-learning-system/

2. 點擊右上角的 **「⚙️ 設定」** 按鈕

3. 在彈出的對話框中，**貼上您剛才複製的 URL**

4. 點擊確認

5. 頁面會重新載入並連接到您的 Google Sheets

---

### 第四步：測試同步

1. ✅ 點擊「新增生詞」，新增一個測試詞彙
2. ✅ 回到您的 Google Sheets，應該會看到新增的資料
3. ✅ 在 Google Sheets 中手動編輯一個詞彙
4. ✅ 回到網站刷新，應該會看到更新的資料

---

## 🎉 完成！

現在您的 HSK 學習系統已經與 Google Sheets 完全同步了！

### 功能特點：

- 📝 網站新增生詞 → 自動保存到 Google Sheets
- 🗑️ 網站刪除生詞 → Google Sheets 同步刪除
- ✏️ Google Sheets 編輯 → 網站自動更新（每 30 秒）
- ☁️ 資料雲端保存，永不遺失

---

## ❓ 常見問題

### Q: 如果我換了電腦，需要重新設定嗎？
A: 不需要！URL 會保存在瀏覽器的 localStorage 中。如果換電腦或清除瀏覽器數據，只需要重新輸入 URL 即可。

### Q: 別人可以訪問我的 Google Sheets 嗎？
A: 不會。雖然 API 設定為「所有人」，但只有知道完整 URL 的人才能訪問，這個 URL 非常長且隨機，基本不可能被猜到。

### Q: 如何重新設定 URL？
A: 在瀏覽器控制台（F12）中執行：
```javascript
window.setGoogleScriptUrl("您的新URL")
```

### Q: 如何清除 URL？
A: 在瀏覽器控制台中執行：
```javascript
window.clearGoogleScriptUrl()
```

---

## 🛠️ 故障排除

如果遇到問題：

1. **檢查控制台**：按 F12 查看錯誤訊息
2. **確認 URL**：確保複製了完整的 URL（包括 `/exec`）
3. **重新部署**：在 Apps Script 中重新部署一次
4. **權限設定**：確認部署時選擇了「所有人」
5. **工作表名稱**：確認 Google Sheets 的工作表名稱是 `Sheet1`

需要幫助？查看瀏覽器控制台的錯誤訊息可以幫助定位問題！
