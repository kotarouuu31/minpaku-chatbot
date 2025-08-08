"use client";

import { useEffect, useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import { EmbedConfig } from "@/types";
import { isIframe, postMessageToParent } from "@/lib/utils";

export default function EmbedPage() {
  const [config, setConfig] = useState<EmbedConfig>({
    theme: "auto",
    primaryColor: "#e67e22",
    position: "bottom-right",
    width: 400,
    height: 600,
    showHeader: true,
    welcomeMessage: "こんにちは！民泊に関するご質問がございましたら、お気軽にお聞かせください。",
  });
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // URLパラメータから設定を読み込み
    const urlParams = new URLSearchParams(window.location.search);
    const newConfig: Partial<EmbedConfig> = {};

    if (urlParams.get("theme")) newConfig.theme = urlParams.get("theme") as "light" | "dark" | "auto";
    if (urlParams.get("primaryColor")) newConfig.primaryColor = urlParams.get("primaryColor")!;
    if (urlParams.get("width")) newConfig.width = parseInt(urlParams.get("width")!);
    if (urlParams.get("height")) newConfig.height = parseInt(urlParams.get("height")!);
    if (urlParams.get("showHeader")) newConfig.showHeader = urlParams.get("showHeader") === "true";
    if (urlParams.get("welcomeMessage")) newConfig.welcomeMessage = decodeURIComponent(urlParams.get("welcomeMessage")!);

    setConfig(prev => ({ ...prev, ...newConfig }));

    // 親ウィンドウにサイズ情報を送信
    if (isIframe()) {
      postMessageToParent({
        type: "resize",
        data: { width: newConfig.width || 400, height: newConfig.height || 600 }
      });
    }

    // テーマの適用
    const theme = newConfig.theme || "auto";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    }

    // プライマリカラーの適用
    if (newConfig.primaryColor) {
      document.documentElement.style.setProperty("--primary", newConfig.primaryColor);
    }
  }, []);

  const handleClose = () => {
    if (isIframe()) {
      postMessageToParent({ type: "close" });
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    if (isIframe()) {
      postMessageToParent({ 
        type: "resize", 
        data: { width: 60, height: 60 } 
      });
    }
  };

  const handleRestore = () => {
    setIsMinimized(false);
    if (isIframe()) {
      postMessageToParent({ 
        type: "resize", 
        data: { width: config.width, height: config.height } 
      });
    }
  };

  if (isMinimized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary">
        <button
          onClick={handleRestore}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
          aria-label="チャットを復元"
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full"
      style={{ 
        width: config.width, 
        height: config.height,
        maxWidth: "100vw",
        maxHeight: "100vh"
      }}
    >
      <ChatInterface
        isEmbedded={true}
        welcomeMessage={config.welcomeMessage}
        onClose={handleClose}
        onMinimize={handleMinimize}
      />
    </div>
  );
}
