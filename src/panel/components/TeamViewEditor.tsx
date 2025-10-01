import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TeamView, TeamMember } from '@/types/domain';
import { ChromeStorageRepository } from '@/services/StorageRepository';
import { googleAuthService } from '@/auth/GoogleAuthService';

interface TeamViewEditorProps {
  view: TeamView | null;
  onSave: () => void;
  onCancel: () => void;
}

const storage = new ChromeStorageRepository();

export function TeamViewEditor({ view, onSave, onCancel }: TeamViewEditorProps) {
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
    }
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
      const userEmail = await googleAuthService.getUserEmail();
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
    if (!view || !confirm('このチームビューを削除しますか？')) {
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
    <div className="team-view-editor">
      <h3>{view ? 'チームビューを編集' : '新しいチームビューを作成'}</h3>

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
          メンバー (1行に1人、形式: メールアドレス,表示名):
        </label>
        <textarea
          id="team-members"
          value={membersText}
          onChange={(e) => setMembersText(e.target.value)}
          placeholder="例:&#10;user1@example.com,山田太郎&#10;user2@example.com,佐藤花子"
          rows={10}
          className="form-textarea"
        />
        <small className="form-hint">
          CSVまたは改行区切りでメールアドレスを入力してください
        </small>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="editor-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? '保存中...' : '保存'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="btn-secondary"
        >
          キャンセル
        </button>
        {view && (
          <button
            onClick={handleDelete}
            disabled={saving}
            className="btn-danger"
          >
            削除
          </button>
        )}
      </div>
    </div>
  );
}

