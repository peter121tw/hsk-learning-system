# HSK Learning System - 任務追蹤

## 已完成 ✅

- [x] 實現 Same.new 風格的登入彈窗
- [x] 連接 Google Sheets User 工作表進行用戶驗證
- [x] 限制登入失敗次數（3次）
- [x] 帳號鎖定功能並顯示鎖定時間
- [x] 記錄登入歷史
- [x] 確保用戶名和密碼精確匹配
- [x] 修復認證漏洞（嚴格檢查 authenticated 欄位）
- [x] 創建合併的 Google Apps Script 後端
- [x] 更新認證設置指南
- [x] 移除登入頁面的設定按鈕
- [x] 硬編碼 Google Apps Script URL
- [x] 部署到 GitHub Pages
- [x] 創建問題排除教學指南 (FIX_LOGIN_ERROR.md)

## 待辦事項 📋

- [ ] 用戶需要更新 Google Apps Script 到合併版腳本

## 用戶操作指南 📖

### 如果看到「Google Apps Script 未正確設置」錯誤：

請參考 `FIX_LOGIN_ERROR.md` 文件，按照以下步驟操作：

1. 打開 Google Sheets → 擴充功能 → Apps Script
2. 刪除所有現有代碼
3. 複製 `google-apps-script-combined.js` 的完整代碼
4. 選擇 `initSystem` 函數並執行
5. **重新部署**：部署 → 管理部署作業 → 編輯 → 新版本 → 部署

## 注意事項 ⚠️

- 現用 API URL: `https://script.google.com/macros/s/AKfycbyWXTEV9W1UJFm1BiaX4vx45v1UnQM0TcV4W1ttydcXrji7oHF4d0Ni4REw8Jlu5-eP/exec`
- GitHub Pages URL: `https://peter121tw.github.io/hsk-learning-system/`
- 確保 Google Apps Script 包含 `verifyUser` action 來處理用戶認證
- 每次修改腳本後，必須**重新部署**才能生效
