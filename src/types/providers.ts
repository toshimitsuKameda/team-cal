import { TeamView, TeamMember } from './domain';

/**
 * チームメンバー解決の抽象プロバイダ
 */
export interface TeamProvider {
  resolveMembers(view: TeamView): Promise<TeamMember[]>;
  search?(query: string): Promise<{ id: string; label: string }[]>;
  invalidate?(ref?: string): Promise<void>;
}
