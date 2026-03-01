import Foundation
import Speech

@available(macOS 15.0, *)
actor SpeechRecognizer {
    private var recognizer: SFSpeechRecognizer?
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var isRunning = false

    func start(language: String) async {
        guard !isRunning else {
            sendOutput(makeErrorMessage(code: "ALREADY_RUNNING", message: "Speech recognition is already running"))
            return
        }

        let locale = Locale(identifier: language)
        recognizer = SFSpeechRecognizer(locale: locale)

        guard let recognizer = recognizer, recognizer.isAvailable else {
            sendOutput(makeErrorMessage(code: "NOT_AVAILABLE", message: "Speech recognition is not available for locale: \(language)"))
            return
        }

        let authStatus = await withCheckedContinuation { (continuation: CheckedContinuation<SFSpeechRecognizerAuthorizationStatus, Never>) in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }

        guard authStatus == .authorized else {
            sendOutput(makeErrorMessage(code: "NO_PERMISSION", message: "Speech recognition permission not granted. Status: \(authStatus.rawValue)"))
            return
        }

        do {
            try await startRecognition(recognizer: recognizer)
        } catch {
            sendOutput(makeErrorMessage(code: "START_FAILED", message: "Failed to start recognition: \(error.localizedDescription)"))
        }
    }

    func stop() {
        guard isRunning else { return }
        recognitionTask?.cancel()
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask = nil
        audioEngine = nil
        isRunning = false
        sendOutput(makeStatusMessage(status: "stopped"))
    }

    private func startRecognition(recognizer: SFSpeechRecognizer) async throws {
        let audioEngine = AVAudioEngine()
        self.audioEngine = audioEngine

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        if #available(macOS 26.0, *) {
            request.addsPunctuation = true
        }
        self.recognitionRequest = request

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        guard recordingFormat.sampleRate > 0 else {
            sendOutput(makeErrorMessage(code: "NO_MICROPHONE", message: "No microphone input available"))
            return
        }

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            request.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        isRunning = true
        sendOutput(makeStatusMessage(status: "listening"))

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self = self else { return }

            if let result = result {
                let text = result.bestTranscription.formattedString
                let isFinal = result.isFinal
                self.sendOutput(makeResultMessage(text: text, isFinal: isFinal))

                if isFinal {
                    Task { await self.stop() }
                }
            }

            if let error = error {
                let nsError = error as NSError
                // Ignore cancellation errors (code 216 = user cancelled)
                if nsError.domain == "kAFAssistantErrorDomain" && nsError.code == 216 {
                    return
                }
                self.sendOutput(makeErrorMessage(code: "RECOGNITION_ERROR", message: error.localizedDescription))
                Task { await self.stop() }
            }
        }
    }

    private nonisolated func sendOutput(_ message: String) {
        guard !message.isEmpty else { return }
        print(message)
        fflush(stdout)
    }
}
