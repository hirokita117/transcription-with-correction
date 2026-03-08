import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import { app } from 'electron';

const execFileAsync = promisify(execFile);

export class AutomationHelperClient {
  private getHelperPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'AutomationHelper');
    }

    return path.join(
      app.getAppPath(),
      'swift-helper',
      'SpeechHelper',
      '.build',
      'release',
      'AutomationHelper'
    );
  }

  async runCommand<T>(args: string[]): Promise<T> {
    const helperPath = this.getHelperPath();
    const { stdout } = await execFileAsync(helperPath, args, { encoding: 'utf8' });
    return JSON.parse(stdout.trim()) as T;
  }
}
