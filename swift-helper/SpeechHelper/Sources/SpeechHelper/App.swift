import Foundation

@main
struct App {
    static func main() {
        guard #available(macOS 15.0, *) else {
            let errMsg = makeErrorMessage(code: "UNSUPPORTED_OS", message: "macOS 15.0 or later is required")
            print(errMsg)
            fflush(stdout)
            _exit(1)
        }

        let recognizer = SpeechRecognizer()

        // Send ready status
        print(makeStatusMessage(status: "ready"))
        fflush(stdout)

        // Read stdin on a background thread so the main RunLoop stays responsive
        // (AVAudioEngine and SFSpeechRecognizer require the main RunLoop to process audio)
        DispatchQueue.global().async {
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
                    Task { await recognizer.start(language: language) }
                case "stop":
                    Task { await recognizer.stop() }
                default:
                    let errMsg = makeErrorMessage(code: "UNKNOWN_COMMAND", message: "Unknown command: \(type)")
                    print(errMsg)
                    fflush(stdout)
                }
            }

            // stdin closed, cleanup
            Task {
                await recognizer.stop()
                _exit(0)
            }
        }

        // Keep the main RunLoop alive for AVAudioEngine and SFSpeechRecognizer
        RunLoop.main.run()
    }
}
