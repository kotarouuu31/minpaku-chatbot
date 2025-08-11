"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Minimize2, X, MessageCircle, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Message } from "@/types";
import { cn, scrollToBottom, postMessageToParent } from "@/lib/utils";
import { getLanguageConfig } from "@/lib/language-detection";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import LanguageSelector from "./LanguageSelector";
import QuickReplies from "./QuickReplies";

interface ChatInterfaceProps {
  isEmbedded?: boolean;
  welcomeMessage?: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export default function ChatInterface({
  isEmbedded = false,
  welcomeMessage,
  onClose,
  onMinimize,
}: ChatInterfaceProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('ja');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 言語設定を取得
  const currentLangConfig = getLanguageConfig(selectedLanguage);

  // 初期ウェルカムメッセージを設定
  useEffect(() => {
    const initialMessage: Message = {
      id: 'welcome',
      content: welcomeMessage || currentLangConfig.welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, [selectedLanguage, welcomeMessage]); // 言語変更時にウェルカムメッセージも更新

  useEffect(() => {
    if (messagesEndRef.current) {
      scrollToBottom(messagesEndRef.current.parentElement!);
    }
  }, [messages]);

  // 言語変更ハンドラー
  const handleLanguageChange = (newLanguage: string) => {
    setSelectedLanguage(newLanguage);
    
    const langConfig = getLanguageConfig(newLanguage);
    const languageChangeMessage: Message = {
      id: `lang-change-${Date.now()}`,
      content: langConfig.welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages([languageChangeMessage]);
  };

  // クイック返信ハンドラー
  const handleQuickReply = (quickReplyText: string) => {
    sendMessage(quickReplyText);
  };

  // メッセージ送信
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // ❌ 削除: クイック返信では自動言語検出を行わない
    // const detectedLang = detectLanguage(content);
    // if (detectedLang !== selectedLanguage) {
    //   setSelectedLanguage(detectedLang);
    // }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
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
          })),
          language: selectedLanguage
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
              } catch (parseError) {
                console.warn('JSON parse error:', parseError);
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
      sendMessage(input);
    }
  };

  const handleSendMessage = () => {
    sendMessage(input);
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
        "flex flex-col bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden",
        isEmbedded 
          ? "h-full w-full" 
          : "h-[600px] w-full max-w-[400px] mx-auto"
      )}
    >
      {/* 新しいヘッダーデザイン */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">ととのいヴィラ PAL</h2>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
              <span className="text-xs text-white/90">オンライン</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <LanguageSelector 
            selectedLanguage={selectedLanguage}
            onLanguageChange={handleLanguageChange}
          />
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <Minimize2 size={14} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* メッセージエリア - シンプル化 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* クイック返信エリア - メッセージが1つの時のみ表示 */}
      {messages.length === 1 && (
        <QuickReplies 
          language={selectedLanguage}
          onQuickReply={handleQuickReply}
        />
      )}

      {/* 入力エリア - すっきりデザイン */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={currentLangConfig.placeholderText}
            className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <Send size={16} className={cn(
              "transition-transform duration-200",
              isLoading && "animate-pulse"
            )} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
