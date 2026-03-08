import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PasteBackService } from '../../../src/main/services/paste-back-service';
import { PermissionService } from '../../../src/main/services/permission-service';
import { AutomationHelperClient } from '../../../src/main/services/automation-helper-client';

const { clipboardWriteText, notificationShow } = vi.hoisted(() => {
  return {
    clipboardWriteText: vi.fn(),
    notificationShow: vi.fn(),
  };
});

vi.mock('electron', () => {
  return {
    clipboard: {
      writeText: clipboardWriteText,
    },
    Notification: class MockNotification {
      static isSupported() {
        return true;
      }

      show() {
        notificationShow();
      }
    },
  };
});

describe('PasteBackService', () => {
  const helper = {
    runCommand: vi.fn(),
  } as unknown as AutomationHelperClient;

  const permissionService = {
    getStatus: vi.fn(),
  } as unknown as PermissionService;

  let service: PasteBackService;

  beforeEach(() => {
    clipboardWriteText.mockReset();
    notificationShow.mockReset();
    vi.mocked(helper.runCommand).mockReset();
    vi.mocked(permissionService.getStatus).mockReset();
    service = new PasteBackService(helper, permissionService);
  });

  it('returns pasted when activation and paste succeed', async () => {
    service.setTargetApp({ bundleId: 'com.example.chat', name: 'Chat', processId: 42 });
    vi.mocked(permissionService.getStatus).mockResolvedValue({ accessibilityTrusted: true });
    vi.mocked(helper.runCommand)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ bundleId: 'com.example.chat', name: 'Chat', processId: 42 })
      .mockResolvedValueOnce({ ok: true });

    const result = await service.pasteText('校正済み', true);

    expect(result.status).toBe('pasted');
    expect(clipboardWriteText).toHaveBeenCalledWith('校正済み');
  });

  it('falls back to clipboard when permission is missing', async () => {
    service.setTargetApp({ bundleId: 'com.example.chat', name: 'Chat', processId: 42 });
    vi.mocked(permissionService.getStatus).mockResolvedValue({ accessibilityTrusted: false });

    const result = await service.pasteText('校正済み', true);

    expect(result.status).toBe('clipboard_only');
    expect(helper.runCommand).not.toHaveBeenCalled();
  });

  it('returns clipboard_only when there is no target app', async () => {
    const result = await service.pasteText('校正済み', true);

    expect(result.status).toBe('clipboard_only');
    expect(clipboardWriteText).toHaveBeenCalledWith('校正済み');
  });

  it('returns paste_failed when fallback is disabled and paste fails', async () => {
    service.setTargetApp({ bundleId: 'com.example.chat', name: 'Chat', processId: 42 });
    vi.mocked(permissionService.getStatus).mockResolvedValue({ accessibilityTrusted: true });
    vi.mocked(helper.runCommand)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ bundleId: 'com.example.chat', name: 'Chat', processId: 42 })
      .mockResolvedValueOnce({ ok: false, message: 'paste failed' });

    const result = await service.pasteText('校正済み', false);

    expect(result.status).toBe('correction_failed');
  });

  it('falls back when the target app is not frontmost after activation', async () => {
    service.setTargetApp({ bundleId: 'com.example.chat', name: 'Chat', processId: 42 });
    vi.mocked(permissionService.getStatus).mockResolvedValue({ accessibilityTrusted: true });
    vi.mocked(helper.runCommand)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ bundleId: 'com.other.app', name: 'Other', processId: 100 });

    const result = await service.pasteText('校正済み', true);

    expect(result.status).toBe('clipboard_only');
    expect(result.details).toBe('target_not_frontmost');
  });
});
