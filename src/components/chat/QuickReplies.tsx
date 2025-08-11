"use client";

import { getLanguageConfig } from '@/lib/language-detection';

interface QuickRepliesProps {
  language: string;
  onQuickReply: (message: string) => void;
}

export default function QuickReplies({ language, onQuickReply }: QuickRepliesProps) {
  const langConfig = getLanguageConfig(language);
  
  return (
    <div className="px-4 py-3 bg-white border-t border-gray-100">
      <div className="mb-2">
        <span className="text-xs text-gray-500 font-medium">よく聞かれる質問</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {langConfig.quickReplies.map((reply, index) => (
          <button
            key={index}
            onClick={() => onQuickReply(reply)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
