import { RepoSidebar } from './RepoSidebar';
import { WorkspacePanel } from './WorkspacePanel';
// import { WorkspaceChanges } from './WorkspaceChanges';
// import { Terminal } from './Terminal';
import TestComponent from '../TestComponent';
import type { RepoData, WorkspaceData } from '../client/types/entities';
import { useStore } from '../store';

export const MainLayout = ({
  repos,
  selectedRepoPath,
  selectedWorkspaceId,
  selectedWorkspace,
  onSelectRepo,
  onSelectWorkspace,
  onExecuteCommand: _onExecuteCommand,
}: {
  repos: RepoData[];
  selectedRepoPath: string | null;
  selectedWorkspaceId: string | null;
  selectedWorkspace: WorkspaceData | null;
  onSelectRepo: (path: string | null) => void;
  onSelectWorkspace: (id: string | null) => void;
  onExecuteCommand: (command: string) => Promise<void>;
}) => {
  const sidebarCollapsed = useStore((state) => state.sidebarCollapsed);
  const isTestComponentVisible = useStore(
    (state) => state.isTestComponentVisible,
  );

  // Determine empty state type
  const emptyStateType = !selectedWorkspace
    ? repos.length === 0
      ? 'no-repos'
      : 'no-workspace'
    : null;

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="flex flex-1 overflow-hidden">
        {!isTestComponentVisible && (
          <RepoSidebar
            repos={repos}
            selectedRepoPath={selectedRepoPath}
            selectedWorkspaceId={selectedWorkspaceId}
            onSelectRepo={onSelectRepo}
            onSelectWorkspace={onSelectWorkspace}
          />
        )}

        <div
          className={`flex-1 flex flex-col ${!isTestComponentVisible && (sidebarCollapsed ? 'ml-12' : 'ml-64')}`}
        >
          <WorkspacePanel
            workspace={selectedWorkspace}
            emptyStateType={emptyStateType}
          />
        </div>

        {/* Right column - hidden for now, will implement later */}
        {/* <div
          className="flex flex-col w-80"
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          <WorkspaceChanges workspace={selectedWorkspace} />
          <Terminal onExecuteCommand={onExecuteCommand} />
        </div> */}
      </div>

      {/* Test controls at the bottom */}
      <TestComponent />
    </div>
  );
};
