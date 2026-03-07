import Foundation

let arguments = CommandLine.arguments

guard arguments.count >= 2 else {
    emitError("Missing command")
}

switch arguments[1] {
case "frontmost-app":
    emitJSON(AutomationController.frontmostApp())
case "permission-status":
    emitJSON(AutomationController.permissionStatus())
case "open-accessibility-settings":
    emitJSON(AutomationController.openAccessibilitySettings())
case "activate-app":
    guard arguments.count >= 3 else {
        emitError("Missing bundle id")
    }
    emitJSON(AutomationController.activateApp(bundleId: arguments[2]))
case "activate-process":
    guard arguments.count >= 3, let processId = Int32(arguments[2]) else {
        emitError("Missing process id")
    }
    emitJSON(AutomationController.activateProcess(processId: processId))
case "paste":
    emitJSON(AutomationController.paste())
default:
    emitError("Unknown command: \(arguments[1])")
}
