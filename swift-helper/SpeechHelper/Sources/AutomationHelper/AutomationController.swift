import AppKit
import ApplicationServices
import Foundation

enum AutomationController {
    static func frontmostApp() -> FrontmostAppPayload {
        guard let app = NSWorkspace.shared.frontmostApplication else {
            return FrontmostAppPayload(bundleId: "", name: "", processId: 0)
        }

        return FrontmostAppPayload(
            bundleId: app.bundleIdentifier ?? "",
            name: app.localizedName ?? "",
            processId: app.processIdentifier
        )
    }

    static func permissionStatus() -> PermissionStatusPayload {
        PermissionStatusPayload(accessibilityTrusted: AXIsProcessTrusted())
    }

    static func openAccessibilitySettings() -> OperationPayload {
        guard let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility") else {
            return OperationPayload(ok: false, message: "Invalid settings URL")
        }

        let opened = NSWorkspace.shared.open(url)
        return OperationPayload(ok: opened, message: opened ? nil : "Failed to open System Settings")
    }

    static func activateApp(bundleId: String) -> OperationPayload {
        guard let runningApp = NSRunningApplication.runningApplications(withBundleIdentifier: bundleId).first else {
            return OperationPayload(ok: false, message: "Target application is not running")
        }

        return activate(runningApp)
    }

    static func activateProcess(processId: pid_t) -> OperationPayload {
        guard let runningApp = NSRunningApplication(processIdentifier: processId) else {
            return OperationPayload(ok: false, message: "Target process is not running")
        }

        return activate(runningApp)
    }

    private static func activate(_ runningApp: NSRunningApplication) -> OperationPayload {
        let activated = runningApp.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
        return OperationPayload(ok: activated, message: activated ? nil : "Failed to activate application")
    }

    static func paste() -> OperationPayload {
        guard AXIsProcessTrusted() else {
            return OperationPayload(ok: false, message: "Accessibility permission is not granted")
        }

        let appleScript = """
        tell application "System Events"
            keystroke "v" using command down
        end tell
        """

        if let script = NSAppleScript(source: appleScript) {
            var error: NSDictionary?
            script.executeAndReturnError(&error)
            if error == nil {
                return OperationPayload(ok: true, message: nil)
            }
        }

        guard let source = CGEventSource(stateID: .combinedSessionState),
              let commandDown = CGEvent(keyboardEventSource: source, virtualKey: 0x09, keyDown: true),
              let commandUp = CGEvent(keyboardEventSource: source, virtualKey: 0x09, keyDown: false) else {
            return OperationPayload(ok: false, message: "Failed to create paste event")
        }

        commandDown.flags = .maskCommand
        commandUp.flags = .maskCommand
        commandDown.post(tap: .cghidEventTap)
        commandUp.post(tap: .cghidEventTap)
        return OperationPayload(ok: true, message: nil)
    }
}
