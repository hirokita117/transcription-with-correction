// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SpeechHelper",
    platforms: [.macOS(.v15)],
    targets: [
        .executableTarget(
            name: "SpeechHelper",
            path: "Sources/SpeechHelper"
        ),
    ]
)
