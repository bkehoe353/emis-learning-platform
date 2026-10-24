import SwiftUI
import WebKit

@main
struct EmisLearningPlatformApp: App {
    var body: some Scene {
        WindowGroup {
            LearningWebView()
                .ignoresSafeArea(edges: .bottom)
                .preferredColorScheme(.light)
        }
    }
}

struct LearningWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.96, green: 0.94, blue: 1.0, alpha: 1.0)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        if let fileURL = Bundle.main.url(forResource: "index", withExtension: "html") {
            webView.loadFileURL(fileURL, allowingReadAccessTo: fileURL.deletingLastPathComponent())
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) { }
}
