import { TeamView, UserPrefs } from './domain';

/**
 * ストレージリポジトリの抽象インターフェース
 */
export interface StorageRepository {
  listTeamViews(): Promise<TeamView[]>;
  upsertTeamView(view: TeamView): Promise<void>;
  deleteTeamView(id: string): Promise<void>;
  getUserPrefs(): Promise<UserPrefs>;
  setUserPrefs(prefs: Partial<UserPrefs>): Promise<void>;
}

/**
 * chrome.storage.sync に保存するデータ構造
 */
export interface StorageData {
  teamViews: TeamView[];
  userPrefs: UserPrefs;
}
