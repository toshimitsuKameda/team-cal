/**
 * Service Worker (Background Script)
 * Manifest v3 対応
 */

// トークンキャッシュ
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// インストール時の処理
chrome.runtime.onInstalled.addListener(() => {
  console.log('Team Cal Extension installed');
});

// アイコンクリック時の処理
chrome.action.onClicked.addListener(async (tab) => {
  console.log('🔵 拡張機能アイコンがクリックされました');
  
  try {
    // 認証を開始
    const token = await handleGetAuthToken(true);
    console.log('✅ 認証成功:', token ? 'トークンを取得しました' : 'トークンなし');
    
    // Googleカレンダーのタブがあればそれをアクティブに
    const calendarTabs = await chrome.tabs.query({ 
      url: 'https://calendar.google.com/*' 
    });
    
    if (calendarTabs.length > 0) {
      // 既存のタブをアクティブに
      await chrome.tabs.update(calendarTabs[0].id!, { active: true });
      await chrome.windows.update(calendarTabs[0].windowId!, { focused: true });
      console.log('✅ Googleカレンダーのタブをアクティブにしました');
    } else {
      // 新しいタブを開く
      await chrome.tabs.create({ url: 'https://calendar.google.com/' });
      console.log('✅ Googleカレンダーを新しいタブで開きました');
    }
  } catch (error) {
    console.error('❌ 認証エラー:', error);
  }
});

// メッセージハンドラ
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Background: メッセージを受信:', message.type);
  
  // 認証トークンを取得
  if (message.type === 'GET_AUTH_TOKEN') {
    handleGetAuthToken(message.interactive || false)
      .then(token => {
        console.log('✅ Background: トークンを取得しました');
        sendResponse({ success: true, token });
      })
      .catch(error => {
        console.error('❌ Background: トークン取得エラー:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 非同期レスポンス
  }
  
  // ユーザーメールを取得
  if (message.type === 'GET_USER_EMAIL') {
    handleGetUserEmail()
      .then(email => {
        console.log('✅ Background: ユーザーメールを取得:', email);
        sendResponse({ success: true, email });
      })
      .catch(error => {
        console.error('❌ Background: ユーザーメール取得エラー:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 非同期レスポンス
  }
  
  // ログアウト
  if (message.type === 'LOGOUT') {
    handleLogout()
      .then(() => {
        console.log('✅ Background: ログアウトしました');
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('❌ Background: ログアウトエラー:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 非同期レスポンス
  }

  return false;
});

/**
 * 認証トークンを取得
 */
async function handleGetAuthToken(interactive: boolean): Promise<string> {
  // キャッシュが有効ならそれを返す
  if (cachedToken && Date.now() < tokenExpiresAt) {
    console.log('💾 Background: キャッシュされたトークンを返します');
    return cachedToken;
  }

  try {
    console.log(`🔐 Background: chrome.identity.getAuthToken (interactive: ${interactive})`);
    
    const result = await chrome.identity.getAuthToken({ interactive });
    const token = typeof result === 'string' ? result : result?.token;
    
    if (!token) {
      throw new Error('Failed to get auth token');
    }

    // キャッシュ
    cachedToken = token;
    tokenExpiresAt = Date.now() + 50 * 60 * 1000; // 50分
    
    console.log('✅ Background: トークンをキャッシュしました');
    return token;
  } catch (error: any) {
    console.error('❌ Background: 認証エラー:', error);
    throw new Error('認証に失敗しました: ' + error.message);
  }
}

/**
 * ユーザーメールを取得
 */
async function handleGetUserEmail(): Promise<string> {
  try {
    const token = await handleGetAuthToken(false);
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    const data = await response.json();
    return data.email;
  } catch (error: any) {
    console.error('❌ Background: ユーザー情報取得エラー:', error);
    throw error;
  }
}

/**
 * ログアウト
 */
async function handleLogout(): Promise<void> {
  try {
    const token = cachedToken;
    cachedToken = null;
    tokenExpiresAt = 0;

    if (token) {
      try {
        await chrome.identity.removeCachedAuthToken({ token });
        console.log('✅ Background: キャッシュトークンを削除');
      } catch (error) {
        console.warn('⚠️ Background: トークン削除エラー:', error);
      }

      try {
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, {
          method: 'POST',
        });
        console.log('✅ Background: トークンを無効化');
      } catch (error) {
        console.warn('⚠️ Background: トークン無効化エラー:', error);
      }
    }
  } catch (error: any) {
    console.error('❌ Background: ログアウトエラー:', error);
    throw error;
  }
}

export {};

