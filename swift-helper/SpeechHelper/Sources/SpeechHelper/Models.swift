import Foundation

// MARK: - Input Commands (from stdin)

struct InputCommand: Codable {
    let type: CommandType
    let language: String?

    enum CommandType: String, Codable {
        case start
        case stop
    }
}

// MARK: - Output Messages (to stdout)

struct OutputMessage: Codable {
    let type: OutputType
    let data: OutputData

    enum OutputType: String, Codable {
        case result
        case error
        case status
    }
}

enum OutputData: Codable {
    case result(TranscriptionData)
    case error(ErrorData)
    case status(StatusData)

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .result(let data):
            try container.encode(data)
        case .error(let data):
            try container.encode(data)
        case .status(let data):
            try container.encode(data)
        }
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let data = try? container.decode(TranscriptionData.self) {
            self = .result(data)
        } else if let data = try? container.decode(ErrorData.self) {
            self = .error(data)
        } else {
            let data = try container.decode(StatusData.self)
            self = .status(data)
        }
    }
}

struct TranscriptionData: Codable {
    let text: String
    let isFinal: Bool
    let timestamp: String
}

struct ErrorData: Codable {
    let code: String
    let message: String
}

struct StatusData: Codable {
    let status: String
}

// MARK: - Helper functions

func makeResultMessage(text: String, isFinal: Bool) -> String {
    let timestamp = ISO8601DateFormatter().string(from: Date())
    let data = TranscriptionData(text: text, isFinal: isFinal, timestamp: timestamp)
    let message: [String: Any] = [
        "type": "result",
        "data": [
            "text": data.text,
            "isFinal": data.isFinal,
            "timestamp": data.timestamp,
        ] as [String: Any],
    ]
    guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
        return ""
    }
    return jsonString
}

func makeErrorMessage(code: String, message: String) -> String {
    let msg: [String: Any] = [
        "type": "error",
        "data": [
            "code": code,
            "message": message,
        ],
    ]
    guard let jsonData = try? JSONSerialization.data(withJSONObject: msg),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
        return ""
    }
    return jsonString
}

func makeStatusMessage(status: String) -> String {
    let msg: [String: Any] = [
        "type": "status",
        "data": [
            "status": status,
        ],
    ]
    guard let jsonData = try? JSONSerialization.data(withJSONObject: msg),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
        return ""
    }
    return jsonString
}
