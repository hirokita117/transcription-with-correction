import Foundation

struct FrontmostAppPayload: Encodable {
    let bundleId: String
    let name: String
    let processId: Int32
}

struct PermissionStatusPayload: Encodable {
    let accessibilityTrusted: Bool
}

struct OperationPayload: Encodable {
    let ok: Bool
    let message: String?
}

func emitJSON<T: Encodable>(_ value: T) -> Never {
    let encoder = JSONEncoder()
    guard let data = try? encoder.encode(value),
          let json = String(data: data, encoding: .utf8) else {
        fputs("{\"ok\":false,\"message\":\"Encoding failed\"}\n", stderr)
        exit(1)
    }

    print(json)
    fflush(stdout)
    exit(0)
}

func emitError(_ message: String) -> Never {
    emitJSON(OperationPayload(ok: false, message: message))
}
