import { useState } from 'react';
import { TeamView } from '@/types/domain';
import { TeamViewEditor } from './TeamViewEditor';

interface TeamViewSelectProps {
  views: TeamView[];
  selectedView: TeamView | null;
  onSelectView: (view: TeamView) => void;
  onViewsChange: () => void;
}

export function TeamViewSelect({
  views,
  selectedView,
  onSelectView,
  onViewsChange,
}: TeamViewSelectProps) {
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
    <div className="team-view-select">
      <div className="select-header">
        <label htmlFor="view-select">チームビュー:</label>
        <div className="select-actions">
          <button onClick={handleCreateNew} className="btn-secondary btn-sm">
            新規作成
          </button>
          {selectedView && (
            <button onClick={handleEdit} className="btn-secondary btn-sm">
              編集
            </button>
          )}
        </div>
      </div>

      <select
        id="view-select"
        value={selectedView?.id || ''}
        onChange={(e) => {
          const view = views.find(v => v.id === e.target.value);
          if (view) onSelectView(view);
        }}
        className="view-selector"
      >
        <option value="">チームを選択...</option>
        {views.map(view => (
          <option key={view.id} value={view.id}>
            {view.name} ({view.members.length}人)
          </option>
        ))}
      </select>
    </div>
  );
}

