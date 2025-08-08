"use client";

import { useState } from "react";
import ChatInterface from "@/components/chat/ChatInterface";
import { MessageCircle, Home as HomeIcon, Wifi, MapPin, Clock, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      {/* ヘッダー */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-orange-100 dark:border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                <HomeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground jp-text">民泊サポート</h1>
                <p className="text-sm text-muted-foreground jp-text">AIアシスタント</p>
              </div>
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setIsChatOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-full font-medium jp-text transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              チャットを開始
            </motion.button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 jp-text leading-tight">
              おかえりなさい
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                快適な滞在をサポート
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 jp-text leading-relaxed max-w-2xl mx-auto">
              24時間いつでも、民泊に関するご質問にお答えします。
              チェックイン方法、Wi-Fiパスワード、周辺情報など、
              何でもお気軽にお聞かせください。
            </p>
          </motion.div>

          {/* 機能カード */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 jp-text text-foreground">24時間対応</h3>
              <p className="text-muted-foreground jp-text">いつでもご質問にお答えします</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 jp-text text-foreground">即座に回答</h3>
              <p className="text-muted-foreground jp-text">AIが瞬時に適切な情報を提供</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-orange-100 dark:border-gray-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Wifi className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-3 jp-text text-foreground">施設情報</h3>
              <p className="text-muted-foreground jp-text">Wi-Fi、設備、周辺情報をご案内</p>
            </motion.div>
          </motion.div>

          {/* よくある質問 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-2 gap-4 mb-12"
          >
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsChatOpen(true)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold jp-text text-foreground">チェックイン方法は？</h4>
              </div>
              <p className="text-sm text-muted-foreground jp-text">到着時の手続きについてご案内します</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsChatOpen(true)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Wifi className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold jp-text text-foreground">Wi-Fiパスワードは？</h4>
              </div>
              <p className="text-sm text-muted-foreground jp-text">インターネット接続の設定方法</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsChatOpen(true)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Phone className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold jp-text text-foreground">緊急時の連絡先は？</h4>
              </div>
              <p className="text-sm text-muted-foreground jp-text">24時間対応の緊急連絡先をご案内</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsChatOpen(true)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-orange-100 dark:border-gray-700 cursor-pointer hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all"
            >
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                <h4 className="font-semibold jp-text text-foreground">周辺のおすすめスポット</h4>
              </div>
              <p className="text-sm text-muted-foreground jp-text">観光地、レストラン、コンビニ情報</p>
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-12 py-4 rounded-full text-lg font-bold jp-text shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            今すぐチャットを開始
          </motion.button>
        </div>
      </div>

      {/* フローティングチャットボタン */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 z-50 group"
          >
            <MessageCircle size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute -top-12 right-0 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap jp-text">
              チャットで質問
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* チャットインターフェース */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <ChatInterface
              onClose={() => setIsChatOpen(false)}
              onMinimize={() => setIsChatOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
