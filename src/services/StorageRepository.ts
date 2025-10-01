import { TeamView, UserPrefs } from '@/types/domain';
import { StorageRepository as IStorageRepository } from '@/types/storage';

const STORAGE_KEYS = {
  TEAM_VIEWS: 'teamViews',
  USER_PREFS: 'userPrefs',
};

const DEFAULT_USER_PREFS: UserPrefs = {
  slotMinutes: 30,
  showTentativeAsBusy: true,
};

/**
 * chrome.storage.sync を使用したストレージリポジトリ実装
 */
export class ChromeStorageRepository implements IStorageRepository {
  async listTeamViews(): Promise<TeamView[]> {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.TEAM_VIEWS);
      return result[STORAGE_KEYS.TEAM_VIEWS] || [];
    } catch (error) {
      console.error('Failed to list team views:', error);
      return [];
    }
  }

  async upsertTeamView(view: TeamView): Promise<void> {
    try {
      const views = await this.listTeamViews();
      const index = views.findIndex(v => v.id === view.id);

      if (index >= 0) {
        views[index] = { ...view, updatedAt: new Date().toISOString() };
      } else {
        views.push(view);
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEAM_VIEWS]: views,
      });
    } catch (error) {
      console.error('Failed to upsert team view:', error);
      throw error;
    }
  }

  async deleteTeamView(id: string): Promise<void> {
    try {
      const views = await this.listTeamViews();
      const filteredViews = views.filter(v => v.id !== id);

      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEAM_VIEWS]: filteredViews,
      });
    } catch (error) {
      console.error('Failed to delete team view:', error);
      throw error;
    }
  }

  async getUserPrefs(): Promise<UserPrefs> {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.USER_PREFS);
      return result[STORAGE_KEYS.USER_PREFS] || DEFAULT_USER_PREFS;
    } catch (error) {
      console.error('Failed to get user prefs:', error);
      return DEFAULT_USER_PREFS;
    }
  }

  async setUserPrefs(prefs: Partial<UserPrefs>): Promise<void> {
    try {
      const currentPrefs = await this.getUserPrefs();
      const updatedPrefs = { ...currentPrefs, ...prefs };

      await chrome.storage.sync.set({
        [STORAGE_KEYS.USER_PREFS]: updatedPrefs,
      });
    } catch (error) {
      console.error('Failed to set user prefs:', error);
      throw error;
    }
  }
}

