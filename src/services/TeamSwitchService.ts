import { TeamView, Email } from '@/types/domain';
import { CalendarListService } from './CalendarListService';

/**
 * チーム切り替え時のカレンダー同期を管理するサービス
 */
export class TeamSwitchService {
  private calendarListService: CalendarListService;
  private currentTeamMembers: Set<Email> = new Set();

  constructor(calendarListService: CalendarListService) {
    this.calendarListService = calendarListService;
  }

  /**
   * チームを切り替え、カレンダーの表示を同期
   */
  async switchTeam(newTeam: TeamView, previousTeam?: TeamView): Promise<void> {
    console.log('🔄 チーム切り替え開始');
    console.log('新しいチーム:', newTeam.name, newTeam.members.map(m => m.email));
    if (previousTeam) {
      console.log('前のチーム:', previousTeam.name, previousTeam.members.map(m => m.email));
    }

    const newMemberEmails = new Set(newTeam.members.map(m => m.email));
    const previousMemberEmails = previousTeam 
      ? new Set(previousTeam.members.map(m => m.email))
      : new Set<Email>();

    // 前のチームのメンバーで、新しいチームにいないメンバーを非表示
    const membersToHide = Array.from(previousMemberEmails).filter(
      email => !newMemberEmails.has(email)
    );

    // 新しいチームのメンバーで、前のチームにいなかったメンバーを表示
    const membersToShow = Array.from(newMemberEmails).filter(
      email => !previousMemberEmails.has(email)
    );

    console.log('非表示にするメンバー:', membersToHide);
    console.log('表示するメンバー:', membersToShow);

    // 並行処理で効率化
    await Promise.all([
      this.hideCalendars(membersToHide),
      this.showCalendars(membersToShow),
    ]);

    // 現在のチームメンバーを更新
    this.currentTeamMembers = newMemberEmails;
    console.log('✅ チーム切り替え完了');
  }

  /**
   * カレンダーを表示（既存のカレンダーまたは新規購読）
   */
  private async showCalendars(emails: Email[]): Promise<void> {
    if (emails.length === 0) return;

    try {
      // 既存のカレンダーリストを取得
      const existingCalendars = await this.calendarListService.getCalendarList();
      const existingEmails = new Set(existingCalendars.map(cal => cal.id.toLowerCase()));

      const emailsToSubscribe: Email[] = [];
      const emailsToShow: Email[] = [];

      // 各メールアドレスについて、既存か新規かを判定
      for (const email of emails) {
        if (existingEmails.has(email.toLowerCase())) {
          // 既に存在する場合は表示状態にするだけ
          emailsToShow.push(email);
          console.log(`ℹ️  既存のカレンダーを表示: ${email}`);
        } else {
          // 存在しない場合は購読が必要
          emailsToSubscribe.push(email);
          console.log(`📅 新規購読が必要: ${email}`);
        }
      }

      // 新規購読が必要なカレンダーを購読
      if (emailsToSubscribe.length > 0) {
        await this.calendarListService.batchSubscribe(emailsToSubscribe);
      }

      // すべてのカレンダーを表示状態にする
      await this.calendarListService.batchToggleVisibility(emails, true);
    } catch (error) {
      console.error('Failed to show calendars:', error);
      throw error;
    }
  }

  /**
   * カレンダーを非表示
   */
  private async hideCalendars(emails: Email[]): Promise<void> {
    if (emails.length === 0) return;

    try {
      await this.calendarListService.batchToggleVisibility(emails, false);
    } catch (error) {
      console.error('Failed to hide calendars:', error);
      throw error;
    }
  }

  /**
   * すべてのチームメンバーのカレンダーを非表示
   */
  async hideAllTeamCalendars(): Promise<void> {
    const emails = Array.from(this.currentTeamMembers);
    await this.hideCalendars(emails);
    this.currentTeamMembers.clear();
  }

  /**
   * 現在表示中のメンバー一覧を取得
   */
  getCurrentMembers(): Email[] {
    return Array.from(this.currentTeamMembers);
  }
}

