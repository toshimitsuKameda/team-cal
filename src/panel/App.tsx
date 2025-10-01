import { useState, useEffect } from 'react';
import { TeamView, TimeWindow } from '@/types/domain';
import { ChromeStorageRepository } from '@/services/StorageRepository';
import { CalendarListService } from '@/services/CalendarListService';
import { TeamSwitchService } from '@/services/TeamSwitchService';
import { googleAuthService } from '@/auth/GoogleAuthService';
import { CompactTeamSelector } from './components/CompactTeamSelector';
import { TimeRangePicker } from './components/TimeRangePicker';
import './App.css';

const storage = new ChromeStorageRepository();
const calendarListService = new CalendarListService(() => googleAuthService.getAccessToken());
const teamSwitchService = new TeamSwitchService(calendarListService);

function App() {
  const [teamViews, setTeamViews] = useState<TeamView[]>([]);
  const [selectedView, setSelectedView] = useState<TeamView | null>(null);
  const [timeWindow, setTimeWindow] = useState(() => getDefaultTimeWindow());
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    loadTeamViews();
    checkAuth();
  }, []);

  // 認証チェック
  const checkAuth = async () => {
    try {
      await googleAuthService.getAccessToken();
      const email = await googleAuthService.getUserEmail();
      setUserEmail(email);
      setIsAuthenticated(true);
    } catch (err) {
      setIsAuthenticated(false);
      setUserEmail(null);
      setError('認証が必要です。ログインしてください。');
    }
  };

  // チームビュー一覧の読み込み
  const loadTeamViews = async () => {
    try {
      const views = await storage.listTeamViews();
      setTeamViews(views);
      
      // デフォルトビューを選択
      const prefs = await storage.getUserPrefs();
      if (prefs.defaultViewId) {
        const defaultView = views.find(v => v.id === prefs.defaultViewId);
        if (defaultView) {
          setSelectedView(defaultView);
        }
      }
    } catch (err) {
      console.error('Failed to load team views:', err);
    }
  };

  // チーム切り替え処理（カレンダー同期を含む）
  const handleTeamSwitch = async (newTeam: TeamView) => {
    if (newTeam.id === selectedView?.id) return;

    setSyncing(true);
    setError(null);

    try {
      const previousMembers = selectedView?.members.map(m => m.email) || [];
      const newMembers = newTeam.members.map(m => m.email);

      // 表示/非表示するメンバーを計算
      const emailsToHide = previousMembers.filter(email => !newMembers.includes(email));
      const emailsToShow = newMembers.filter(email => !previousMembers.includes(email));

      // 1. カレンダーリストを同期（API）
      await teamSwitchService.switchTeam(newTeam, selectedView || undefined);
      
      // 2. Googleカレンダーページに通知（Content Script経由）
      try {
        console.log('📤 Googleカレンダーページに通知を送信中...');
        const tabs = await chrome.tabs.query({ url: 'https://calendar.google.com/*' });
        console.log(`📋 ${tabs.length}個のGoogleカレンダータブを発見`);
        
        for (const tab of tabs) {
          if (tab.id) {
            console.log(`📨 タブ${tab.id}にメッセージを送信`);
            await chrome.tabs.sendMessage(tab.id, {
              type: 'TOGGLE_CALENDARS',
              emailsToShow,
              emailsToHide,
            });
          }
        }
      } catch (contentScriptError) {
        console.warn('⚠️  Googleカレンダーページへの通知に失敗:', contentScriptError);
        console.log('ℹ️  Googleカレンダーのタブを開いて、ページをリロードしてください');
      }
      
      // 3. 選択状態を更新
      setSelectedView(newTeam);
    } catch (err: any) {
      setError(err.message || 'チームの切り替えに失敗しました');
      console.error('Failed to switch team:', err);
    } finally {
      setSyncing(false);
    }
  };

  // ログイン処理
  const handleLogin = async () => {
    console.log('ログインボタンがクリックされました');
    try {
      console.log('認証トークンを取得中...');
      await googleAuthService.refreshToken();
      const email = await googleAuthService.getUserEmail();
      console.log('認証成功:', email);
      setUserEmail(email);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      console.error('認証エラー:', err);
      setError(err.message);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await googleAuthService.logout();
      setIsAuthenticated(false);
      setUserEmail(null);
      setSelectedView(null);
      setError(null);
    } catch (err: any) {
      console.error('ログアウトエラー:', err);
      setError('ログアウトに失敗しました');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        <div className="auth-required">
          <h2>認証が必要です</h2>
          <p>Googleカレンダーの空き状況を表示するには、ログインが必要です。</p>
          <button onClick={handleLogin} className="btn-primary">
            Googleでログイン
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>チームカレンダー</h1>
          {isAuthenticated && userEmail && (
            <div className="user-info">
              <span className="user-email">{userEmail}</span>
              <button onClick={handleLogout} className="btn-logout" title="ログアウト">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M10 2v2h3v8h-3v2h5V2h-5zM7 11l3-3-3-3v2H1v2h6v2z"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <CompactTeamSelector
          views={teamViews}
          selectedView={selectedView}
          onSelectView={handleTeamSwitch}
          onViewsChange={loadTeamViews}
          syncing={syncing}
        />

        {selectedView && (
          <>
            <TimeRangePicker
              timeWindow={timeWindow}
              onTimeWindowChange={setTimeWindow}
            />

            {error && <div className="error-message">{error}</div>}
          </>
        )}

        {!selectedView && teamViews.length === 0 && (
          <div className="empty-state">
            <p>チームビューを作成して始めましょう</p>
          </div>
        )}
      </main>
    </div>
  );
}

// デフォルトのタイムウィンドウ（今週）
function getDefaultTimeWindow(): TimeWindow {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);

  return {
    startISO: monday.toISOString(),
    endISO: friday.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    slotMinutes: 30,
  };
}

export default App;

