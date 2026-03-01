import Foundation

@available(macOS 15.0, *)
func run() async {
    let recognizer = SpeechRecognizer()

    // Send ready status
    let readyMsg = makeStatusMessage(status: "ready")
    print(readyMsg)
    fflush(stdout)

    // Read commands from stdin line by line
    let stdinHandle = FileHandle.standardInput

    while let lineData = readLine(strippingNewline: true) {
        guard !lineData.isEmpty else { continue }

        guard let data = lineData.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            let errMsg = makeErrorMessage(code: "INVALID_INPUT", message: "Invalid JSON input")
            print(errMsg)
            fflush(stdout)
            continue
        }

        switch type {
        case "start":
            let language = json["language"] as? String ?? "ja-JP"
            await recognizer.start(language: language)
        case "stop":
            await recognizer.stop()
        default:
            let errMsg = makeErrorMessage(code: "UNKNOWN_COMMAND", message: "Unknown command: \(type)")
            print(errMsg)
            fflush(stdout)
        }
    }

    // stdin closed, cleanup
    await recognizer.stop()
}

if #available(macOS 15.0, *) {
    let semaphore = DispatchSemaphore(value: 0)
    Task {
        await run()
        semaphore.signal()
    }
    semaphore.wait()
} else {
    let errMsg = makeErrorMessage(code: "UNSUPPORTED_OS", message: "macOS 15.0 or later is required")
    print(errMsg)
    fflush(stdout)
    exit(1)
}
