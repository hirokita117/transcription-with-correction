import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';
import { app } from 'electron';
import type { TranscriptionResult, VoiceInputStatus, SpeechHelperMessage } from '../../shared/types';

export class SpeechService extends EventEmitter {
  private process: ChildProcess | null = null;
  private status: VoiceInputStatus = 'idle';
  private buffer = '';

  private getHelperPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'SpeechHelper');
    }
    return path.join(
      app.getAppPath(),
      'swift-helper',
      'SpeechHelper',
      '.build',
      'release',
      'SpeechHelper'
    );
  }

  private ensureProcess(): void {
    if (this.process) return;

    const helperPath = this.getHelperPath();
    this.process = spawn(helperPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const message = JSON.parse(line) as SpeechHelperMessage;
          this.handleMessage(message);
        } catch (e) {
          console.error('Failed to parse JSON from SpeechHelper:', line, e);
        }
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      console.error('[SpeechHelper stderr]', data.toString());
    });

    this.process.on('exit', (code) => {
      this.process = null;
      this.buffer = '';
      if (this.status !== 'idle') {
        this.updateStatus('idle');
      }
      if (code !== 0 && code !== null) {
        this.emit('error', { code: 'PROCESS_EXIT', message: `Speech helper exited with code ${code}` });
      }
    });

    this.process.on('error', (err) => {
      this.process = null;
      this.buffer = '';
      this.updateStatus('error');
      this.emit('error', { code: 'PROCESS_ERROR', message: err.message });
    });
  }

  private handleMessage(message: SpeechHelperMessage): void {
    switch (message.type) {
      case 'result':
        this.emit('transcription', message.data as TranscriptionResult);
        break;
      case 'status':
        this.handleStatusMessage(message.data.status);
        break;
      case 'error':
        this.updateStatus('error');
        this.emit('error', message.data);
        break;
    }
  }

  private handleStatusMessage(helperStatus: 'ready' | 'listening' | 'stopped'): void {
    switch (helperStatus) {
      case 'ready':
        // Helper is ready, no status change needed
        break;
      case 'listening':
        this.updateStatus('listening');
        break;
      case 'stopped':
        this.updateStatus('idle');
        break;
    }
  }

  private updateStatus(newStatus: VoiceInputStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emit('status-change', newStatus);
    }
  }

  private sendCommand(command: Record<string, unknown>): void {
    if (!this.process?.stdin?.writable) return;
    this.process.stdin.write(JSON.stringify(command) + '\n');
  }

  start(language: string = 'ja-JP'): void {
    this.ensureProcess();
    this.updateStatus('starting');
    this.sendCommand({ type: 'start', language });
  }

  stop(): void {
    if (this.status === 'idle') return;
    this.updateStatus('stopping');
    this.sendCommand({ type: 'stop' });
  }

  getStatus(): VoiceInputStatus {
    return this.status;
  }

  destroy(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.buffer = '';
    this.status = 'idle';
    this.removeAllListeners();
  }
}
