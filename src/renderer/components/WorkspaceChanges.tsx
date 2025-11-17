import React, { createContext, useContext, useState } from 'react';
import type { WorkspaceData } from '../client/types/entities';

// Define the context type
interface WorkspaceChangesContextType {
  changes: string[];
  viewMode: 'changes' | 'all-files';
  changesCount: number;
  setViewMode: (mode: 'changes' | 'all-files') => void;
}

// Create the context
const WorkspaceChangesContext = createContext<
  WorkspaceChangesContextType | undefined
>(undefined);

// Custom hook to use the context
export function useWorkspaceChangesContext() {
  const context = useContext(WorkspaceChangesContext);
  if (!context) {
    throw new Error(
      'useWorkspaceChangesContext must be used within WorkspaceChanges',
    );
  }
  return context;
}

// Main component
export const WorkspaceChanges = ({
  workspace,
}: {
  workspace: WorkspaceData | null;
}) => {
  const [viewMode, setViewMode] = useState<'changes' | 'all-files'>('changes');

  const changes = workspace?.gitState.pendingChanges || [];
  const changesCount = changes.length;

  const contextValue: WorkspaceChangesContextType = {
    changes,
    viewMode,
    changesCount,
    setViewMode,
  };

  return (
    <WorkspaceChangesContext.Provider value={contextValue}>
      <div
        className="flex flex-col flex-1"
        style={{
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <WorkspaceChanges.Header />
        {changesCount > 0 ? (
          <WorkspaceChanges.FileList />
        ) : (
          <WorkspaceChanges.EmptyState />
        )}
      </div>
    </WorkspaceChangesContext.Provider>
  );
};

// Compound components
WorkspaceChanges.Header = function Header() {
  const { viewMode, setViewMode, changesCount } = useWorkspaceChangesContext();

  return (
    <div
      className="p-4"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 text-sm rounded"
            style={
              viewMode === 'changes'
                ? { backgroundColor: '#0070f3', color: 'white' }
                : { backgroundColor: '#e0e0e0', color: '#666' }
            }
            onClick={() => setViewMode('changes')}
          >
            Changes {changesCount > 0 && `(${changesCount})`}
          </button>
          <button
            className="px-3 py-1 text-sm rounded"
            style={
              viewMode === 'all-files'
                ? { backgroundColor: '#0070f3', color: 'white' }
                : { backgroundColor: '#e0e0e0', color: '#666' }
            }
            onClick={() => setViewMode('all-files')}
          >
            All Files
          </button>
        </div>
        <button className="p-1 rounded hover:opacity-70">
          <SearchIcon />
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          placeholder="Search files..."
          className="w-full rounded px-3 py-1 text-sm focus:outline-none focus:ring-1"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
          }}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <SearchIcon />
        </div>
      </div>
    </div>
  );
};

WorkspaceChanges.FileList = function FileList() {
  const { changes } = useWorkspaceChangesContext();

  return (
    <div className="flex-1 overflow-y-auto">
      <div
        className="p-2 text-xs uppercase tracking-wide"
        style={{ color: '#666' }}
      >
        Modified Files
      </div>
      <div className="space-y-1">
        {changes.map((file, index) => (
          <WorkspaceChanges.FileItem key={index} file={file} />
        ))}
      </div>
    </div>
  );
};

WorkspaceChanges.FileItem = function FileItem({ file }: { file: string }) {
  return (
    <div className="flex items-center p-2 cursor-pointer hover:opacity-80">
      <div className="flex items-center justify-center w-6 h-6 mr-2">
        <FileIcon />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{file}</div>
      </div>
      <div className="flex items-center">
        <span
          className="text-xs px-1.5 py-0.5 rounded mr-1"
          style={{ backgroundColor: '#fbbf24', color: '#78350f' }}
        >
          M
        </span>
        <button className="p-1 rounded hover:opacity-70">
          <MoreIcon />
        </button>
      </div>
    </div>
  );
};

WorkspaceChanges.EmptyState = function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        <CheckIcon />
      </div>
      <h3
        className="text-lg font-medium mb-1"
        style={{ color: 'var(--text-primary)' }}
      >
        No changes
      </h3>
      <p className="text-sm" style={{ color: '#666' }}>
        All files are up to date with the remote repository
      </p>
    </div>
  );
};

// Icons
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M3 2v12h10V2H3zm0-1h10a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"
      />
      <path
        d="M6 5h4M6 7h4M6 9h2"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="4" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
      />
      <path d="M7 12l3 3l7-7" stroke="#10B981" strokeWidth="2" fill="none" />
    </svg>
  );
}
