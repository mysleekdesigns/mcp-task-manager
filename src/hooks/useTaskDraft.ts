'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ProfileId, PhaseConfig } from '@/types/agent-profiles';
import { getDefaultPhaseConfig } from '@/lib/agent-profiles';

export interface TaskDraft {
  description: string;
  title: string;
  profileId: ProfileId;
  phaseConfig: PhaseConfig;
  attachments: Array<{
    id: string;
    type: string;
    name: string;
    content: string;
    mimeType?: string;
    size?: number;
  }>;
  savedAt: number; // timestamp
}

interface UseTaskDraftReturn {
  draft: TaskDraft | null;
  hasDraft: boolean;
  saveDraft: (data: Partial<TaskDraft>) => void;
  clearDraft: () => void;
  restoreDraft: () => TaskDraft | null;
  lastSaved: Date | null;
}

const DEBOUNCE_DELAY = 500; // ms

export function useTaskDraft(projectId: string): UseTaskDraftReturn {
  const storageKey = `task-draft-${projectId}`;
  const debounceTimerRef = useRef<NodeJS.Timeout>(undefined);

  // Lazy initialization: restore draft from localStorage only once on mount
  const [draft, setDraft] = useState<TaskDraft | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      return JSON.parse(stored) as TaskDraft;
    } catch (error) {
      console.error('Failed to restore draft from localStorage:', error);
      return null;
    }
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as TaskDraft;
      return new Date(parsed.savedAt);
    } catch {
      return null;
    }
  });

  // Restore draft from localStorage
  const restoreDraft = useCallback((): TaskDraft | null => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as TaskDraft;
      return parsed;
    } catch (error) {
      console.error('Failed to restore draft from localStorage:', error);
      return null;
    }
  }, [storageKey]);

  // Save draft to localStorage
  const persistDraft = useCallback((draftData: TaskDraft) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draftData));
      setLastSaved(new Date(draftData.savedAt));
    } catch (error) {
      console.error('Failed to save draft to localStorage:', error);
    }
  }, [storageKey]);

  // Save draft with debouncing
  const saveDraft = useCallback((data: Partial<TaskDraft>) => {
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Update local state immediately
    setDraft((prevDraft) => {
      const updatedDraft: TaskDraft = {
        description: data.description ?? prevDraft?.description ?? '',
        title: data.title ?? prevDraft?.title ?? '',
        profileId: data.profileId ?? prevDraft?.profileId ?? 'auto',
        phaseConfig: data.phaseConfig ?? prevDraft?.phaseConfig ?? getDefaultPhaseConfig('auto'),
        attachments: data.attachments ?? prevDraft?.attachments ?? [],
        savedAt: Date.now(),
      };

      // Debounce the localStorage write
      debounceTimerRef.current = setTimeout(() => {
        persistDraft(updatedDraft);
      }, DEBOUNCE_DELAY);

      return updatedDraft;
    });
  }, [persistDraft]);

  // Clear draft from localStorage and state
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setDraft(null);
      setLastSaved(null);

      // Clear any pending debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    } catch (error) {
      console.error('Failed to clear draft from localStorage:', error);
    }
  }, [storageKey]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    draft,
    hasDraft: draft !== null,
    saveDraft,
    clearDraft,
    restoreDraft,
    lastSaved,
  };
}
