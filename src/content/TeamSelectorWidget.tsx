import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TeamView, TeamMember } from '@/types/domain';
import { ChromeStorageRepository } from '@/services/StorageRepository';
import { CalendarListService } from '@/services/CalendarListService';
import { TeamSwitchService } from '@/services/TeamSwitchService';
import { contentAuthService } from './ContentAuthService';
import './TeamSelectorWidget.css';

const storage = new ChromeStorageRepository();
const calendarListService = new CalendarListService(() => contentAuthService.getAccessToken(false));
const teamSwitchService = new TeamSwitchService(calendarListService);

export function TeamSelectorWidget() {
  const [views, setViews] = useState<TeamView[]>([]);
  const [selectedView, setSelectedView] = useState<TeamView | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingView, setEditingView] = useState<TeamView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeamViews();
  }, []);

  const loadTeamViews = async () => {
    try {
      // まず認証を試みる
      await contentAuthService.getAccessToken(true);
      
      const userEmail = await contentAuthService.getUserEmail();
      const allViews = await storage.listTeamViews();
      const userViews = allViews.filter(v => v.owner === userEmail);
      setViews(userViews);

      // 初回表示時は「なし」を選択状態にする（APIリクエストを発生させない）
      setSelectedView(null);
      console.log('✅ チーム一覧を読み込みました（初期状態: なし）');
    } catch (err: any) {
      console.error('Failed to load team views:', err);
      setError('認証に失敗しました。拡張機能アイコンをクリックしてください。');
    }
  };

  const handleTeamSwitch = async (newTeam: TeamView) => {
    setSyncing(true);
    setError(null);
    
    try {
      // 同じチームでも再設定を許可
      const isReselect = newTeam.id === selectedView?.id;
      
      if (isReselect) {
        console.log('🔄 同じチームを再選択:', newTeam.name);
      } else {
        console.log('🔄 チームを切り替え:', newTeam.name);
      }
      
      // ゲスト機能のみを使用（Google Calendar APIは使わない）
      const previousMembers = isReselect ? [] : (selectedView?.members.map(m => m.email) || []);
      const newMembers = newTeam.members.map(m => m.email);
      const emailsToHide = previousMembers.filter(email => !newMembers.includes(email));
      const emailsToShow = newMembers;

      // Content Script内なので、直接関数を呼び出す
      await (window as any).toggleCalendarCheckboxes(emailsToShow, emailsToHide);
      
      setSelectedView(newTeam);
      console.log('✅ チームを切り替えました:', newTeam.name);
    } catch (err: any) {
      setError(err.message || 'チームの切り替えに失敗しました');
      console.error('Failed to switch team:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearGuests = async () => {
    setSyncing(true);
    setError(null);
    
    try {
      console.log('🗑️ 全てのゲストをクリア');
      
      // 全てのゲストをクリア
      await (window as any).toggleCalendarCheckboxes([], []);
      
      setSelectedView(null);
      console.log('✅ ゲストをクリアしました');
    } catch (err: any) {
      setError(err.message || 'ゲストのクリアに失敗しました');
      console.error('Failed to clear guests:', err);
    } finally {
      setSyncing(false);
    }
  };

  // handleCreateNewは削除（管理画面内に統合）

  const handleEdit = () => {
    // 現在選択中のチーム、または最初のチームを編集対象にする
    setEditingView(selectedView || views[0] || null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsEditing(false);
    setEditingView(null);
    
    // チーム一覧を再読み込み
    await loadTeamViews();
    
    // 編集中だったチームが選択されていた場合は、更新後のデータで再選択
    if (editingView && selectedView?.id === editingView.id) {
      const updatedViews = await storage.listTeamViews();
      const updatedView = updatedViews.find(v => v.id === editingView.id);
      if (updatedView) {
        await handleTeamSwitch(updatedView);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingView(null);
  };

  if (isEditing) {
    return (
      <TeamManagementModal
        views={views}
        selectedViewId={editingView?.id || null}
        onSelectView={setEditingView}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="team-selector-widget">
      <div className="widget-header">
        <div className="widget-title">チームカレンダー</div>
        {syncing && (
          <div className="sync-status">
            <div className="sync-spinner"></div>
            <span>同期中...</span>
          </div>
        )}
      </div>
      
      <div className="team-pills-container">
        <div className="team-pills">
          <button
            className={`team-pill ${selectedView === null ? 'active' : ''}`}
            onClick={handleClearGuests}
            disabled={syncing}
            title="ゲストをクリア"
          >
            <span className="team-name">なし</span>
          </button>
          {views.map(view => (
            <button
              key={view.id}
              className={`team-pill ${selectedView?.id === view.id ? 'active' : ''}`}
              onClick={() => handleTeamSwitch(view)}
              disabled={syncing}
              title={`${view.name} (${view.members.length}人)`}
            >
              <span className="team-name">{view.name}</span>
              <span className="team-count">{view.members.length}</span>
            </button>
          ))}
        </div>
        
        <div className="team-actions">
          <button
            className="action-btn"
            onClick={handleEdit}
            disabled={syncing}
            title="チームを管理"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.854 2.854a.5.5 0 0 0-.708 0L10.5 4.5l1.5 1.5 1.646-1.646a.5.5 0 0 0 0-.708l-.792-.792zM9.5 5.5L3 12v1.5h1.5l6.5-6.5-1.5-1.5z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-status">{error}</div>
      )}
    </div>
  );
}

interface TeamManagementModalProps {
  views: TeamView[];
  selectedViewId: string | null;
  onSelectView: (view: TeamView | null) => void;
  onSave: () => void;
  onCancel: () => void;
}

function TeamManagementModal({ views, selectedViewId, onSelectView, onSave, onCancel }: TeamManagementModalProps) {
  const [editingView, setEditingView] = useState<TeamView | null>(
    views.find(v => v.id === selectedViewId) || views[0] || null
  );
  const [mode, setMode] = useState<'list' | 'text'>('list');

  const handleSelectTeam = (view: TeamView) => {
    setEditingView(view);
    onSelectView(view);
  };

  const handleCreateNew = () => {
    setEditingView(null);
    onSelectView(null);
  };

  return (
    <div className="team-management-modal">
      <div className="management-header">
        <h3>チーム管理</h3>
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'list' ? 'active' : ''}`}
            onClick={() => setMode('list')}
          >
            リスト
          </button>
          <button
            className={`mode-tab ${mode === 'text' ? 'active' : ''}`}
            onClick={() => setMode('text')}
          >
            テキスト
          </button>
        </div>
        <button onClick={onCancel} className="btn-close" title="閉じる">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 6L14 14M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {mode === 'list' ? (
        <div className="management-content">
          <div className="team-list-panel">
            <div className="panel-header">
              <button onClick={handleCreateNew} className="btn-add-team" title="新規作成">
                + チーム追加
              </button>
            </div>
            <div className="team-list">
              {views.map(view => (
                <button
                  key={view.id}
                  className={`team-list-item ${editingView?.id === view.id ? 'active' : ''}`}
                  onClick={() => handleSelectTeam(view)}
                >
                  <span className="team-list-name">{view.name}</span>
                  <span className="team-list-count">{view.members.length}人</span>
                </button>
              ))}
              {views.length === 0 && (
                <div className="empty-message">
                  チームがありません。<br />
                  「+」ボタンから作成してください。
                </div>
              )}
            </div>
          </div>

          <div className="team-editor-panel">
            <TeamViewEditorForm view={editingView} onSave={onSave} onCancel={onCancel} />
          </div>
        </div>
      ) : (
        <TeamTextEditor views={views} onSave={onSave} onCancel={onCancel} />
      )}
    </div>
  );
}

interface TeamViewEditorFormProps {
  view: TeamView | null;
  onSave: () => void;
  onCancel: () => void;
}

function TeamViewEditorForm({ view, onSave, onCancel }: TeamViewEditorFormProps) {
  const [name, setName] = useState(view?.name || '');
  const [membersText, setMembersText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view) {
      setName(view.name);
      setMembersText(
        view.members.map(m => `${m.email}${m.displayName ? `,${m.displayName}` : ''}`).join('\n')
      );
    } else {
      // 新規作成時はフォームをクリア
      setName('');
      setMembersText('');
    }
    setError(null);
  }, [view]);

  const parseMembers = (text: string): TeamMember[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const members: TeamMember[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      const email = parts[0];
      const displayName = parts[1] || undefined;

      if (email && email.includes('@')) {
        members.push({ email, displayName });
      }
    }

    return members;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('チーム名を入力してください');
      return;
    }

    const members = parseMembers(membersText);
    if (members.length === 0) {
      setError('最低1人のメンバーを追加してください');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userEmail = await contentAuthService.getUserEmail();
      const now = new Date().toISOString();

      const teamView: TeamView = {
        id: view?.id || uuidv4(),
        name: name.trim(),
        source: 'manual',
        members,
        owner: userEmail,
        createdAt: view?.createdAt || now,
        updatedAt: now,
      };

      await storage.upsertTeamView(teamView);
      onSave();
    } catch (err: any) {
      setError(err.message || '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!view || !confirm('このチームを削除しますか？')) {
      return;
    }

    setSaving(true);
    try {
      await storage.deleteTeamView(view.id);
      onSave();
    } catch (err: any) {
      setError(err.message || '削除に失敗しました');
      setSaving(false);
    }
  };

  return (
    <div className="team-editor-form">
      {view ? (
        <h4 className="editor-title">チームを編集</h4>
      ) : (
        <h4 className="editor-title">新しいチームを作成</h4>
      )}

      <div className="form-group">
        <label htmlFor="team-name">チーム名:</label>
        <input
          id="team-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 営業本部"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="team-members">
          メンバー (1行に1人):
        </label>
        <textarea
          id="team-members"
          value={membersText}
          onChange={(e) => setMembersText(e.target.value)}
          placeholder="例:&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
          rows={8}
          className="form-textarea"
        />
        <small className="form-hint">
          改行区切りでメールアドレスを入力してください
        </small>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="editor-actions">
        {view && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="btn-danger-light"
          >
            削除
          </button>
        )}
        <div className="editor-actions-right">
          <button
            onClick={onCancel}
            disabled={saving}
            className="btn-secondary"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface TeamTextEditorProps {
  views: TeamView[];
  onSave: () => void;
  onCancel: () => void;
}

function TeamTextEditor({ views, onSave, onCancel }: TeamTextEditorProps) {
  const [csvText, setCsvText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // チームデータをTSV形式に変換
    const tsv = teamsToTSV(views);
    setCsvText(tsv);
  }, [views]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // タブ文字を挿入
      const newValue = csvText.substring(0, start) + '\t' + csvText.substring(end);
      setCsvText(newValue);
      
      // カーソル位置をタブの後ろに移動
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // TSVをパース
      const parsedTeams = parseTSV(csvText);

      if (parsedTeams.length === 0) {
        setError('少なくとも1つのチームを作成してください');
        setSaving(false);
        return;
      }

      // 現在のユーザーメールを取得
      const userEmail = await contentAuthService.getUserEmail();

      // 既存のチームIDを保持するためのマップ
      const existingTeamMap = new Map(views.map(v => [v.name, v]));

      // パースしたチームをTeamView形式に変換
      const now = new Date().toISOString();
      const teamViews: TeamView[] = parsedTeams.map(({ name, members }) => {
        const existingTeam = existingTeamMap.get(name);
        return {
          id: existingTeam?.id || uuidv4(),
          name,
          source: 'manual' as const,
          members: members.map(email => ({ email })),
          owner: userEmail,
          createdAt: existingTeam?.createdAt || now,
          updatedAt: now,
        };
      });

      // すべてのチームを保存（既存のチームを削除してから保存）
      // まず既存のチームをすべて削除
      for (const view of views) {
        await storage.deleteTeamView(view.id);
      }

      // 新しいチームを保存
      for (const teamView of teamViews) {
        await storage.upsertTeamView(teamView);
      }

      onSave();
    } catch (err: any) {
      setError(err.message || '形式が正しくありません');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="team-text-editor">
      <div className="text-editor-help">
        <strong>タブ区切り形式:</strong> チーム名[TAB]メンバー (Spreadsheetからそのままコピー&ペーストできます)
      </div>

      <textarea
        ref={textareaRef}
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="csv-textarea"
        placeholder="チーム名&#9;メンバー&#10;営業部&#9;user1@example.com&#10;営業部&#9;user2@example.com&#10;開発部&#9;dev1@example.com"
        spellCheck={false}
      />

      {error && <div className="error-message">{error}</div>}

      <div className="text-editor-actions">
        <button
          onClick={onCancel}
          disabled={saving}
          className="btn-secondary"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

/**
 * チーム配列をTSV形式に変換
 */
function teamsToTSV(teams: TeamView[]): string {
  const lines = ['チーム名\tメンバー'];
  
  for (const team of teams) {
    for (const member of team.members) {
      lines.push(`${team.name}\t${member.email}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * TSV形式をパース（カンマ区切りもサポート）
 */
function parseTSV(text: string): Array<{ name: string; members: string[] }> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    throw new Error('データが空です');
  }

  // 区切り文字を自動検出（TABまたはカンマ）
  const firstDataLine = lines.length > 1 ? lines[1] : lines[0];
  const delimiter = firstDataLine.includes('\t') ? '\t' : ',';
  const delimiterName = delimiter === '\t' ? 'タブ' : 'カンマ';

  // ヘッダー行をスキップ（"チーム名\tメンバー" または "チーム名,メンバー" など）
  const firstLine = lines[0].toLowerCase();
  const startIndex = firstLine.includes('チーム') || firstLine.includes('team') || firstLine.includes('name') ? 1 : 0;

  const teamMap = new Map<string, string[]>();

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    
    // 区切り文字で分割
    const parts = line.split(delimiter).map(s => s.trim());
    
    if (parts.length < 2) {
      throw new Error(`${i + 1}行目: 形式が正しくありません（チーム名${delimiter === '\t' ? '[TAB]' : ','}メンバー の形式で入力してください）`);
    }

    const [teamName, email, ...rest] = parts;

    if (!teamName) {
      throw new Error(`${i + 1}行目: チーム名が空です`);
    }

    if (!email) {
      throw new Error(`${i + 1}行目: メールアドレスが空です`);
    }

    // メールアドレスの簡易バリデーション
    if (!email.includes('@')) {
      throw new Error(`${i + 1}行目: "${email}" は有効なメールアドレスではありません`);
    }

    if (!teamMap.has(teamName)) {
      teamMap.set(teamName, []);
    }

    // 重複チェック
    const members = teamMap.get(teamName)!;
    if (members.includes(email)) {
      console.warn(`${i + 1}行目: "${email}" は "${teamName}" に既に追加されています（スキップ）`);
    } else {
      members.push(email);
    }
  }

  if (teamMap.size === 0) {
    throw new Error('有効なチームが見つかりませんでした');
  }

  return Array.from(teamMap.entries()).map(([name, members]) => ({
    name,
    members,
  }));
}

