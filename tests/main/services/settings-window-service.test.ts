import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  browserWindowMock,
  browserWindowConstructor,
  closeHandlerRef,
  preventDefaultMock,
} = vi.hoisted(() => {
  const preventDefaultMock = vi.fn();
  const closeHandlerRef: { current: ((event: { preventDefault: () => void }) => void) | null } = {
    current: null,
  };
  const browserWindowMock = {
    isDestroyed: vi.fn(),
    isMinimized: vi.fn(),
    restore: vi.fn(),
    show: vi.fn(),
    focus: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn((event: string, handler: (event: { preventDefault: () => void }) => void) => {
      if (event === 'close') {
        closeHandlerRef.current = handler;
      }
    }),
    loadURL: vi.fn(),
    loadFile: vi.fn(),
  };

  const browserWindowConstructor = vi.fn(() => browserWindowMock);

  return {
    browserWindowMock,
    browserWindowConstructor,
    closeHandlerRef,
    preventDefaultMock,
  };
});

vi.mock('electron', () => {
  return {
    BrowserWindow: browserWindowConstructor,
  };
});

describe('SettingsWindowService', () => {
  beforeEach(() => {
    browserWindowConstructor.mockClear();
    browserWindowMock.isDestroyed.mockReset();
    browserWindowMock.isMinimized.mockReset();
    browserWindowMock.restore.mockReset();
    browserWindowMock.show.mockReset();
    browserWindowMock.focus.mockReset();
    browserWindowMock.hide.mockReset();
    browserWindowMock.destroy.mockReset();
    browserWindowMock.on.mockClear();
    browserWindowMock.loadURL.mockReset();
    browserWindowMock.loadFile.mockReset();
    browserWindowMock.isDestroyed.mockReturnValue(false);
    browserWindowMock.isMinimized.mockReturnValue(false);
    closeHandlerRef.current = null;
    preventDefaultMock.mockReset();
  });

  it('hides the window instead of closing during normal operation', async () => {
    const { SettingsWindowService } = await import('../../../src/main/services/settings-window-service');
    const service = new SettingsWindowService({
      getDevServerUrl: () => undefined,
    });

    await service.show();

    closeHandlerRef.current?.({ preventDefault: preventDefaultMock });

    expect(preventDefaultMock).toHaveBeenCalled();
    expect(browserWindowMock.hide).toHaveBeenCalled();
  });

  it('allows the window to close after prepareForQuit is called', async () => {
    const { SettingsWindowService } = await import('../../../src/main/services/settings-window-service');
    const service = new SettingsWindowService({
      getDevServerUrl: () => undefined,
    });

    await service.show();
    service.prepareForQuit();

    closeHandlerRef.current?.({ preventDefault: preventDefaultMock });

    expect(preventDefaultMock).not.toHaveBeenCalled();
    expect(browserWindowMock.hide).not.toHaveBeenCalled();
  });
});
