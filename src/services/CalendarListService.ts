import { Email } from '@/types/domain';

/**
 * Google Calendar List APIを使用してカレンダーの購読・管理を行うサービス
 */
export class CalendarListService {
  private getAccessToken: () => Promise<string>;

  constructor(getAccessToken: () => Promise<string>) {
    this.getAccessToken = getAccessToken;
  }

  /**
   * ユーザーのカレンダーリストを取得
   */
  async getCalendarList(): Promise<CalendarListEntry[]> {
    console.log('📋 カレンダーリストを取得中...');
    const token = await this.getAccessToken();

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get calendar list: ${response.status}`);
    }

    const data = await response.json();
    const calendars = data.items || [];
    console.log(`✅ ${calendars.length}個のカレンダーを取得しました`);
    console.log('カレンダーID一覧:', calendars.map((c: CalendarListEntry) => `${c.id} (selected: ${c.selected})`));
    return calendars;
  }

  /**
   * 他のユーザーのカレンダーを購読（他のカレンダーに追加）
   */
  async subscribeToCalendar(email: Email, colorId?: string): Promise<void> {
    console.log(`📅 カレンダーを購読: ${email}`);
    const token = await this.getAccessToken();

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: email,
          selected: true,  // 表示状態にする
          colorId: colorId || '1',  // デフォルトカラー
        }),
      }
    );

    // 409は既に存在する場合なのでエラーとしない
    if (response.ok) {
      console.log(`✅ カレンダーを購読しました: ${email}`);
    } else if (response.status === 409) {
      console.log(`ℹ️  カレンダーは既に購読済み: ${email}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ カレンダーの購読に失敗: ${email}`, response.status, errorText);
      throw new Error(`Failed to subscribe to calendar ${email}: ${response.status}`);
    }
  }

  /**
   * カレンダーの表示状態を切り替え
   */
  async toggleCalendarVisibility(calendarId: string, visible: boolean): Promise<void> {
    console.log(`🔄 カレンダーの表示を${visible ? '表示' : '非表示'}に変更: ${calendarId}`);
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected: visible,
        }),
      }
    );

    if (response.ok) {
      console.log(`✅ カレンダーの表示を変更しました: ${calendarId} → ${visible ? '表示' : '非表示'}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ カレンダーの表示変更に失敗: ${calendarId}`, response.status, errorText);
      throw new Error(`Failed to toggle calendar visibility: ${response.status}`);
    }
  }

  /**
   * カレンダーの購読を解除（カレンダーリストから削除）
   */
  async unsubscribeFromCalendar(calendarId: string): Promise<void> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/users/me/calendarList/${encodeURIComponent(calendarId)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to unsubscribe from calendar: ${response.status}`);
    }
  }

  /**
   * 複数のカレンダーをまとめて表示/非表示
   */
  async batchToggleVisibility(calendarIds: string[], visible: boolean): Promise<void> {
    const promises = calendarIds.map(id => 
      this.toggleCalendarVisibility(id, visible).catch(err => {
        console.error(`Failed to toggle ${id}:`, err);
        // 個別のエラーは無視して続行
      })
    );

    await Promise.all(promises);
  }

  /**
   * 複数のカレンダーをまとめて購読
   */
  async batchSubscribe(emails: Email[], colorId?: string): Promise<void> {
    const promises = emails.map(email => 
      this.subscribeToCalendar(email, colorId).catch(err => {
        console.error(`Failed to subscribe to ${email}:`, err);
        // 個別のエラーは無視して続行
      })
    );

    await Promise.all(promises);
  }
}

/**
 * Calendar List APIのレスポンス型
 */
export interface CalendarListEntry {
  kind: string;
  etag: string;
  id: string;
  summary: string;
  description?: string;
  timeZone: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  selected: boolean;
  accessRole: string;
  primary?: boolean;
}

