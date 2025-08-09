"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  Search, 
  FileText, 
  RefreshCw, 

  Upload,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface Document {
  id: number;
  title: string;
  content: string;
  category: string;
  similarity?: number;
}

interface SearchResult extends Document {
  similarity: number;
}

export default function AdminDashboard() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{id: string, title: string, content: string, category: string, similarity?: number}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const categories = [
    { key: "チェックイン・チェックアウト", name: "チェックイン・チェックアウト" },
    { key: "設備・アメニティ", name: "WiFi・設備利用ガイド" },
    { key: "交通・アクセス", name: "周辺施設情報" },
    { key: "観光・グルメ", name: "よくある質問・トラブル対応" },
    { key: "緊急時・安全", name: "緊急時・安全" },
    { key: "ルール・マナー", name: "ハウスルール・注意事項" }
  ];

  const initializeDocuments = async (reset = false) => {
    setIsInitializing(true);
    setInitResult(null);
    
    try {
      const response = await fetch('/api/documents/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset })
      });
      
      const result = await response.json();
      setInitResult(result);
    } catch (error) {
      setInitResult({ 
        success: false, 
        error: 'ネットワークエラーが発生しました。' 
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/documents?query=${encodeURIComponent(searchQuery)}`);
      const result = await response.json();
      setSearchResults(result.documents || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadDocumentsByCategory = async (category: string) => {
    setIsLoadingDocs(true);
    try {
      console.log('Loading documents for category:', category);
      const response = await fetch(`/api/documents?category=${encodeURIComponent(category)}`);
      const result = await response.json();
      console.log('Category API response:', result);
      console.log('Documents found:', result.documents?.length || 0);
      setDocuments(result.documents || []);
      setSelectedCategory(category);
    } catch (error) {
      console.error('Load documents error:', error);
      setDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2 jp-text">
              RAG管理ダッシュボード
            </h1>
            <p className="text-muted-foreground jp-text">
              検索拡張生成システムの管理とテスト
            </p>
          </div>

          {/* 初期化セクション */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-orange-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Database className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold jp-text">データベース初期化</h2>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => initializeDocuments(false)}
                disabled={isInitializing}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-lg font-medium jp-text disabled:opacity-50 flex items-center space-x-2"
              >
                {isInitializing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>サンプルデータ登録</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => initializeDocuments(true)}
                disabled={isInitializing}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium jp-text disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>リセット＆再登録</span>
              </motion.button>
            </div>

            {initResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-4 rounded-lg ${
                  initResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {initResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium jp-text">
                    {initResult.success ? '成功' : 'エラー'}
                  </span>
                </div>
                <p className="text-sm jp-text mb-2">{initResult.message}</p>
                {initResult.stats && (
                  <div className="text-sm text-muted-foreground jp-text">
                    成功: {initResult.stats.success} / 失敗: {initResult.stats.errors} / 合計: {initResult.stats.total}
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* 検索セクション */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-orange-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Search className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold jp-text">類似検索テスト</h2>
            </div>
            
            <div className="flex space-x-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                placeholder="検索クエリを入力してください..."
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 jp-text"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={searchDocuments}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-2 rounded-lg font-medium jp-text disabled:opacity-50"
              >
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </motion.button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium jp-text">検索結果 ({searchResults.length}件)</h3>
                {searchResults.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-100 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium jp-text">{result.title}</h4>
                      <span className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                        {((result.similarity || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground jp-text line-clamp-2">
                      {result.content.substring(0, 200)}...
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* カテゴリ別ドキュメント表示 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-orange-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-bold jp-text">カテゴリ別ドキュメント</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {categories.map((category) => (
                <motion.button
                  key={category.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadDocumentsByCategory(category.key)}
                  className={`p-4 rounded-lg border text-left transition-colors jp-text ${
                    selectedCategory === category.key
                      ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                  }`}
                >
                  <div className="font-medium">{category.name}</div>
                </motion.button>
              ))}
            </div>

            {isLoadingDocs && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                <span className="ml-2 jp-text">読み込み中...</span>
              </div>
            )}

            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium jp-text">
                  {categories.find(c => c.key === selectedCategory)?.name} ({documents.length}件)
                </h3>
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-100 dark:border-gray-700"
                  >
                    <h4 className="font-medium jp-text mb-2">{doc.title}</h4>
                    <p className="text-sm text-muted-foreground jp-text line-clamp-3">
                      {doc.content.substring(0, 300)}...
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
