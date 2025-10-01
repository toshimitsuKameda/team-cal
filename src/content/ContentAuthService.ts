/**
 * Content Script用の認証サービス
 * Background Scriptを介して認証を行う
 */

export class ContentAuthService {
  /**
   * アクセストークンを取得
   */
  async getAccessToken(interactive: boolean = false): Promise<string> {
    try {
      console.log('🔐 Content: アクセストークンを要求中...', { interactive });
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_AUTH_TOKEN',
        interactive,
      });

      if (!response.success) {
        throw new Error(response.error || 'トークン取得に失敗しました');
      }

      console.log('✅ Content: トークンを取得しました');
      return response.token;
    } catch (error: any) {
      console.error('❌ Content: トークン取得エラー:', error);
      throw new Error('認証に失敗しました: ' + error.message);
    }
  }

  /**
   * ユーザーのメールアドレスを取得
   */
  async getUserEmail(): Promise<string> {
    try {
      console.log('📧 Content: ユーザーメールを要求中...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_USER_EMAIL',
      });

      if (!response.success) {
        throw new Error(response.error || 'ユーザーメール取得に失敗しました');
      }

      console.log('✅ Content: ユーザーメールを取得:', response.email);
      return response.email;
    } catch (error: any) {
      console.error('❌ Content: ユーザーメール取得エラー:', error);
      throw error;
    }
  }

  /**
   * ログアウト
   */
  async logout(): Promise<void> {
    try {
      console.log('🚪 Content: ログアウトを要求中...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'LOGOUT',
      });

      if (!response.success) {
        throw new Error(response.error || 'ログアウトに失敗しました');
      }

      console.log('✅ Content: ログアウトしました');
    } catch (error: any) {
      console.error('❌ Content: ログアウトエラー:', error);
      throw error;
    }
  }
}

// シングルトンインスタンス
export const contentAuthService = new ContentAuthService();

