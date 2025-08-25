"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  Search, 
  FileText, 
  RefreshCw, 
  Edit,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Document, SearchResult, InitResult, Category } from "@/types";

// カテゴリ定数
const CATEGORIES: Category[] = [
  { key: "施設情報", name: "🏠 施設情報・基本案内" },
  { key: "チェックイン・チェックアウト", name: "🔑 チェックイン・チェックアウト" },
  { key: "設備・アメニティ", name: "📶 WiFi・設備利用ガイド" },
  { key: "買い物・グルメ", name: "🛒 買い物・グルメ情報" },
  { key: "交通・アクセス", name: "🚗 交通・アクセス" },
  { key: "観光・グルメ", name: "🗾 観光スポット・レジャー" },
  { key: "緊急時・安全", name: "🚨 緊急時・安全対応" },
  { key: "ルール・マナー", name: "📋 ハウスルール・注意事項" }
];

export default function AdminDashboard() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<InitResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  
  // 編集・削除機能のstate
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  
  // カテゴリ一覧を取得
  const categories = CATEGORIES;

  // 新規追加機能のstate
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    category: CATEGORIES[0].key
  });
  const [isAdding, setIsAdding] = useState(false);

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
        message: 'ネットワークエラーが発生しました。',
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
      const response = await fetch(`/api/documents?category=${encodeURIComponent(category)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setDocuments(result.documents || []);
      setSelectedCategory(category);
    } catch (error) {
      console.error('Load documents error:', error);
      setDocuments([]);
      alert('ドキュメントの読み込みに失敗しました。');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // 編集機能
  const editDocument = (doc: Document) => {
    setEditingDoc(doc);
    setShowEditModal(true);
  };

  // 削除機能
  const deleteDocument = async (id: number) => {
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      
      if (result.success) {
        // ドキュメントリストを更新
        setDocuments(docs => docs.filter(doc => doc.id !== id));
        alert('ドキュメントを削除しました。');
      } else {
        alert('削除に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('Delete document error:', error);
      alert('削除中にエラーが発生しました。');
    }
  };

  // 一括削除機能
  const bulkDelete = async () => {
    if (selectedDocs.length === 0) {
      alert('削除するドキュメントを選択してください。');
      return;
    }
    
    if (!confirm(`${selectedDocs.length}件のドキュメントを削除してもよろしいですか？`)) {
      return;
    }
    
    for (const id of selectedDocs) {
      await deleteDocument(id);
    }
    setSelectedDocs([]);
  };

  // ドキュメント更新機能
  const updateDocument = async (doc: Document) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
      });
      const result = await response.json();
      
      if (result.success) {
        alert('ドキュメントを更新しました。');
        setShowEditModal(false);
        setEditingDoc(null);
        // リストを再読み込み
        if (selectedCategory) {
          loadDocumentsByCategory(selectedCategory);
        }
      } else {
        alert('更新に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('Update document error:', error);
      alert('更新中にエラーが発生しました。');
    }
  };

  // 新規追加機能
  const addDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      alert('タイトルと内容は必須です。');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDocument)
      });
      const result = await response.json();
      
      if (result.success) {
        alert('新しいドキュメントを追加しました。');
        setShowAddModal(false);
        setNewDocument({ title: '', content: '', category: CATEGORIES[0].key });
        // 現在選択中のカテゴリを再読み込み
        if (selectedCategory) {
          loadDocumentsByCategory(selectedCategory);
        }
      } else {
        alert('追加に失敗しました: ' + result.error);
      }
    } catch (error) {
      console.error('Add document error:', error);
      alert('追加中にエラーが発生しました。');
    } finally {
      setIsAdding(false);
    }
  };

  // 重複・矛盾チェック機能
  const checkDuplicatesAndConflicts = () => {
    if (documents.length === 0) {
      alert('チェックするドキュメントがありません。');
      return;
    }

    const duplicates: string[] = [];
    const conflicts: string[] = [];

    // 同じタイトルのチェック
    const titleMap = new Map<string, Document[]>();
    documents.forEach(doc => {
      const title = doc.title.toLowerCase();
      if (!titleMap.has(title)) {
        titleMap.set(title, []);
      }
      titleMap.get(title)!.push(doc);
    });

    titleMap.forEach((docs, title) => {
      if (docs.length > 1) {
        duplicates.push(`重複タイトル: "${title}" (${docs.length}件)`);
      }
    });

    // 矛盾する情報のチェック（例：Wi-Fiパスワード、営業時間など）
    const wifiDocs = documents.filter(doc => 
      doc.content.toLowerCase().includes('wi-fi') || 
      doc.content.toLowerCase().includes('wifi') ||
      doc.content.toLowerCase().includes('パスワード')
    );
    
    const passwords = new Set<string>();
    wifiDocs.forEach(doc => {
      const passwordMatch = doc.content.match(/パスワード[：:]\s*(\w+)/);
      if (passwordMatch) {
        passwords.add(passwordMatch[1]);
      }
    });
    
    if (passwords.size > 1) {
      conflicts.push(`Wi-Fiパスワードが複数存在: ${Array.from(passwords).join(', ')}`);
    }

    // 結果表示
    let message = '';
    if (duplicates.length > 0) {
      message += '【重複情報】\n' + duplicates.join('\n') + '\n\n';
    }
    if (conflicts.length > 0) {
      message += '【矛盾情報】\n' + conflicts.join('\n') + '\n\n';
    }
    
    if (message === '') {
      message = '重複や矛盾は見つかりませんでした。';
    }
    
    alert(message);
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
              🏠 ととのいヴィラ PAL 管理画面
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
              民泊情報の管理とチャットボット設定
            </p>
            <div className="flex justify-center space-x-4 text-sm text-gray-500">
              <span>📊 データ管理</span>
              <span>🔍 検索テスト</span>
              <span>✏️ 情報編集</span>
            </div>
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
              <h2 className="text-xl font-bold">🚀 クイックスタート</h2>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                <strong>初回セットアップ:</strong> まず「民泊情報を登録」ボタンでサンプルデータ（125件）を登録してください
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                登録後はカテゴリ別に情報を確認・編集できます
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => initializeDocuments(false)}
                disabled={isInitializing}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              >
                {isInitializing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                <span>📋 民泊情報を登録 (125件)</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => initializeDocuments(true)}
                disabled={isInitializing}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              >
                <Trash2 className="w-5 h-5" />
                <span>🗑️ 全削除＆再登録</span>
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
              <h2 className="text-xl font-bold">🔍 RAG検索テスト</h2>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">
                <strong>検索テスト:</strong> 実際のゲストの質問を入力してチャットボットの回答精度を確認
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                例: 「BBQの食材はどこで買えますか？」「Wi-Fiのパスワードは？」
              </p>
            </div>
            
            <div className="flex space-x-4 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                placeholder="例: BBQの食材はどこで買えますか？"
                className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={searchDocuments}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3 rounded-xl font-medium disabled:opacity-50 flex items-center space-x-2 shadow-lg"
              >
                {isSearching ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span>検索</span>
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold">📚 情報管理</h2>
              </div>
              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg"
                >
                  <Upload className="w-4 h-4" />
                  <span>➕ 新規追加</span>
                </motion.button>
                {documents.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={checkDuplicatesAndConflicts}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center space-x-2 shadow-lg"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>🔍 品質チェック</span>
                  </motion.button>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <strong>カテゴリを選択:</strong> 各カテゴリの情報を確認・編集できます
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                {categories.map((category) => (
                  <motion.button
                    key={category.key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => loadDocumentsByCategory(category.key)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedCategory === category.key
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-300 shadow-lg transform scale-105'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-200 shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-sm">{category.name}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {isLoadingDocs && (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
                <span className="ml-2 jp-text">読み込み中...</span>
              </div>
            )}

            {documents.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium jp-text">
                    {categories.find(c => c.key === selectedCategory)?.name} ({documents.length}件)
                  </h3>
                  {selectedDocs.length > 0 && (
                    <button
                      onClick={bulkDelete}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      選択した{selectedDocs.length}件を削除
                    </button>
                  )}
                </div>
                {documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-100 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDocs([...selectedDocs, doc.id]);
                              } else {
                                setSelectedDocs(selectedDocs.filter(id => id !== doc.id));
                              }
                            }}
                            className="rounded"
                          />
                          <h4 className="font-medium jp-text">{doc.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground jp-text line-clamp-3">
                          {doc.content.substring(0, 300)}...
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => editDocument(doc)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="編集"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingDocId(doc.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* 編集モーダル */}
          {showEditModal && editingDoc && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                <h3 className="text-xl font-bold mb-4">ドキュメント編集</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">タイトル</label>
                    <input
                      type="text"
                      value={editingDoc.title}
                      onChange={(e) => setEditingDoc({...editingDoc, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">カテゴリ</label>
                    <select
                      value={editingDoc.category}
                      onChange={(e) => setEditingDoc({...editingDoc, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {categories.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">内容</label>
                    <textarea
                      value={editingDoc.content}
                      onChange={(e) => setEditingDoc({...editingDoc, content: e.target.value})}
                      rows={8}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={() => updateDocument(editingDoc)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDoc(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 削除確認ダイアログ */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">削除確認</h3>
                <p className="mb-6">このドキュメントを削除してもよろしいですか？</p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={async () => {
                      if (deletingDocId) {
                        await deleteDocument(deletingDocId);
                        setShowDeleteConfirm(false);
                        setDeletingDocId(null);
                      }
                    }}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    削除
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletingDocId(null);
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 新規追加モーダル */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
                <h3 className="text-xl font-bold mb-4">新しいドキュメント追加</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">タイトル</label>
                    <input
                      type="text"
                      value={newDocument.title}
                      onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                      placeholder="例：冬季限定・こたつレンタル"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">カテゴリ</label>
                    <select
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {categories.map(cat => (
                        <option key={cat.key} value={cat.key}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">内容</label>
                    <textarea
                      value={newDocument.content}
                      onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                      placeholder="詳しい情報を入力してください..."
                      rows={8}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={addDocument}
                    disabled={isAdding}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isAdding ? '追加中...' : '追加'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewDocument({ title: '', content: '', category: categories[0].key });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
