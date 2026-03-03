import { useState, useEffect, useRef, useCallback } from 'react';
import type { VoiceInputStatus, TranscriptionResult } from '../../shared/types';

interface UseVoiceInputOptions {
  autoCorrectEnabled: boolean;
  onFinalResult: (text: string) => void;
  onAutoCorrect: (text: string) => void;
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
  const toggleRef = useRef<() => void>(() => {});

  useEffect(() => {
    const unsubStatus = window.electronAPI.onVoiceInputStatusChange((newStatus) => {
      setStatus(newStatus);

      if (newStatus === 'idle') {
        setVolatileText('');
        if (pendingAutoCorrectRef.current && autoCorrectEnabled) {
          pendingAutoCorrectRef.current = false;
          onAutoCorrect(accumulatedFinalRef.current);
        }
      }
    });

    const unsubResult = window.electronAPI.onTranscriptionResult((result: TranscriptionResult) => {
      if (result.isFinal) {
        accumulatedFinalRef.current = result.text;
        onFinalResult(result.text);
        setVolatileText('');
        pendingAutoCorrectRef.current = true;
      } else {
        setVolatileText(result.text);
      }
    });

    const unsubShortcut = window.electronAPI.onVoiceInputShortcut(() => {
      toggleRef.current();
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

  toggleRef.current = toggleVoiceInput;

  return { status, volatileText, toggleVoiceInput };
}
