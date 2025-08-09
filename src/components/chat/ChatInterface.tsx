"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Minimize2, X, Home as HomeIcon, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/types";
import { cn, scrollToBottom, postMessageToParent } from "@/lib/utils";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

interface ChatInterfaceProps {
  isEmbedded?: boolean;
  welcomeMessage?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export default function ChatInterface({
  isEmbedded = false,
  welcomeMessage = "こんにちは！民泊に関するご質問がございましたら、お気軽にお聞かせください。チェックイン方法、Wi-Fi設定、周辺情報など、何でもお聞きください。",
  onClose,
  onMinimize,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: welcomeMessage,
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom(messagesEndRef.current.parentElement!);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: "assistant",
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const data = JSON.parse(line.slice(2));
                if (data.content) {
                  assistantContent += data.content;
                  setMessages((prev) => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  );
                }
              } catch {
              // Ignore parsing errors
              }
            }
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "申し訳ございませんが、一時的な問題が発生しました。しばらくしてからもう一度お試しください。",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    if (isEmbedded) {
      postMessageToParent({ type: "close" });
    }
    onClose?.();
  };

  const handleMinimize = () => {
    if (isEmbedded) {
      postMessageToParent({ type: "minimize" });
    }
    onMinimize?.();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={cn(
        "flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-orange-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden",
        isEmbedded 
          ? "h-full w-full" 
          : "h-[600px] w-full max-w-[400px] sm:max-w-[400px] mx-auto"
      )}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <HomeIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold jp-text">民泊サポート</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <span className="text-xs text-white/90 jp-text">オンライン</span>
            </div>
          </div>
        </motion.div>
        
        <div className="flex items-center space-x-2">
          {!isEmbedded && onMinimize && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleMinimize}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Minimize2 size={16} />
            </motion.button>
          )}
          {!isEmbedded && onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} />
            </motion.button>
          )}
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-orange-50/30 to-amber-50/30 dark:from-gray-800/30 dark:to-gray-900/30">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-orange-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="メッセージを入力してください..."
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent jp-text placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Sparkles className="w-4 h-4 text-orange-400 opacity-50" />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Send size={18} className={cn(
              "transition-transform duration-200",
              isLoading && "animate-pulse"
            )} />
          </motion.button>
        </div>
        
        {/* クイック返信ボタン */}
        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 mt-3"
          >
            {["チェックイン方法", "Wi-Fiパスワード", "周辺情報", "緊急連絡先"].map((suggestion) => (
              <motion.button
                key={suggestion}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInput(suggestion + "を教えてください")}
                className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm jp-text hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
              >
                {suggestion}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
