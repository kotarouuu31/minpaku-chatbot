"use client";

import { useState } from "react";

export default function DemoPage() {
  const [embedUrl, setEmbedUrl] = useState("http://localhost:3003/embed");
  const [config, setConfig] = useState({
    theme: "auto",
    primaryColor: "#e67e22",
    width: 400,
    height: 600,
    showHeader: true,
    welcomeMessage: "こんにちは！民泊に関するご質問がございましたら、お気軽にお聞かせください。",
  });

  const generateEmbedUrl = () => {
    const params = new URLSearchParams();
    if (config.theme !== "auto") params.set("theme", config.theme);
    if (config.primaryColor !== "#e67e22") params.set("primaryColor", config.primaryColor);
    if (config.width !== 400) params.set("width", config.width.toString());
    if (config.height !== 600) params.set("height", config.height.toString());
    if (!config.showHeader) params.set("showHeader", "false");
    if (config.welcomeMessage !== "こんにちは！民泊に関するご質問がございましたら、お気軽にお聞かせください。") {
      params.set("welcomeMessage", encodeURIComponent(config.welcomeMessage));
    }

    const baseUrl = "http://localhost:3003/embed";
    const fullUrl = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    setEmbedUrl(fullUrl);
  };

  const generateEmbedCode = () => {
    return `<iframe 
  src="${embedUrl}" 
  width="${config.width}" 
  height="${config.height}"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
  title="民泊サポートチャット"
></iframe>`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 jp-text">
          民泊チャットボット 埋め込みデモ
        </h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 設定パネル */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 jp-text">設定</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 jp-text">テーマ</label>
                <select
                  value={config.theme}
                  onChange={(e) => setConfig(prev => ({ ...prev, theme: e.target.value }))}
                  className="w-full p-2 border border-border rounded-lg"
                >
                  <option value="auto">自動</option>
                  <option value="light">ライト</option>
                  <option value="dark">ダーク</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 jp-text">プライマリカラー</label>
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-full h-10 border border-border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 jp-text">幅</label>
                  <input
                    type="number"
                    value={config.width}
                    onChange={(e) => setConfig(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 jp-text">高さ</label>
                  <input
                    type="number"
                    value={config.height}
                    onChange={(e) => setConfig(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                    className="w-full p-2 border border-border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.showHeader}
                    onChange={(e) => setConfig(prev => ({ ...prev, showHeader: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm jp-text">ヘッダーを表示</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 jp-text">ウェルカムメッセージ</label>
                <textarea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="w-full p-2 border border-border rounded-lg h-20 jp-text"
                />
              </div>

              <button
                onClick={generateEmbedUrl}
                className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors jp-text"
              >
                埋め込みコードを生成
              </button>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 jp-text">埋め込みコード</h3>
              <textarea
                value={generateEmbedCode()}
                readOnly
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 border border-border rounded-lg h-32 text-sm font-mono"
              />
            </div>
          </div>

          {/* プレビュー */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4 jp-text">プレビュー</h2>
            <div className="flex justify-center">
              <iframe
                src={embedUrl}
                width={config.width}
                height={config.height}
                frameBorder="0"
                style={{ borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                title="民泊サポートチャット"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
