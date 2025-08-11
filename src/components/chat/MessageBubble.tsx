"use client";

import { motion } from "framer-motion";
import { Message } from "@/types";
import { cn, formatTime } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-end space-x-2 w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* AIアバター（左側にのみ表示） */}
      {!isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 mb-1"
        >
          <Bot className="w-3.5 h-3.5 text-white" />
        </motion.div>
      )}

      {/* メッセージコンテナ */}
      <div className={cn(
        "flex flex-col",
        isUser ? "items-end max-w-[85%]" : "items-start max-w-[85%]"
      )}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "px-3 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
            isUser
              ? "bg-blue-600 text-white rounded-br-md" // ユーザー: 青背景、右下角を直角
              : "bg-white text-gray-800 border border-gray-200 rounded-bl-md" // AI: 白背景、左下角を直角
          )}
        >
          <p className="whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </motion.div>
        
        {/* タイムスタンプ */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "text-xs mt-1 text-gray-500",
            isUser ? "mr-2" : "ml-2"
          )}
        >
          {formatTime(message.timestamp)}
        </motion.p>
      </div>

      {/* ユーザーアバター（右側にのみ表示） */}
      {isUser && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 mb-1"
        >
          <User className="w-3.5 h-3.5 text-white" />
        </motion.div>
      )}
    </motion.div>
  );
}
