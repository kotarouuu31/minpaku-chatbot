# 民泊カスタマーサポート AIチャットボット

24時間対応の民泊ゲスト向け自動サポートチャットボットです。iframe埋め込みで他サイトから利用可能で、OpenAI APIとRAG技術を活用して自然な日本語での対話を実現します。

## 🌟 特徴

- **24時間自動対応**: いつでもゲストの質問に即座に回答
- **iframe埋め込み対応**: 既存のWebサイトに簡単に組み込み可能
- **日本語最適化**: 美しい日本語タイポグラフィとフォント設定
- **レスポンシブデザイン**: モバイル・デスクトップ両対応
- **RAG技術**: 民泊固有の情報を学習して的確な回答を提供
- **アクセシビリティ対応**: 誰でも使いやすいUI設計

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **AI**: OpenAI API (Vercel AI SDK)
- **データベース**: Supabase (Vector Database)
- **RAG**: LangChain
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
- `OPENAI_API_KEY`: OpenAI APIキー
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `SUPABASE_ANON_KEY`: Supabase匿名キー
- `NEXT_PUBLIC_APP_URL`: アプリケーションURL

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションが起動します。

## 📁 プロジェクト構造

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # グローバルスタイル
│   └── page.tsx        # メインページ
├── components/
│   ├── chat/           # チャット関連コンポーネント
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── TypingIndicator.tsx
│   └── ui/             # UIコンポーネント
├── lib/
│   └── utils.ts        # ユーティリティ関数
├── types/
│   └── index.ts        # TypeScript型定義
docs/                   # ドキュメント
```

## 🎨 デザインコンセプト

- **温かみのあるデザイン**: 民泊らしいホスピタリティを表現
- **日本的な美しさ**: Noto Sans JPフォントと適切な行間設定
- **シンプルで直感的**: 誰でも迷わず使えるUI
- **アクセシビリティ**: WCAG準拠のアクセシブルな設計

## 🔧 iframe埋め込み

他のWebサイトに埋め込む場合：

```html
<iframe 
  src="https://your-domain.com" 
  width="400" 
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"
></iframe>
```

## 📝 カスタマイズ

### 民泊情報の設定

`src/types/index.ts`の`MinpakuInfo`インターフェースを参考に、民泊固有の情報を設定できます。

### デザインのカスタマイズ

- `src/app/globals.css`: CSS変数でカラーテーマを調整
- `tailwind.config.ts`: Tailwindの設定をカスタマイズ

## 🚀 デプロイ

### Vercelでのデプロイ

```bash
npm run build
vercel --prod
```

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
