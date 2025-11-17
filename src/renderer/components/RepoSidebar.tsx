import React, { createContext, useContext, useState } from 'react';
import type { RepoData } from '../client/types/entities';

// Define the context type
interface RepoContextType {
  repos: RepoData[];
  selectedRepo: RepoData | null;
  expandedFolders: Set<string>;
  selectRepo: (path: string) => void;
  selectWorkspace: (id: string) => void;
  toggleFolder: (path: string) => void;
}

// Create the context
const RepoContext = createContext<RepoContextType | undefined>(undefined);

// Custom hook to use the context
export function useRepoContext() {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useRepoContext must be used within RepoSidebar');
  }
  return context;
}

// Main component
export const RepoSidebar = ({
  repos,
  selectedRepoPath,
  selectedWorkspaceId,
  onSelectRepo,
  onSelectWorkspace,
}: {
  repos: RepoData[];
  selectedRepoPath: string | null;
  selectedWorkspaceId: string | null;
  onSelectRepo: (path: string | null) => void;
  onSelectWorkspace: (id: string | null) => void;
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  const selectedRepo = selectedRepoPath
    ? repos.find((repo) => repo.path === selectedRepoPath) || null
    : null;

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const contextValue: RepoContextType = {
    repos,
    selectedRepo,
    expandedFolders,
    selectRepo: onSelectRepo,
    selectWorkspace: onSelectWorkspace,
    toggleFolder,
  };

  return (
    <RepoContext.Provider value={contextValue}>
      <div
        className="flex flex-col h-full w-64"
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        <RepoSidebar.Header />
        <div className="flex-1 overflow-y-auto">
          {repos.map((repo) => (
            <RepoSidebar.Folder key={repo.path} repo={repo} />
          ))}
        </div>
        <RepoSidebar.Footer />
      </div>
    </RepoContext.Provider>
  );
};

// Compound components
RepoSidebar.Header = function Header() {
  return (
    <div
      className="flex items-center justify-between p-4"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <h2 className="text-lg font-semibold">Repositories</h2>
      <div className="flex space-x-2">
        <button className="p-1 rounded hover:opacity-70">
          <MinimizeIcon />
        </button>
        <button className="p-1 rounded hover:opacity-70">
          <MaximizeIcon />
        </button>
        <button className="p-1 rounded hover:opacity-70">
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

RepoSidebar.Folder = function Folder({ repo }: { repo: RepoData }) {
  const { expandedFolders, toggleFolder } = useRepoContext();
  const isExpanded = expandedFolders.has(repo.path);

  return (
    <div>
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80"
        onClick={() => toggleFolder(repo.path)}
      >
        <div className="flex items-center">
          <ChevronIcon expanded={isExpanded} />
          <FolderIcon />
          <span className="ml-2">{repo.name}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-4">
          {repo.workspaceIds.map((workspaceId) => (
            <RepoSidebar.Workspace
              key={workspaceId}
              workspaceId={workspaceId}
            />
          ))}
          <RepoSidebar.NewWorkspace repoPath={repo.path} />
        </div>
      )}
    </div>
  );
};

RepoSidebar.Workspace = function Workspace({
  workspaceId,
}: {
  workspaceId: string;
}) {
  const { selectWorkspace, selectedWorkspaceId } = useRepoContext();
  const isSelected = selectedWorkspaceId === workspaceId;

  // In a real implementation, we would get the workspace data from the store
  // For now, we'll just show a placeholder
  return (
    <div
      className="flex items-center p-2 pl-6 cursor-pointer hover:opacity-80"
      style={isSelected ? { backgroundColor: '#f0f0f0' } : {}}
      onClick={() => selectWorkspace(workspaceId)}
    >
      <WorkspaceIcon />
      <span className="ml-2">{workspaceId.substring(0, 8)}</span>
      <span className="ml-auto text-xs" style={{ color: '#666' }}>
        main
      </span>
    </div>
  );
};

RepoSidebar.NewWorkspace = function NewWorkspace({
  repoPath,
}: {
  repoPath: string;
}) {
  const { selectWorkspace } = useRepoContext();

  const handleClick = () => {
    // In a real implementation, this would create a new workspace
    // For now, we'll just show a placeholder
    console.log(`Create new workspace for ${repoPath}`);
  };

  return (
    <div
      className="flex items-center p-2 pl-6 cursor-pointer hover:opacity-80"
      style={{ color: '#666' }}
      onClick={handleClick}
    >
      <PlusIcon />
      <span className="ml-2">New workspace</span>
    </div>
  );
};

RepoSidebar.Footer = function Footer() {
  return (
    <div
      className="p-3 flex justify-between"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <button className="p-2 rounded hover:opacity-70">
        <AddRepoIcon />
      </button>
      <button className="p-2 rounded hover:opacity-70">
        <SettingsIcon />
      </button>
    </div>
  );
};

// Icons (simple SVG implementations)
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={`transform transition-transform ${expanded ? 'rotate-90' : ''}`}
    >
      <path
        fill="currentColor"
        d="M6 12l4-4-4-4"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M14 5v8H2V3h5l2 2h5z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M8 3v10M3 8h10"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function AddRepoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path fill="currentColor" d="M14 7H9V2H7v5H2v2h5v5h2V9h5V7z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
      <circle cx="4" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M14 8H2"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function MaximizeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
