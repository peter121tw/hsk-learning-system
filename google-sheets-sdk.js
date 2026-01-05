/**
 * Google Sheets SDK for HSK Learning System
 * 這個文件提供與 Google Sheets 的雙向同步功能
 */

// Google Sheets API 配置
// 檢查 URL 參數中是否有 API URL（用於跨設備設置）
const urlParams = new URLSearchParams(window.location.search);
const urlApiParam = urlParams.get('api');

if (urlApiParam) {
  // 如果 URL 中有 api 參數，保存它並重新載入（移除參數）
  const decodedUrl = decodeURIComponent(urlApiParam);
  localStorage.setItem('google_script_url', decodedUrl);
  console.log('✅ 已通過 URL 參數設置 API URL');
  // 移除 URL 參數並重新載入
  window.history.replaceState({}, document.title, window.location.pathname);
  window.location.reload();
}

// 新版 API URL（包含用戶認證功能）
const NEW_API_URL = 'https://script.google.com/macros/s/AKfycbyWXTEV9W1UJFm1BiaX4vx45v1UnQM0TcV4W1ttydcXrji7oHF4d0Ni4REw8Jlu5-eP/exec';

// 舊版 API URL（需要遷移）
const OLD_API_URL = 'https://script.google.com/macros/s/AKfycbybKYO7wJ3i9S12912i8I7sy5-kf-td9_s2tk-plblfL5tTHuxSm74fw6sjsQ6Qagdf/exec';

// 檢查是否需要遷移舊 URL
const storedUrl = localStorage.getItem('google_script_url');
if (storedUrl === OLD_API_URL || !storedUrl) {
  // 遷移到新 URL
  localStorage.setItem('google_script_url', NEW_API_URL);
  console.log('🔄 已遷移到新版 API URL');
}

let GOOGLE_SCRIPT_URL = localStorage.getItem('google_script_url') || NEW_API_URL;

// 設置 API URL 的函數
window.setGoogleScriptUrl = function(url) {
  GOOGLE_SCRIPT_URL = url;
  localStorage.setItem('google_script_url', url);
  console.log('✅ Google Apps Script URL 已保存:', url);

  // 重新加載數據
  if (window._dataHandler) {
    window.dataSdk.init(window._dataHandler);
  }

  return true;
};

// 獲取當前 URL
window.getGoogleScriptUrl = function() {
  return GOOGLE_SCRIPT_URL;
};

// 清除 URL
window.clearGoogleScriptUrl = function() {
  GOOGLE_SCRIPT_URL = '';
  localStorage.removeItem('google_script_url');
  console.log('🗑️ Google Apps Script URL 已清除');
};

// 生成跨設備設置鏈接
window.getSetupLink = function() {
  if (!GOOGLE_SCRIPT_URL) {
    return '尚未設置 API URL';
  }
  const baseUrl = window.location.origin + window.location.pathname;
  const setupLink = `${baseUrl}?api=${encodeURIComponent(GOOGLE_SCRIPT_URL)}`;
  return setupLink;
};

// 複製設置鏈接到剪貼板
window.copySetupLink = function() {
  const link = window.getSetupLink();
  if (link === '尚未設置 API URL') {
    alert('❌ 請先設置 Google Apps Script URL');
    return false;
  }

  // 嘗試使用 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      alert('✅ 設置鏈接已複製！\n\n在其他設備上打開這個鏈接，即可自動配置。\n\n' + link);
    }).catch(() => {
      // 如果失敗，顯示鏈接讓用戶手動複製
      prompt('請複製這個鏈接（在其他設備上打開即可自動配置）：', link);
    });
  } else {
    // 舊版瀏覽器，使用 prompt
    prompt('請複製這個鏈接（在其他設備上打開即可自動配置）：', link);
  }
  return true;
};

// Google Sheets 數據 SDK
window.dataSdk = {
  async init(handler) {
    window._dataHandler = handler;

    // 如果沒有配置 URL，顯示設置提示
    if (!GOOGLE_SCRIPT_URL) {
      console.warn('⚠️ 尚未設置 Google Apps Script URL - 將在稍後提示設置');
      setTimeout(() => handler.onDataChanged([]), 100);
      return { isOk: true };
    }

    try {
      console.log('📡 正在從 Google Sheets 讀取數據...');

      // 從 Google Sheets 讀取數據
      const response = await fetch(GOOGLE_SCRIPT_URL + '?t=' + Date.now(), {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-cache'
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ 成功從 Google Sheets 讀取 ${result.data.length} 筆資料`);
        setTimeout(() => handler.onDataChanged(result.data), 100);
      } else {
        console.error('❌ 讀取失敗:', result.error);
        setTimeout(() => handler.onDataChanged([]), 100);
      }

      return { isOk: result.success };
    } catch (error) {
      console.error('❌ 連接 Google Sheets 時發生錯誤:', error);
      console.log('💡 提示: 請確認您的 Google Apps Script URL 是否正確，並已正確部署');
      setTimeout(() => handler.onDataChanged([]), 100);
      return { isOk: false };
    }
  },

  async create(wordData) {
    if (!GOOGLE_SCRIPT_URL) {
      alert('❌ 錯誤：尚未設置 Google Apps Script URL\n\n請先設置 API 連接！');
      return { isOk: false, error: '尚未設置 Google Apps Script URL' };
    }

    try {
      console.log('📤 正在新增生詞到 Google Sheets...');

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script 需要
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          word: wordData
        }),
        redirect: 'follow'
      });

      console.log('✅ 生詞已新增到 Google Sheets');

      // 等待一下讓 Google Sheets 更新
      await new Promise(resolve => setTimeout(resolve, 500));

      // 重新讀取數據以更新
      if (window._dataHandler) {
        await this.init(window._dataHandler);
      }

      return { isOk: true };
    } catch (error) {
      console.error('❌ 新增失敗:', error);
      return { isOk: false, error: error.message };
    }
  },

  async delete(word) {
    if (!GOOGLE_SCRIPT_URL) {
      alert('❌ 錯誤：尚未設置 Google Apps Script URL\n\n請先設置 API 連接！');
      return { isOk: false, error: '尚未設置 Google Apps Script URL' };
    }

    try {
      console.log('🗑️ 正在從 Google Sheets 刪除生詞...');

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: word.id
        }),
        redirect: 'follow'
      });

      console.log('✅ 生詞已從 Google Sheets 刪除');

      // 等待一下讓 Google Sheets 更新
      await new Promise(resolve => setTimeout(resolve, 500));

      // 重新讀取數據以更新
      if (window._dataHandler) {
        await this.init(window._dataHandler);
      }

      return { isOk: true };
    } catch (error) {
      console.error('❌ 刪除失敗:', error);
      return { isOk: false, error: error.message };
    }
  },

  async update(wordData) {
    if (!GOOGLE_SCRIPT_URL) {
      alert('❌ 錯誤：尚未設置 Google Apps Script URL\n\n請先設置 API 連接！');
      return { isOk: false, error: '尚未設置 Google Apps Script URL' };
    }

    try {
      console.log('📝 正在更新 Google Sheets 中的生詞...');

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          word: wordData
        }),
        redirect: 'follow'
      });

      console.log('✅ 生詞已在 Google Sheets 中更新');

      // 等待一下讓 Google Sheets 更新
      await new Promise(resolve => setTimeout(resolve, 500));

      // 重新讀取數據以更新
      if (window._dataHandler) {
        await this.init(window._dataHandler);
      }

      return { isOk: true };
    } catch (error) {
      console.error('❌ 更新失敗:', error);
      return { isOk: false, error: error.message };
    }
  }
};

// 元素配置 SDK
window.elementSdk = {
  config: {},
  _onConfigChange: null,

  async init(options) {
    this.config = options.defaultConfig;
    this._onConfigChange = options.onConfigChange;

    // 延遲檢查，給頁面一些時間加載
    setTimeout(() => {
      // 檢查是否需要設置 Google Script URL
      if (!GOOGLE_SCRIPT_URL) {
        this.promptForScriptUrl();
      }
    }, 1500);

    return { isOk: true };
  },

  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
    if (this._onConfigChange) {
      this._onConfigChange(this.config);
    }
  },

  promptForScriptUrl() {
    const message =
      '🔗 歡迎使用 HSK 生詞卡學習系統！\n\n' +
      '為了使用 Google Sheets 同步功能，請輸入您的 Google Apps Script URL。\n\n' +
      '如果您還沒有設置，請參考 GOOGLE_SHEETS_SETUP.md 文件。\n\n' +
      'URL 格式範例：\n' +
      'https://script.google.com/macros/s/AKfycby.../exec\n\n' +
      '現在輸入 URL？（取消則稍後設置）';

    const url = prompt(message);

    if (url && url.trim()) {
      const trimmedUrl = url.trim();
      if (trimmedUrl.includes('script.google.com')) {
        window.setGoogleScriptUrl(trimmedUrl);
        alert('✅ 設置成功！\n\n頁面將重新載入以連接 Google Sheets。');
        window.location.reload();
      } else {
        alert('❌ URL 格式似乎不正確\n\n請確認這是 Google Apps Script 的部署 URL。');
      }
    } else {
      console.log('ℹ️ 使用者取消 URL 設置，稍後可通過控制台設置：\nwindow.setGoogleScriptUrl("您的URL")');
    }
  }
};

// 自動刷新數據（每30秒）
setInterval(() => {
  if (GOOGLE_SCRIPT_URL && window._dataHandler) {
    console.log('🔄 自動刷新數據...');
    window.dataSdk.init(window._dataHandler);
  }
}, 3600000);

console.log('✅ Google Sheets SDK 已載入');
if (GOOGLE_SCRIPT_URL) {
  console.log('🔗 API URL:', GOOGLE_SCRIPT_URL);
} else {
  console.log('⚠️ 尚未設置 API URL - 請使用 window.setGoogleScriptUrl("您的URL") 設置');
}
