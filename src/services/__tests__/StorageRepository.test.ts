import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChromeStorageRepository } from '../StorageRepository';
import type { TeamView } from '../../types/domain';

// Mock chrome.storage API
(globalThis as any).chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
};

describe('ChromeStorageRepository', () => {
  let repository: ChromeStorageRepository;

  beforeEach(() => {
    repository = new ChromeStorageRepository();
    vi.clearAllMocks();
  });

  describe('listTeamViews', () => {
    it('should return empty array when no views stored', async () => {
      (chrome.storage.sync.get as any).mockResolvedValue({});

      const views = await repository.listTeamViews();

      expect(views).toEqual([]);
    });

    it('should return stored views', async () => {
      const mockViews: TeamView[] = [
        {
          id: '1',
          name: 'Team 1',
          source: 'manual',
          members: [],
          owner: 'owner@example.com',
          createdAt: '2025-10-01T00:00:00Z',
          updatedAt: '2025-10-01T00:00:00Z',
        },
      ];

      (chrome.storage.sync.get as any).mockResolvedValue({
        teamViews: mockViews,
      });

      const views = await repository.listTeamViews();

      expect(views).toEqual(mockViews);
    });
  });

  describe('upsertTeamView', () => {
    it('should add new view', async () => {
      (chrome.storage.sync.get as any).mockResolvedValue({ teamViews: [] });
      (chrome.storage.sync.set as any).mockResolvedValue(undefined);

      const newView: TeamView = {
        id: '1',
        name: 'New Team',
        source: 'manual',
        members: [],
        owner: 'owner@example.com',
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      };

      await repository.upsertTeamView(newView);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        teamViews: [newView],
      });
    });

    it('should update existing view', async () => {
      const existingView: TeamView = {
        id: '1',
        name: 'Old Name',
        source: 'manual',
        members: [],
        owner: 'owner@example.com',
        createdAt: '2025-10-01T00:00:00Z',
        updatedAt: '2025-10-01T00:00:00Z',
      };

      (chrome.storage.sync.get as any).mockResolvedValue({
        teamViews: [existingView],
      });
      (chrome.storage.sync.set as any).mockResolvedValue(undefined);

      const updatedView: TeamView = {
        ...existingView,
        name: 'New Name',
      };

      await repository.upsertTeamView(updatedView);

      const setCall = (chrome.storage.sync.set as any).mock.calls[0][0];
      expect(setCall.teamViews[0].name).toBe('New Name');
      expect(setCall.teamViews[0].updatedAt).not.toBe(existingView.updatedAt);
    });
  });

  describe('deleteTeamView', () => {
    it('should remove view by id', async () => {
      const views: TeamView[] = [
        {
          id: '1',
          name: 'Team 1',
          source: 'manual',
          members: [],
          owner: 'owner@example.com',
          createdAt: '2025-10-01T00:00:00Z',
          updatedAt: '2025-10-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Team 2',
          source: 'manual',
          members: [],
          owner: 'owner@example.com',
          createdAt: '2025-10-01T00:00:00Z',
          updatedAt: '2025-10-01T00:00:00Z',
        },
      ];

      (chrome.storage.sync.get as any).mockResolvedValue({ teamViews: views });
      (chrome.storage.sync.set as any).mockResolvedValue(undefined);

      await repository.deleteTeamView('1');

      const setCall = (chrome.storage.sync.set as any).mock.calls[0][0];
      expect(setCall.teamViews).toHaveLength(1);
      expect(setCall.teamViews[0].id).toBe('2');
    });
  });

  describe('getUserPrefs', () => {
    it('should return default prefs when none stored', async () => {
      (chrome.storage.sync.get as any).mockResolvedValue({});

      const prefs = await repository.getUserPrefs();

      expect(prefs.slotMinutes).toBe(30);
      expect(prefs.showTentativeAsBusy).toBe(true);
    });
  });
});

