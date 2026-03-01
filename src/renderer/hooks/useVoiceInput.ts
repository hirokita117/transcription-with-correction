import { useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceInputStatus, TranscriptionResult } from '../../shared/types';

interface UseVoiceInputOptions {
  autoCorrectEnabled: boolean;
  onFinalResult: (text: string) => void;
  onAutoCorrect: () => void;
}

interface UseVoiceInputReturn {
  status: VoiceInputStatus;
  volatileText: string;
  toggleVoiceInput: () => void;
}

export function useVoiceInput({
  autoCorrectEnabled,
  onFinalResult,
  onAutoCorrect,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [volatileText, setVolatileText] = useState('');
  const accumulatedFinalRef = useRef('');
  const pendingAutoCorrectRef = useRef(false);

  useEffect(() => {
    const unsubStatus = window.electronAPI.onVoiceInputStatusChange((newStatus) => {
      setStatus(newStatus);

      if (newStatus === 'idle') {
        setVolatileText('');
        if (pendingAutoCorrectRef.current && autoCorrectEnabled) {
          pendingAutoCorrectRef.current = false;
          onAutoCorrect();
        }
      }
    });

    const unsubResult = window.electronAPI.onTranscriptionResult((result: TranscriptionResult) => {
      if (result.isFinal) {
        const separator = accumulatedFinalRef.current ? '' : '';
        accumulatedFinalRef.current = result.text;
        onFinalResult(result.text);
        setVolatileText('');
        pendingAutoCorrectRef.current = true;
      } else {
        setVolatileText(result.text);
      }
    });

    const unsubShortcut = window.electronAPI.onVoiceInputShortcut(() => {
      // Toggle will be handled in the component via toggleVoiceInput
      setStatus((prev) => {
        if (prev === 'idle' || prev === 'error') {
          accumulatedFinalRef.current = '';
          pendingAutoCorrectRef.current = false;
          window.electronAPI.startVoiceInput();
          return prev; // Status will be updated via IPC
        } else if (prev === 'listening') {
          window.electronAPI.stopVoiceInput();
          return prev;
        }
        return prev;
      });
    });

    return () => {
      unsubStatus();
      unsubResult();
      unsubShortcut();
    };
  }, [autoCorrectEnabled, onFinalResult, onAutoCorrect]);

  const toggleVoiceInput = useCallback(() => {
    if (status === 'idle' || status === 'error') {
      accumulatedFinalRef.current = '';
      pendingAutoCorrectRef.current = false;
      window.electronAPI.startVoiceInput();
    } else if (status === 'listening') {
      window.electronAPI.stopVoiceInput();
    }
  }, [status]);

  return { status, volatileText, toggleVoiceInput };
}
