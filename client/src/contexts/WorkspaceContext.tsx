import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WorkspaceContextType {
  currentWorkspaceId: number | null;
  setCurrentWorkspaceId: (id: number | null) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const WORKSPACE_STORAGE_KEY = 'current-workspace-id';

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [currentWorkspaceId, setCurrentWorkspaceIdState] = useState<number | null>(() => {
    // Initialize from localStorage
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  const setCurrentWorkspaceId = (id: number | null) => {
    setCurrentWorkspaceIdState(id);
    if (id !== null) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, id.toString());
    } else {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  };

  useEffect(() => {
    // Sync with localStorage on mount
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (stored) {
      const id = parseInt(stored, 10);
      if (!isNaN(id)) {
        setCurrentWorkspaceIdState(id);
      }
    }
  }, []);

  return (
    <WorkspaceContext.Provider value={{ currentWorkspaceId, setCurrentWorkspaceId }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspaceContext must be used within a WorkspaceProvider');
  }
  return context;
}
