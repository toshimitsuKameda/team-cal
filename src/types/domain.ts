// ドメインモデル型定義

export type Email = string;
export type CalendarId = string;

export interface TeamMember {
  email: Email;
  displayName?: string;
  calendars?: CalendarId[];
}

export type TeamSource = "manual" | "google-group" | "remote-directory";

export interface TeamView {
  id: string;
  name: string;
  source: TeamSource;
  sourceRef?: string;
  members: TeamMember[];
  owner: Email;
  sharedWith?: Email[];
  createdAt: string;
  updatedAt: string;
}

export interface TimeWindow {
  startISO: string;
  endISO: string;
  timeZone: string;
  slotMinutes: 15 | 30 | 60;
}

export interface UserPrefs {
  defaultViewId?: string;
  slotMinutes: 15 | 30 | 60;
  showTentativeAsBusy: boolean;
}

