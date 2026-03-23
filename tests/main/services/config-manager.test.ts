import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyticsEvent, CorrectionHistoryItem, Settings } from '../../../src/shared/types';

const storeState = new Map<string, unknown>();

vi.mock('electron-store', () => {
  return {
    default: class MockStore<T extends Record<string, unknown>> {
      get<K extends keyof T>(key: K): T[K] | undefined {
        return storeState.get(String(key)) as T[K] | undefined;
      }

      set<K extends keyof T>(key: K, value: T[K]): void {
        storeState.set(String(key), value);
      }

      has<K extends keyof T>(key: K): boolean {
        return storeState.has(String(key));
      }
    },
  };
});

describe('ConfigManager', () => {
  beforeEach(() => {
    storeState.clear();
    vi.resetModules();
  });

  it('returns first-run bootstrap data before settings are stored', async () => {
    const { ConfigManager } = await import('../../../src/main/services/config-manager');
    const manager = new ConfigManager();

    const bootstrap = manager.getBootstrapData();

    expect(bootstrap.isFirstRun).toBe(true);
    expect(bootstrap.settings.activeProvider).toBe('lm-studio');
    expect(bootstrap.needsSetup).toBe(false);
  });

  it('stores latest 50 history items in reverse chronological order', async () => {
    const { ConfigManager } = await import('../../../src/main/services/config-manager');
    const manager = new ConfigManager();

    for (let index = 0; index < 52; index += 1) {
      const item: CorrectionHistoryItem = {
        id: String(index),
        inputText: `input-${index}`,
        correctedText: `corrected-${index}`,
        provider: 'lm-studio',
        createdAt: new Date(2026, 0, index + 1).toISOString(),
      };
      manager.saveCorrectionHistoryItem(item);
    }

    const history = manager.getCorrectionHistory();
    expect(history).toHaveLength(50);
    expect(history[0]?.id).toBe('51');
    expect(history[49]?.id).toBe('2');
  });

  it('tracks analytics events with a rolling cap', async () => {
    const { ConfigManager } = await import('../../../src/main/services/config-manager');
    const manager = new ConfigManager();

    for (let index = 0; index < 205; index += 1) {
      const event: AnalyticsEvent = {
        name: 'correction_started',
        timestamp: new Date(2026, 0, 1, 0, 0, index).toISOString(),
        metadata: { index },
      };
      manager.trackEvent(event);
    }

    const storedEvents = storeState.get('analyticsEvents') as AnalyticsEvent[] | undefined;
    expect(storedEvents).toHaveLength(200);
    expect(storedEvents?.[0]?.metadata?.index).toBe(5);
  });

  it('marks bootstrap as configured after saving valid settings', async () => {
    const { ConfigManager } = await import('../../../src/main/services/config-manager');
    const manager = new ConfigManager();
    const settings: Settings = manager.load();

    manager.save({
      ...settings,
      activeProvider: 'gemini',
      gemini: {
        apiKey: 'test-key',
        modelName: 'gemini-2.0-flash',
      },
    });

    const bootstrap = manager.getBootstrapData();
    expect(bootstrap.isFirstRun).toBe(false);
    expect(bootstrap.needsSetup).toBe(false);
  });
});
