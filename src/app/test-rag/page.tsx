'use client';

import { useState } from 'react';

export default function TestRAGPage() {
  const [initStatus, setInitStatus] = useState<string>('');
  const [testQuery, setTestQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, title: string, content: string, category: string, similarity?: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 初期データ投入テスト
  const initializeData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: false })
      });
      const data = await response.json();
      setInitStatus(JSON.stringify(data, null, 2));
    } catch (error) {
      setInitStatus(`Error: ${error}`);
    }
    setIsLoading(false);
  };

  // RAG検索テスト
  const testSearch = async () => {
    if (!testQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // GETリクエストでクエリパラメータとして検索
      const response = await fetch(`/api/documents?query=${encodeURIComponent(testQuery)}`);
      const data = await response.json();
      
      // デバッグ情報をコンソールに出力
      console.log('Search response:', data);
      console.log('Documents found:', data.documents?.length || 0);
      
      if (data.documents && Array.isArray(data.documents)) {
        setSearchResults(data.documents);
        console.log('Search results set:', data.documents);
      } else {
        console.error('Invalid response format:', data);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">RAG機能テスト</h1>
      
      {/* 初期化セクション */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">1. データベース初期化</h2>
        <button 
          onClick={initializeData}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? '処理中...' : '初期データ投入'}
        </button>
        {initStatus && (
          <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto">
            {initStatus}
          </pre>
        )}
      </div>

      {/* 検索テストセクション */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">2. RAG検索テスト</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
            placeholder="検索クエリを入力（例：チェックインはいつから？）"
            className="flex-1 px-3 py-2 border rounded"
          />
          <button 
            onClick={testSearch}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            検索
          </button>
        </div>
        
        {/* 検索結果表示 */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">検索結果:</h3>
            {searchResults.map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{result.title}</h4>
                  <span className="text-sm text-gray-500">
                    類似度: {((result.similarity || 0) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-gray-700">{result.content}</p>
                <span className="text-xs text-gray-500">[{result.category}]</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* サンプルクエリ */}
      <div className="p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">3. サンプル検索クエリ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            "チェックインの時間を教えて",
            "Wi-Fiのパスワードは？",
            "近くの観光地はどこ？",
            "エアコンが動かない",
            "緊急時の連絡先は？"
          ].map((query) => (
            <button
              key={query}
              onClick={() => setTestQuery(query)}
              className="text-left p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
