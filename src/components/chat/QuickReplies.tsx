"use client";

import { getLanguageConfig } from '@/lib/language-detection';

interface QuickRepliesProps {
  language: string;
  onQuickReply: (message: string) => void;
}

export default function QuickReplies({ language, onQuickReply }: QuickRepliesProps) {
  const langConfig = getLanguageConfig(language);
  
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 border-t">
      {langConfig.quickReplies.map((reply, index) => (
        <button
          key={index}
          onClick={() => onQuickReply(reply)}
          className="px-3 py-1 text-sm bg-white hover:bg-gray-100 border border-gray-200 rounded-full transition-colors"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
