import { TimeWindow } from '@/types/domain';

interface TimeRangePickerProps {
  timeWindow: TimeWindow;
  onTimeWindowChange: (window: TimeWindow) => void;
}

export function TimeRangePicker({ timeWindow, onTimeWindowChange }: TimeRangePickerProps) {
  const handlePresetChange = (preset: 'today' | 'thisWeek' | 'nextWeek') => {
    const now = new Date();
    let start: Date, end: Date;

    switch (preset) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;

      case 'thisWeek':
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 4);
        end.setHours(23, 59, 59, 999);
        break;

      case 'nextWeek':
        const currentDayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() + (8 - (currentDayOfWeek === 0 ? 7 : currentDayOfWeek)));
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 4);
        end.setHours(23, 59, 59, 999);
        break;
    }

    onTimeWindowChange({
      ...timeWindow,
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    });
  };

  const handleSlotMinutesChange = (minutes: 15 | 30 | 60) => {
    onTimeWindowChange({
      ...timeWindow,
      slotMinutes: minutes,
    });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="time-range-picker">
      <div className="preset-buttons">
        <button onClick={() => handlePresetChange('today')} className="btn-secondary btn-sm">
          今日
        </button>
        <button onClick={() => handlePresetChange('thisWeek')} className="btn-secondary btn-sm">
          今週
        </button>
        <button onClick={() => handlePresetChange('nextWeek')} className="btn-secondary btn-sm">
          来週
        </button>
      </div>

      <div className="time-info">
        <span className="time-range">
          {formatDate(timeWindow.startISO)} - {formatDate(timeWindow.endISO)}
        </span>
        <select
          value={timeWindow.slotMinutes}
          onChange={(e) => handleSlotMinutesChange(Number(e.target.value) as 15 | 30 | 60)}
          className="slot-selector"
        >
          <option value={15}>15分</option>
          <option value={30}>30分</option>
          <option value={60}>60分</option>
        </select>
      </div>
    </div>
  );
}

