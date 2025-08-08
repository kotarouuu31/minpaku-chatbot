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
        "flex items-end space-x-2",
        isUser ? "justify-end flex-row-reverse space-x-reverse" : "justify-start"
      )}
    >
      {/* アバター */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser
            ? "bg-gradient-to-br from-blue-500 to-purple-500"
            : "bg-gradient-to-br from-orange-500 to-amber-500"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </motion.div>

      {/* メッセージバブル */}
      <div className="flex flex-col max-w-[75%]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className={cn(
            "px-4 py-3 rounded-2xl jp-text shadow-lg backdrop-blur-sm",
            isUser
              ? "bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-br-md"
              : "bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 border border-orange-100 dark:border-gray-700 rounded-bl-md"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </motion.div>
        
        {/* タイムスタンプ */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={cn(
            "text-xs mt-1 px-2 text-gray-500 dark:text-gray-400",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatTime(message.timestamp)}
        </motion.p>
      </div>
    </motion.div>
  );
}
