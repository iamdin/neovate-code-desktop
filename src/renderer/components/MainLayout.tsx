import React from 'react';
import { RepoSidebar } from './RepoSidebar';
import { SessionPanel } from './SessionPanel';
import { WorkspaceChanges } from './WorkspaceChanges';
import { Terminal } from './Terminal';
import type {
  RepoData,
  WorkspaceData,
  SessionData,
} from '../client/types/entities';

export const MainLayout = ({
  repos,
  selectedRepoPath,
  selectedWorkspaceId,
  selectedSessionId,
  onSelectRepo,
  onSelectWorkspace,
  onSelectSession,
  onSendMessage,
  onExecuteCommand,
}: {
  repos: RepoData[];
  selectedRepoPath: string | null;
  selectedWorkspaceId: string | null;
  selectedSessionId: string | null;
  onSelectRepo: (path: string | null) => void;
  onSelectWorkspace: (id: string | null) => void;
  onSelectSession: (id: string | null) => void;
  onSendMessage: (content: string) => Promise<void>;
  onExecuteCommand: (command: string) => Promise<void>;
}) => {
  // Get the selected workspace and session data
  const selectedWorkspace = selectedWorkspaceId
    ? Object.values(
        repos.flatMap((repo) =>
          repo.workspaceIds.map((id) => {
            // In a real implementation, we would get the workspace from the store
            // For now, we'll create a mock workspace
            return {
              id,
              repoPath: repo.path,
              branch: 'main',
              worktreePath: `/path/to/${id}`,
              sessionIds: [],
              gitState: {
                currentCommit: 'abc123',
                isDirty: false,
                pendingChanges: [],
              },
              metadata: {
                createdAt: Date.now(),
                description: 'Mock workspace',
                status: 'active',
              },
              context: {
                activeFiles: [],
                settings: {},
                preferences: {},
              },
            } as WorkspaceData;
          }),
        ),
      ).find((w) => w.id === selectedWorkspaceId) || null
    : null;

  const selectedSession = selectedSessionId
    ? ({
        id: selectedSessionId,
        workspaceId: selectedWorkspaceId,
        messages: [],
        context: {
          files: [],
          codeRefs: [],
        },
        state: {
          pendingOperations: [],
          activeTasks: [],
        },
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          status: 'active',
          tags: [],
          labels: [],
        },
      } as SessionData)
    : null;

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="flex flex-1 overflow-hidden">
        <RepoSidebar
          repos={repos}
          selectedRepoPath={selectedRepoPath}
          selectedWorkspaceId={selectedWorkspaceId}
          onSelectRepo={onSelectRepo}
          onSelectWorkspace={onSelectWorkspace}
        />

        <div className="flex-1 flex flex-col">
          <SessionPanel
            session={selectedSession}
            onSendMessage={onSendMessage}
          />
        </div>

        <div
          className="flex flex-col w-80"
          style={{ borderLeft: '1px solid var(--border-subtle)' }}
        >
          <WorkspaceChanges workspace={selectedWorkspace} />
          <Terminal onExecuteCommand={onExecuteCommand} />
        </div>
      </div>
    </div>
  );
};
