import { useEffect, useState } from 'react';
import type { VoiceSessionViewModel } from '../shared/types';
import { VoiceCapturePanel } from './components/voice-capture-panel';

const DEFAULT_STATE: VoiceSessionViewModel = {
  visible: false,
  phase: 'hidden',
  liveTranscript: '',
  finalTranscript: '',
  message: '',
  canRetryCorrection: false,
};

export function VoiceCaptureApp() {
  const [state, setState] = useState<VoiceSessionViewModel>(DEFAULT_STATE);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onVoiceSessionStateChange((nextState) => {
      setState(nextState);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === 'Enter' && state.phase === 'correction_failed' && state.canRetryCorrection) {
        event.preventDefault();
        void window.electronAPI.retryLastCorrection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.canRetryCorrection, state.phase]);

  return (
    <VoiceCapturePanel
      state={state}
      onOpenSettings={() => {
        void window.electronAPI.openSettingsWindow();
      }}
      onRetry={() => {
        void window.electronAPI.retryLastCorrection();
      }}
      onDismiss={() => {
        void window.electronAPI.dismissVoiceWindow();
      }}
    />
  );
}
