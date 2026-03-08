import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutomationHelperClient } from '../../../src/main/services/automation-helper-client';

const isTrustedAccessibilityClientMock = vi.fn();

vi.mock('electron', () => {
  return {
    systemPreferences: {
      isTrustedAccessibilityClient: isTrustedAccessibilityClientMock,
    },
  };
});

describe('PermissionService', () => {
  const helper = {
    runCommand: vi.fn(),
  } as unknown as AutomationHelperClient;

  beforeEach(() => {
    isTrustedAccessibilityClientMock.mockReset();
    vi.mocked(helper.runCommand).mockReset();
  });

  it('reads accessibility trust from Electron systemPreferences', async () => {
    isTrustedAccessibilityClientMock.mockReturnValue(true);
    const { PermissionService } = await import('../../../src/main/services/permission-service');
    const service = new PermissionService(helper);

    const status = await service.getStatus();

    expect(status).toEqual({
      accessibilityTrusted: true,
      automationAvailable: true,
    });
    expect(isTrustedAccessibilityClientMock).toHaveBeenCalledWith(false);
    expect(helper.runCommand).not.toHaveBeenCalled();
  });

  it('prompts Electron accessibility flow before opening System Settings', async () => {
    isTrustedAccessibilityClientMock.mockReturnValue(false);
    vi.mocked(helper.runCommand).mockResolvedValue({});
    const { PermissionService } = await import('../../../src/main/services/permission-service');
    const service = new PermissionService(helper);

    await service.openAccessibilitySettings();

    expect(isTrustedAccessibilityClientMock).toHaveBeenCalledWith(true);
    expect(helper.runCommand).toHaveBeenCalledWith(['open-accessibility-settings']);
  });
});
