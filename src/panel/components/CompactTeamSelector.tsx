import { useState } from 'react';
import { TeamView } from '@/types/domain';
import { TeamViewEditor } from './TeamViewEditor';
import './CompactTeamSelector.css';

interface CompactTeamSelectorProps {
  views: TeamView[];
  selectedView: TeamView | null;
  onSelectView: (view: TeamView) => void;
  onViewsChange: () => void;
  syncing?: boolean;
}

export function CompactTeamSelector({
  views,
  selectedView,
  onSelectView,
  onViewsChange,
  syncing = false,
}: CompactTeamSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingView, setEditingView] = useState<TeamView | null>(null);

  const handleCreateNew = () => {
    setEditingView(null);
    setIsEditing(true);
  };

  const handleEdit = () => {
    if (selectedView) {
      setEditingView(selectedView);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
    setEditingView(null);
    onViewsChange();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingView(null);
  };

  if (isEditing) {
    return (
      <TeamViewEditor
        view={editingView}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="compact-team-selector">
      <div className="team-pills-container">
        <div className="team-pills">
          {views.map(view => (
            <button
              key={view.id}
              className={`team-pill ${selectedView?.id === view.id ? 'active' : ''}`}
              onClick={() => onSelectView(view)}
              disabled={syncing}
              title={`${view.name} (${view.members.length}人)`}
            >
              <span className="team-name">{view.name}</span>
              <span className="team-count">{view.members.length}</span>
            </button>
          ))}
        </div>
        
        <div className="team-actions">
          {selectedView && (
            <button
              className="action-btn"
              onClick={handleEdit}
              disabled={syncing}
              title="選択中のチームを編集"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M12.854 2.854a.5.5 0 0 0-.708 0L10.5 4.5l1.5 1.5 1.646-1.646a.5.5 0 0 0 0-.708l-.792-.792zM9.5 5.5L3 12v1.5h1.5l6.5-6.5-1.5-1.5z"/>
              </svg>
            </button>
          )}
          <button
            className="action-btn"
            onClick={handleCreateNew}
            disabled={syncing}
            title="新しいチームを作成"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      {syncing && (
        <div className="sync-status">
          <div className="sync-spinner"></div>
          <span>カレンダーを同期中...</span>
        </div>
      )}
    </div>
  );
}

