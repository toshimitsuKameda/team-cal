/**
 * Google OAuth認証サービス
 * Chrome Identity APIを使用してトークンを取得
 */

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

export class GoogleAuthService {
  private cachedToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * アクセストークンを取得（キャッシュ有効期限内であればキャッシュを返す）
   */
  async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    return this.refreshToken();
  }

  /**
   * トークンをリフレッシュ
   */
  async refreshToken(): Promise<string> {
    try {
      console.log('chrome.identity.getAuthToken を呼び出します...');
      console.log('chrome.identity:', chrome.identity);
      console.log('chrome.identity.getAuthToken:', chrome.identity?.getAuthToken);
      
      // タイムアウト付きでgetAuthTokenを呼び出す
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('認証がタイムアウトしました（30秒）')), 30000);
      });
      
      const authPromise = chrome.identity.getAuthToken({ interactive: true });
      
      console.log('認証画面を待機中... (最大30秒)');
      const result = await Promise.race([authPromise, timeoutPromise]) as any;
      console.log('getAuthToken の結果:', result);
      
      const token = typeof result === 'string' ? result : result?.token;
      console.log('抽出したトークン:', token ? '取得成功' : 'トークンなし');
      
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      this.cachedToken = token;
      // トークンの有効期限を50分後に設定（通常60分だが余裕を持たせる）
      this.tokenExpiresAt = Date.now() + 50 * 60 * 1000;

      console.log('トークンをキャッシュしました');
      return token;
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error('認証に失敗しました。もう一度お試しください。');
    }
  }

  /**
   * トークンを削除してサインアウト
   */
  async signOut(): Promise<void> {
    if (this.cachedToken) {
      try {
        await chrome.identity.removeCachedAuthToken({ token: this.cachedToken });
        this.cachedToken = null;
        this.tokenExpiresAt = 0;
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
  }

  /**
   * ログアウト（トークンを削除して認証を解除）
   */
  async logout(): Promise<void> {
    try {
      console.log('ログアウト処理を開始...');
      
      // キャッシュをクリア
      const token = this.cachedToken;
      this.cachedToken = null;
      this.tokenExpiresAt = 0;

      // Chrome Identity APIでトークンを削除
      if (token) {
        try {
          await chrome.identity.removeCachedAuthToken({ token });
          console.log('✅ キャッシュされたトークンを削除しました');
        } catch (error) {
          console.warn('トークン削除エラー:', error);
        }

        // Googleアカウントからもトークンを無効化
        try {
          await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`, {
            method: 'POST',
          });
          console.log('✅ Googleアカウントのトークンを無効化しました');
        } catch (error) {
          console.warn('トークン無効化エラー:', error);
        }
      }

      console.log('✅ ログアウト完了');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  }

  /**
   * 現在のユーザーのメールアドレスを取得
   */
  async getUserEmail(): Promise<string> {
    const token = await this.getAccessToken();
    
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      return data.email;
    } catch (error) {
      console.error('Failed to get user email:', error);
      throw error;
    }
  }

  /**
   * 必要なスコープのリストを取得
   */
  getRequiredScopes(): string[] {
    return [...SCOPES];
  }
}

// シングルトンインスタンス
export const googleAuthService = new GoogleAuthService();

