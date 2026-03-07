import { createRoot } from 'react-dom/client';
import { App } from './App';
import { VoiceOverlay } from './components/voice-overlay';
import './index.css';

const root = createRoot(document.getElementById('root')!);
const params = new URLSearchParams(window.location.search);
const isOverlayWindow = params.get('overlay') === '1';

if (isOverlayWindow) {
  document.body.classList.add('overlay-window');
}

root.render(isOverlayWindow ? <VoiceOverlay /> : <App />);
