# ととのいヴィラ PAL - 民泊カスタマーサポート AIチャットボット

「ととのいヴィラ PAL」専用の24時間対応AIチャットボットです。iframe埋め込み対応で、DeepSeek APIとRAG技術を活用した多言語対応の自然な対話を実現します。

## 🌟 特徴

- **24時間自動対応**: いつでもゲストの質問に即座に回答
- **多言語対応**: 日本語・英語・中国語・韓国語に自動対応
- **iframe埋め込み対応**: 既存のWebサイトに簡単に組み込み可能
- **RAG技術**: 民泊固有の情報を学習して的確な回答を提供
- **ストリーミング応答**: リアルタイムでの自然な会話体験
- **管理画面**: ドキュメント管理とRAG検索テスト機能
- **レスポンシブデザイン**: モバイル・デスクトップ両対応

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15.4.5 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AI**: DeepSeek API
- **埋め込み**: OpenAI Embeddings API
- **データベース**: Supabase (Vector Database)
- **RAG**: カスタムRAGライブラリ
- **アニメーション**: Framer Motion
- **アイコン**: Lucide React

## 🚀 セットアップ

### 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd minpaku-chatbot
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`env.example`を`.env.local`にコピーして、必要な値を設定してください：

```bash
cp env.example .env.local
```

必要な環境変数：
- `DEEPSEEK_API_KEY`: DeepSeek APIキー
- `OPENAI_API_KEY_FOR_EMBEDDINGS`: OpenAI Embeddings APIキー（RAG用）
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `SUPABASE_ANON_KEY`: Supabase匿名キー
- `SUPABASE_SERVICE_ROLE_KEY`: Supabaseサービスロールキー
- 民泊情報（オプション）:
  - `MINPAKU_PROPERTY_NAME`: 施設名
  - `MINPAKU_ADDRESS`: 住所
  - `MINPAKU_CHECKIN_TIME`: チェックイン時間
  - `MINPAKU_CHECKOUT_TIME`: チェックアウト時間
  - `MINPAKU_WIFI_PASSWORD`: Wi-Fiパスワード
  - `MINPAKU_EMERGENCY_CONTACT`: 緊急連絡先

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションが起動します。

## 📁 プロジェクト構造

```
src/
├── app/                 # Next.js App Router
│   ├── admin/          # 管理画面
│   │   └── page.tsx    # ドキュメント管理・RAG検索テスト
│   ├── api/            # APIルート
│   │   ├── chat/       # チャットAPI
│   │   └── documents/  # ドキュメント管理API
│   ├── demo/           # デモページ
│   ├── embed/          # iframe埋め込み用ページ
│   ├── globals.css     # グローバルスタイル
│   └── page.tsx        # メインページ
├── components/
│   ├── chat/           # チャット関連コンポーネント
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── QuickReplies.tsx
│   │   └── TypingIndicator.tsx
│   └── ui/             # UIコンポーネント
├── config/
│   └── minpaku-config.ts # 民泊設定
├── data/
│   └── minpaku-documents.ts # 民泊ドキュメントデータ
├── lib/
│   ├── language-detection.ts # 言語検出
│   ├── rag.ts          # RAG機能
│   └── utils.ts        # ユーティリティ関数
├── types/
│   └── index.ts        # TypeScript型定義
database/               # データベーススキーマ
docs/                   # ドキュメント
```

## 🎨 デザインコンセプト

- **温かみのあるデザイン**: 民泊らしいホスピタリティを表現
- **日本的な美しさ**: Noto Sans JPフォントと適切な行間設定
- **シンプルで直感的**: 誰でも迷わず使えるUI
- **アクセシビリティ**: WCAG準拠のアクセシブルな設計

## 🌐 利用可能なページ

- **メインページ** (`/`): チャットボットのメイン画面
- **埋め込み用ページ** (`/embed`): iframe埋め込み専用の軽量版
- **デモページ** (`/demo`): 機能デモンストレーション
- **管理画面** (`/admin`): ドキュメント管理とRAG検索テスト

## 🔧 iframe埋め込み

他のWebサイトに埋め込む場合：

```html
<iframe 
  src="https://minpaku-chatbot-vercel.app/embed" 
  width="400" 
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
></iframe>
```

## 📝 カスタマイズ

### 民泊情報の設定

`src/config/minpaku-config.ts`で民泊固有の情報を設定：

```typescript
export const getMinpakuConfig = () => ({
  propertyName: process.env.MINPAKU_PROPERTY_NAME || 'ととのいヴィラ PAL',
  address: process.env.MINPAKU_ADDRESS || '長野県北佐久郡軽井沢町',
  checkinTime: process.env.MINPAKU_CHECKIN_TIME || '15:00',
  checkoutTime: process.env.MINPAKU_CHECKOUT_TIME || '11:00',
  // ... その他の設定
});
```

### ドキュメントデータの管理

`src/data/minpaku-documents.ts`でRAG用のドキュメントを管理：

```typescript
export const minpakuDocuments = [
  {
    id: 1,
    title: "チェックイン方法",
    content: "チェックインの詳細手順...",
    category: "チェックイン・アウト"
  },
  // ... その他のドキュメント
];
```

### デザインのカスタマイズ

- `src/app/globals.css`: CSS変数でカラーテーマを調整
- `tailwind.config.ts`: Tailwindの設定をカスタマイズ

## 🚀 デプロイ

### Vercelでのデプロイ

1. 環境変数の設定（Vercel Dashboard）:
```bash
vercel env add DEEPSEEK_API_KEY
vercel env add OPENAI_API_KEY_FOR_EMBEDDINGS
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

2. デプロイの実行:
```bash
npm run build
vercel --prod
```

### 現在のデプロイ状況

- **本番URL**: [https://minpaku-chatbot-vercel.app](https://minpaku-chatbot.vercel.app/)
- **ステータス**: ✅ 正常稼働中
- **最終デプロイ**: 2025-08-25

### その他のプラットフォーム

- Netlify
- AWS Amplify
- Railway

など、Next.jsをサポートする任意のプラットフォームにデプロイ可能です。

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License

## 🆘 サポート

質問や問題がある場合は、GitHubのIssuesページでお知らせください。
